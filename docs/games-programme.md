# Games Programme — M1 Competitive Spine (Technical Design)

Status: **design only**. No feature code yet. This doc is the contract for M1.

M1 ships four features that share one set of plumbing: **Ranked Elo ladder**, **Daily Challenge**, **Universal share cards**, **Async ghost duels**. The guiding constraint is that every game is already a `SprintAdapter`/`RoundAdapter` (`lib/multiplayer/types.ts`) and there is already a working live-multiplayer stack (`MultiplayerShell`, `live_matches`/`live_match_players`/`live_ratings`, `finalise_live_match`/`find_or_create_waiting_live_match`, `updateRatings`, `simulateBotTimeline`). **We build on that — we do not replace it.**

> `pbzpgyjyiprepxbzgkmf` is **live prod**. Every migration below is additive only (`create … if not exists`, `add column if not exists`, new function overloads). No `drop`, no type changes, no destructive ops on existing tables. The one place we touch ranked semantics (rated bots) is a new function overload defaulted **off** and gated on a decision flag — see Risks.

---

## What already exists (reused, not rebuilt)

| Capability | Where | Used by |
|---|---|---|
| Per-(user, gameKind/ratingKind, level) ratings with rating/matches/wins/draws/losses | table `live_ratings` (PK `user_id, game_kind, level`) | F1 |
| Match + per-slot results, ELO before/after | tables `live_matches`, `live_match_players` | F1, F4 |
| Atomic finalise (bots, player updates, rating upserts, ≥2-human guard, rating-kind override) | RPC `finalise_live_match(...)` | F1 |
| Queue allocation | RPC `find_or_create_waiting_live_match(...)` | F1, F4 |
| Ranked leaderboard read | `GET /api/live/leaderboard?kind=&level=` | F1 |
| Elo maths (K=32 <30 matches else 16; ≥2-human guard) | `lib/multiplayer/elo.ts` `updateRatings()` | F1 |
| Deterministic bots as `BotTickEvent[]` (`{atMs, scoreDelta}`) | `lib/multiplayer/bot.ts` `simulateBotTimeline()` | F4 |
| Sprint match loop (queue→countdown→play→submit→podium, bot slots, ELO compute) | `components/multiplayer/MultiplayerShell.tsx` | F1, F4 |
| Adapter `ratingKind` → ladder routing | `SprintAdapter.ratingKind` + result route | F1 |
| Share-card string generators + `shareOrCopy()` native-share/clipboard | `lib/share.ts` | F3 |
| Daily seed: `getTodayStr()`, `getDayIndex(date)` (EPOCH `2026-04-19`), `getDailyWord()` | `lib/wordle-words.ts` | F2 |
| Seed→rng helpers `seedToInt`, `mulberry32`, `pickN` | `lib/games/geo-clone/seedRng.ts` | F2, F4 |
| League XP push | `lib/leagues.ts` `pushLeagueXp()` → `POST /api/leagues/xp` | F2 |

**Headline:** the Elo *engine and storage* for F1 are already in prod via the live-match path. F1 is mostly **surfacing + a low-player-count rating story**. F2 and F4 are net-new (no daily/ghost/duel tables or routes exist today). F3 is a generalisation of an existing module.

---

## Feature 1 — Ranked Elo ladder, surfaced to players

### What's missing
The ladder writes and per-(kind, level) board read already exist. Missing: (a) a **player-facing ranked surface** (route + hub entry + "your rank"), (b) a **global** board across games, (c) a **story for low player counts** so ratings actually move when most matches are 1 human + 3 bots.

### The ≥2-human problem
`updateRatings()` returns `[]` with <2 humans, and `finalise_live_match` skips rating upserts unless `p_humans_count >= 2`. At ~20 players this means a ranked ladder that almost never moves. Three options:

- **A — Rated bots (recommended).** Give each bot a fixed notional rating per level (e.g. Easy 1000 / Medium 1250 / Hard 1500), let a lone human earn/lose rating against them on a **separate vs-bot path** with **halved K** and a **per-day gain cap**. Only this makes the board feel alive below ~20 players.
- B — Pure human-only Elo. Honest but the board is frozen until concurrency rises. Bad first impression.
- C — Provisional/unrated bot matches shown but not scored. Same frozen-board problem, more UI.

**Recommendation: A**, because it's the only option that fits Hugo's actual player count. Tradeoff: bot rating is arbitrary and farmable, so it must be (i) capped per day, (ii) halved K vs bots, (iii) clearly labelled "vs bots" in match history. **This changes ranked semantics on prod and needs Hugo's sign-off** (see Risks / Decisions).

### Design (Option A)
- Code constant `RANKED_BOT_RATING: Record<level, number>` in `lib/multiplayer/elo.ts`.
- Extend Elo compute with a vs-bot pass: new `updateRatingsWithBots(players, { botK, dailyCapByUser })` — does **not** touch the existing `updateRatings` (keep it pure for ≥2-human matches). `MultiplayerShell` calls the bot variant only when `humansCount < 2` **and** a new `ranked` flag is set.
- New `finalise_live_match` overload `p_allow_bot_rating boolean default false` (additive function version; existing 7-arg version stays). Upserts ratings on the vs-bot path only when the flag is true and the daily cap is respected (cap enforced in the RPC against `live_ratings.updated_at`/a daily delta column, or in code pre-upsert).
- Global board: derive in a read API from `live_ratings` (no new table). Define **global rating = max rating across that user's ladders** (simplest, least gameable) or average; recommend **max**.

### API surface
- `GET /api/live/leaderboard?kind=<ladder>&level=<1..3>&limit=` — **exists**, reuse for per-game boards.
- `GET /api/ranked/global?limit=` — **new**, read-only. Returns each user's best ladder rating + which game it's from. Derived from `live_ratings`, no migration.
- `GET /api/ranked/me?kind=&level=` — **new**, read-only. Caller's rating/rank/W-D-L for "your rank" chip. (Or fold into the existing leaderboard response.)

### Route + UI
- `/ranked` route + hub entry (distinct from `/stats` XP/tier). Tabs per game ladder + a Global tab; "your rank" header. XP/tier stays exactly as-is — **rank is a separate, competitive axis**.

### Files touched
- `lib/multiplayer/elo.ts` (add `RANKED_BOT_RATING`, `updateRatingsWithBots`; leave `updateRatings`).
- `components/multiplayer/MultiplayerShell.tsx` (vs-bot rating path behind a flag).
- `app/api/ranked/global/route.ts`, `app/api/ranked/me/route.ts` (new reads).
- `app/ranked/page.tsx` + hub entry in `app/page.tsx`.
- Migration: new `finalise_live_match` overload (additive).
- **Reuses** `live_ratings`, `live_matches`, existing leaderboard route, `find_or_create_waiting_live_match`, the adapter `ratingKind` field. No duplication.

---

## Feature 2 — Daily Challenge

One rotating game per day, globally-shared seed, one leaderboard per day, per-user streak. Reuses each adapter's `generateQuestions(level, seed)` / `generateLocations(seed, count)`.

### Daily selection — derived, not scheduled
Reuse the Wordle pattern: `dayIndex = getDayIndex(getTodayStr())`, then `game = DAILY_ROTATION[dayIndex % DAILY_ROTATION.length]`, `seed = getTodayStr()` (e.g. `"2026-05-31"`), fixed `level` per rotation entry. **No schedule table** — derivation is identical on every client and the server, and survives restarts. A `daily_overrides` table can be added later for editorial control; not in M1.

`DAILY_ROTATION` lives in a new `lib/games/daily.ts` alongside the adapter registry.

### Tables (new)
```sql
-- one score per user per day (mirrors wordle_scores shape/RLS)
create table if not exists public.daily_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  game_kind text not null,
  score integer not null default 0,
  correct integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);
create index if not exists daily_results_date_score_idx
  on public.daily_results (date, score desc);

-- denormalised streak for cheap reads/leaderboard
create table if not exists public.daily_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current integer not null default 0,
  longest integer not null default 0,
  last_played date,
  updated_at timestamptz not null default timezone('utc', now())
);
```
RLS: both **public read, authenticated insert/own-update** (the established pattern). Streak update done in a `security definer` RPC `submit_daily_result(p_date, p_game_kind, p_score, p_correct)` that inserts the result (on-conflict do-nothing → one attempt/day) and recomputes streak (`current+1` if `last_played = date-1`, else reset to 1; bump `longest`). RPC avoids a client-side race on streak.

### API surface
- `GET /api/daily` → `{ date, gameKind, level, seed, alreadyPlayed: boolean }`.
- `POST /api/daily/result` `{ score, correct }` → calls `submit_daily_result`; returns `{ rank, streak }`.
- `GET /api/daily/leaderboard?date=` → top N for that day from `daily_results` joined to `profiles`.

### Route + UI
- `/daily` route + hub entry (with streak flame + "played ✓"). Renders the day's adapter via a thin solo runner (reuse the adapter's `PlayBoard` + `generateQuestions`; **no live match/queue** — daily is solo against the clock). On finish: submit + share card (F3).

### Files touched
- `lib/games/daily.ts` (rotation + adapter registry lookup), new API routes, `app/daily/page.tsx`, hub entry.
- **Reuses** `getDayIndex`/`getTodayStr` (`lib/wordle-words.ts`), every adapter's `generateQuestions`, `pushLeagueXp`, the score-table RLS pattern. Daily does **not** touch `live_ratings` (it's not ranked).

---

## Feature 3 — Universal share cards

Generalise `lib/share.ts`. Today it has one bespoke function per game (`wordleShareCard`, `mathBlitzShareCard`, `connectionsShareCard`, `actorBlitzShareCard`) + `shareOrCopy()`. M1 adds a generic generator any end-screen can call.

### Design
- New generic in `lib/share.ts`:
  ```ts
  buildShareCard({ title, score, correct, total, pb, history, footerTag }): string
  ```
  produces the same NYT-style emoji block the existing cards use (🟩/🟥 history rows, header, `slubstack.com` footer). Existing per-game functions stay (don't break Wordle/Connections), but **new games and the Daily/Ghost end-screens use the generic one**.
- Optional adapter hook: add `shareLine?: (result) => { title; history?: ("correct"|"wrong")[] }` to `SprintAdapter`/`RoundAdapter` so the end-screen can do `buildShareCard(adapter.shareLine(result))` with zero per-screen code.
- New small client component `components/games/ShareButton.tsx` wrapping `shareOrCopy()` + a sonner toast ("Copied"/"Shared"), reused by every end-screen including Daily and Ghost.

### Files touched
- `lib/share.ts` (add `buildShareCard`; keep existing exports), `lib/multiplayer/types.ts` (optional `shareLine`), `components/games/ShareButton.tsx` (new).
- **Reuses** `shareOrCopy()` and the existing emoji-grid convention. No migration. No backend.

---

## Feature 4 — Async ghost duels

Record a player's run; a friend replays against it later via a deep-link. **A ghost is a deterministic bot fed the recorded run** — it plugs straight into the existing bot mechanism (`BotTickEvent[]` = `{atMs, scoreDelta}`), no new replay engine.

### Recording
The shell already computes per-answer points/correct and tracks `playStartRef`. Add an accumulator that, during a normal/ranked sprint, records `{ atMs, scoreDelta }` per answered question — i.e. **the exact `BotTickEvent[]` shape**. On finish, optionally save the run.

### Table (new)
```sql
create table if not exists public.ghost_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_kind text not null,
  level smallint not null,
  seed text not null,
  score integer not null,
  correct integer not null,
  timeline jsonb not null,        -- BotTickEvent[]: [{atMs, scoreDelta}, ...]
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists ghost_runs_user_idx on public.ghost_runs (user_id, created_at desc);
```
RLS: **public read by id** (anyone with the deep-link can load the ghost), **authenticated insert own**. No updates/deletes needed.

### Replay through the existing bot loop
The ghost occupies one bot slot. In `startCountdown`, instead of `simulateBotTimeline(seed, tuning, GAME_MS, slot)`, use the ghost's stored `timeline`. **Same `seed` ⇒ same questions ⇒ the recorded scoreDeltas line up answer-for-answer.** Everything downstream (LiveScoreTicker, Podium) is unchanged because a ghost is just a bot with a different timeline source.

### Shell change — `mode` prop
`MultiplayerShell` gains a `mode: "live" | "ghost"` (default `"live"`, so existing games are untouched). In `"ghost"` mode it **skips queue/match RPCs**, runs solo + 1 ghost slot, forces `seed` and `level` from the ghost run, and does **not** write `live_ratings` (ghost duels are casual, not ranked — avoids farming).

### API + deep-link
- `POST /api/ghost/run` `{ game_kind, level, seed, score, correct, timeline }` → `{ runId }`.
- `GET /api/ghost/run/[id]` → the run (public read).
- Route `/duel/[runId]` → loads the run, boots `MultiplayerShell` (or the game's wrapper) in `mode="ghost"`. "Beat my score" share = `slubstack.com/duel/<runId>` via `buildShareCard` (F3).

### Files touched
- `supabase/migrations` (`ghost_runs`), `app/api/ghost/run/route.ts`, `app/api/ghost/run/[id]/route.ts`, `app/duel/[runId]/page.tsx`.
- `components/multiplayer/MultiplayerShell.tsx` (record accumulator + `mode="ghost"` branch).
- **Reuses** `BotTickEvent`/the bot tick loop, the adapter `generateQuestions` + `seed`, `Podium`/`LiveScoreTicker`, `buildShareCard`. No new replay engine, no Elo write.

---

## Consolidated DB migration plan (additive only — touches LIVE prod)

One migration file per concern, all idempotent, applied in order. **Nothing below alters or drops an existing table/column.**

| # | File | Adds | Prod risk |
|---|---|---|---|
| 1 | `2026XXXX_daily_challenge.sql` | tables `daily_results`, `daily_streaks` + RLS (public read / auth insert) + RPC `submit_daily_result` | Low — new tables only |
| 2 | `2026XXXX_ghost_runs.sql` | table `ghost_runs` + RLS (public read / auth insert) | Low — new table only |
| 3 | `2026XXXX_ranked_bot_rating.sql` | **new overload** `finalise_live_match(… , p_allow_bot_rating boolean default false)` | **Medium — touches ranked path. Defaulted off. Needs decision.** |

How to apply safely:
1. Review each file; confirm every statement is `create … if not exists` / `add column if not exists` / `create policy` (preceded by `drop policy if exists` on the **new** policy name only) / new function signature.
2. Apply via the Supabase MCP (or dashboard SQL editor) against `pbzpgyjyiprepxbzgkmf` **one file at a time**, verifying row counts unaffected on `live_ratings`/`live_matches` after #3.
3. #3 ships the function overload **before** any code sets `p_allow_bot_rating = true`, so behaviour is identical until F1's rated-bot decision is taken and the flag flipped in code.
4. Mirror all three into `supabase/schema.sql` so the canonical schema stays accurate.

F1 surfacing and F3 share cards require **no migration**.

---

## API surface (all four features)

| Method + route | New/exists | Shape |
|---|---|---|
| `GET /api/live/leaderboard?kind=&level=&limit=` | exists | `{ kind, level, entries: [{rank,userId,username,avatarUrl,rating,matches,wins,draws,losses}] }` |
| `GET /api/ranked/global?limit=` | new (read) | `{ entries: [{rank,userId,username,avatarUrl,rating,topGame}] }` |
| `GET /api/ranked/me?kind=&level=` | new (read) | `{ rating, rank, wins, draws, losses, matches }` |
| `GET /api/daily` | new | `{ date, gameKind, level, seed, alreadyPlayed }` |
| `POST /api/daily/result` | new | body `{ score, correct }` → `{ rank, streak }` |
| `GET /api/daily/leaderboard?date=` | new | `{ date, entries: [{rank,userId,username,avatarUrl,score,correct}] }` |
| `POST /api/ghost/run` | new | body `{ game_kind, level, seed, score, correct, timeline }` → `{ runId }` |
| `GET /api/ghost/run/[id]` | new | `{ id, gameKind, level, seed, score, correct, timeline }` |

All writes go through service-role admin client + RLS-respecting reads, matching the existing `/api/live/*` and `/api/scores/*` conventions (named exports, no default exports).

---

## Build order within M1 (with dependencies)

1. **F3 — Universal share cards.** No deps, pure util + one component. Unblocks the Daily and Ghost end-screens. Smallest, lowest risk — do first.
2. **F1 — Ranked surfacing.** Read-only first: `/api/ranked/global` + `/api/ranked/me` + `/ranked` route reusing the existing leaderboard. Then **take the rated-bot decision** → migration #3 + `updateRatingsWithBots` + shell flag. (Read surface ships even if the rated-bot decision is deferred.)
3. **F2 — Daily Challenge.** Depends on adapters' `generateQuestions` (exists) and F3 (daily result share). Migration #1 + `lib/games/daily.ts` + routes + `/daily`.
4. **F4 — Async ghost duels.** Last: it edits the shared `MultiplayerShell` most invasively (record accumulator + `mode="ghost"`). Depends on F3 (deep-link share) and the `BotTickEvent` loop. Migration #2 + routes + `/duel/[runId]`.

F3 → F1(read) can run in parallel; F2 and F4 both depend on F3.

---

## Risk flags & decisions for Hugo

**Needs a decision:**
- **Rated bots (F1).** Recommended Option A changes ranked semantics on live prod (a lone human can move rating vs bots). Mitigations: halved K vs bots, per-day gain cap, "vs bots" label. **Irreversible-ish**: once players accumulate bot-inflated ratings on prod, resetting the ladder is a visible reset. Confirm before flipping `p_allow_bot_rating`. Alternative is a frozen board until concurrency grows.
- **Global rating definition (F1).** Max-across-ladders (recommended, least gameable) vs average vs sum. Affects the Global board only.

**Could break existing games — mitigate:**
- **`MultiplayerShell` is shared by every sprint game.** F1's vs-bot path and F4's `mode="ghost"` both edit it. Gate both behind flags/props defaulted to current behaviour; integration-smoke every live game after each change (Math Blitz scoring-asymmetry and CAD hole-collapse both slipped past per-task review — run an end-to-end pass).
- **`finalise_live_match` overload (#3).** Add a new signature; do **not** modify the in-use 7-arg version. Existing math/trivia ranked finalise stays byte-identical.
- **`updateRatings` stays pure** — add `updateRatingsWithBots` rather than branching the existing function used by all ≥2-human matches.

**Irreversible on prod:**
- Any rating write (F1 rated bots). Daily/ghost tables are append-only and isolated — safe to add and, if needed, drop later without touching the competitive ladder.

**Verification gate:** UI is "shipped" only after a real phone-smoke (iOS Safari) of `/ranked`, `/daily`, and a `/duel/<id>` link — per the project's phone-smoke discipline. `pnpm build` clean is necessary, not sufficient.
