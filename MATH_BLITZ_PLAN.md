# Math Blitz — Full Roadmap

## What's built (MVP)

Single-player game at `/brain-training/math-blitz`:
- 30 second timer, 3 lives (wrong = lose a life)
- Difficulty select: Easy (+/−, to 10) · Medium (all ops, to 20) · Hard (all ops, to 50)
- Streak + speed bonus scoring (Mathletics-style)
- Personal best per difficulty stored in localStorage (`slubstack_mathblitz_best`)

### Scoring formula

```
base = 10 pts
speed bonus = +5 if answered in < 3s, +3 if < 5s
multiplier = ×1.5 at streak 3, ×2 at streak 5, ×3 at streak 10
points = round((base + speed) × multiplier)
```

---

## Phase 2 — Global Leaderboard

### Supabase table

```sql
create table math_blitz_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  score integer not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  correct_count integer not null,
  wrong_count integer not null,
  best_streak integer not null,
  created_at timestamptz default now()
);

-- RLS: anyone can read, authenticated users can insert their own
alter table math_blitz_scores enable row level security;
create policy "anyone can read" on math_blitz_scores for select using (true);
create policy "insert own" on math_blitz_scores for insert with check (auth.uid() = user_id);
```

### API routes

- `GET /api/math-blitz/leaderboard?difficulty=easy` — top 25 per difficulty
- `POST /api/math-blitz/scores` — submit a score (auth required)

### UI changes

On the result screen:
- "Submit score" button (only shown when user is signed in)
- Replace the placeholder leaderboard card with a real top-10 list per difficulty
- Add "Math Blitz" filter to the main leaderboard on `/stats`

---

## Phase 3 — Head-to-Head

### Concept

- Shareable room link: `slubstack.com/play/[roomCode]`
- Host picks the brain training game + difficulty (or lets challenger pick)
- No account needed to join (play as guest); having an account means your score is tracked
- Both players see the same questions simultaneously (seeded RNG)
- Live score update during the game (Supabase Realtime)

### Room flow

1. Host visits `/play` → generates a 6-char room code
2. Host shares link → challenger opens it → both see lobby screen
3. Host starts countdown → both enter "playing" at the same time
4. Side-by-side scores visible in real-time
5. Result screen shows who won + both scores

### Supabase schema

```sql
create table game_rooms (
  code text primary key,            -- 6-char alphanumeric
  game text not null,               -- 'math-blitz' | future games
  difficulty text,                  -- null = challenger picks
  host_id uuid,                     -- null if guest host
  host_username text not null,
  challenger_id uuid,
  challenger_username text,
  seed integer not null,            -- shared RNG seed
  status text default 'waiting',   -- waiting | countdown | playing | done
  host_score integer,
  challenger_score integer,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '1 hour'
);

alter table game_rooms enable row level security;
create policy "anyone can read and write rooms" on game_rooms using (true) with check (true);
```

### Realtime channels

```ts
const channel = supabase.channel(`room:${code}`)
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_rooms", filter: `code=eq.${code}` }, handler)
  .subscribe();
```

### Shared RNG (same questions for both players)

Use a seeded PRNG so both players get identical question sequences without needing a server to generate them:

```ts
// Simple LCG seeded PRNG
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// On room create: store Math.floor(Math.random() * 2**31) as seed
// Both clients init their question generators with this seed
```

---

## Phase 4 — Multi-game Lobby

The head-to-head lobby should eventually support all brain training games:
- Math Blitz (built)
- Memory Match (planned)
- Word Puzzles (planned)
- Speed Recall (planned)

Route: `/play` — lobby hub
- Create room → pick game from a grid of available games
- Join room (via link or code) → see what game host picked

---

## Route map

```
/brain-training          → hub (list of all games)
/brain-training/math-blitz → Math Blitz (built)
/play                    → Head-to-head lobby hub (phase 3)
/play/[code]             → Active room (phase 3)
```

---

## Open questions

- Should guest players (no account) be able to see a personal best across sessions?
  - Option A: localStorage only (current approach for single player)
  - Option B: Assign a random guest token stored in localStorage + tie scores to it
- Real-time: Supabase Realtime should be sufficient for 2-player. Partykit/PartyServer if we want > 2 players or ultra-low latency.
- Difficulty parity in H2H: both on same difficulty, or each picks their own and it's about relative score?
