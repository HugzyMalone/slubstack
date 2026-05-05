@AGENTS.md
@/home/hugoidle/Brain/Projects/slubstack/overview.md
@/home/hugoidle/Brain/Projects/slubstack/progress.md
@/home/hugoidle/Brain/Projects/slubstack/decisions.md
@/home/hugoidle/Brain/Projects/slubstack/problems.md
@/home/hugoidle/Brain/Projects/slubstack/roadmap.md
@/home/hugoidle/Brain/Projects/slubstack/ideas.md

# Slubstack

Mandarin, German & Spanish language PWA + brain-training games + trivia. Hub home screen. Next.js App Router + Supabase + Zustand.

## Stack

- **Next.js 16** (App Router, Turbopack) — see `AGENTS.md` for breaking changes
- **Supabase** — auth (Google OAuth + magic link + email/password), profiles, user_stats, leaderboards
- **Zustand** persisted to localStorage — per-language game state via context provider pattern
- **Framer Motion** — card animations
- **Tailwind CSS v4** with CSS custom properties — see Theme

## Theme — three-accent system (`app/globals.css`)

- `--accent` pastel purple — main brand, nav active states, XP chips
- `--game` pastel mauve/rose — trivia/game UI (ActorBlitz, timer, score)
- `--learn` pastel cyan — lesson interactions
- Light bg warm purple-tinted (`#f8f6fd`); dark bg deep navy-purple (`#100e1a`)
- Exposed via `@theme inline` — use `text-accent`, `bg-game`, `text-learn`

## Routes (high-level)

- `/` — Hub: static no-scroll, time-aware greeting, floating panda, fact callout, 2×2 (lg: 4-col) section grid with live `Lv. X` badges
- `/{spanish,mandarin,german,vibe-coding}` — skill trees + `/learn/[unitId]` lessons + `/review` flashcards
- `/skills` — skills hub (currently just Vibe Coding)
- `/trivia` + `/trivia/actors` — Actor Blitz
- `/brain-training` + `/{math-blitz,wordle}` — built; `memory-match`, `word-puzzles`, `speed-recall` planned
- `/stats` — Profile / Leaderboard / Settings (`ProfileClient.tsx`); `/stats/user/[userId]` public read-only
- `/onboarding`, `/review` (review hub), `/auth/callback`

For per-route details (Math Blitz, Wordle, Actor Blitz, etc.), read the page component directly — not duplicated here.

## Key files

- `app/layout.tsx` — root; AppSidebar + content `lg:ml-60`
- `app/page.tsx` — static hub; body scroll locked; live level badges from all stores
- `components/AppSidebar.tsx` — `lg+` only. Home active uses exact match (`p === "/"`)
- `components/BottomNav.tsx` — `lg:hidden`; hidden during lessons and on game pages (`/brain-training/wordle`, `/brain-training/math-blitz`, `/trivia/actors`)
- `components/TopBar.tsx` — mobile: `← Back` on non-home; chips hidden when logged out; tier-coloured level chip
- `components/SessionRunner.tsx` — runs lesson sessions, tracks `pandaMood`
- `components/cards/CardShell.tsx` — `fixed inset-0 z-40`, no-scroll lesson layout (covers sidebar intentionally)
- `components/CloudSync.tsx` — pushes XP to Supabase. Sends `totalXp = mandarin + german + spanish + vibe + brain + trivia` (all six stores). `user_stats.xp` is the canonical overall XP — TopBar chip and Profile headline both derive their level from the same six-store sum
- `lib/store.ts` — Zustand context: `createGameStore(key)`, `GameStoreProvider`, `useGameStore`. Stores: `slubstack-v1` (mandarin), `slubstack-german-v1`, `slubstack-spanish-v1`, `slubstack-vibe-v1`, `slubstack-brain-v1`, `slubstack-trivia-v1`
- `lib/content.ts` — `getLanguageContent(lang)`. Spanish/German/Vibe exclude `build`; Vibe also excludes `type`
- `lib/session.ts` — `buildUnitSession`, `buildReviewSession`, `buildPracticeSession` (fallback when no SRS-due cards)
- `lib/xp.ts`, `lib/srs.ts`, `lib/wordle-words.ts` (~700 words, daily seeded since 2026-04-19)
- `lib/supabase/admin.ts` — service-role client (server only, bypasses RLS)
- `proxy.ts` (root) — Next 16 proxy (formerly `middleware.ts`); refreshes Supabase session cookies. Export must be named `proxy`.

## Store / context pattern

```ts
<GameStoreProvider store={mandarinStore}>...</GameStoreProvider>
// Per-language layouts swap the store
useGameStore(s => s.xp)  // reads from nearest provider
```

## Interaction system

`LESSON_ORDER` = games only (no flip cards):
- `multiple-choice` — pick meaning from 4 options
- `type` — type English. Accepts digit↔word for numbers (`acceptedAnswers()` + `NUMBER_WORDS`)
- `build` — arrange character tiles (Mandarin only)
- `match` — tap-pair 4 word pairs

Per-language `allowedInteractions`: Mandarin all four; Spanish/German `[mc, type, match]`; Vibe Coding `[mc, match]`.

## Card shape

```ts
{ id, category, hanzi, pinyin, english, note? }
// Non-Mandarin: hanzi = the word, pinyin = pronunciation guide
// Vibe Coding: hanzi = technique, pinyin = example, english = purpose
```

Content lives in `content/{mandarin,german,spanish,vibe-coding}/{vocab,units}.json`.

## Level & Tier

`levelFromXp(xp) = Math.floor(Math.sqrt(xp / 50))` (`lib/xp.ts`).

| Tier | Min level | Colour |
|---|---|---|
| Bronze | 0 | `#cd7c54` |
| Silver | 5 | `#94a3b8` |
| Gold | 10 | `#f59e0b` |
| Platinum | 20 | `#b0bec5` |
| Diamond | 30 | `#60d5fa` |
| Emerald | 40 | `#10b981` |
| Obsidian | 50 | `#8b5cf6` |

Tier colours duplicated in `TopBar.tsx` and `ProfileClient.tsx` — keep in sync.

## Supabase schema

- `profiles` — id, username, email, avatar_url, status
- `user_stats` — user_id, xp (cross-language total), streak, words_learned, units_done, `state_json`/`german_state_json`/`spanish_state_json` (jsonb)
- `math_blitz_scores` — id, user_id, difficulty, score, correct, created_at. RLS: public read, auth insert.
- `wordle_scores` — unique(user_id, date). RLS: public read, auth insert.
- `actor_blitz_scores` — score, correct, total, best_streak, accuracy. See `supabase/schema.sql` (apply manually if missing).
- `avatars` — Storage bucket. Upload via `/api/avatar` (service-role) — direct browser upload blocked by RLS.

Project: `pbzpgyjyiprepxbzgkmf.supabase.co`. Use Supabase MCP for live schema/RLS inspection.

## Auth flow

1. Google OAuth or email magic link → `/auth/callback` → `/onboarding`
2. Returning: email+password or Continue with Google
3. Stay-signed-in always on (`slubstack_stay_signed_in`); checkbox removed
4. Avatar cached in `localStorage` as `slubstack_avatar`; username as `slubstack_username`
5. Password reset via Supabase `resetPasswordForEmail` from Settings tab

OAuth setup: Supabase Authentication → Providers → Google enabled with Google Cloud Client ID/Secret. Redirect URLs allowlist must include `https://slubstack.com/auth/callback` and `http://localhost:3000/auth/callback`.

## Avatar upload

`POST /api/avatar` (multipart) using service-role key — never direct from browser. **`SUPABASE_SERVICE_ROLE_KEY` must be set for Production in Vercel** (Preview/Dev only won't work). Profile uses `CropModal` (drag + pinch zoom, Canvas circular crop) before upload.

## XP awards

- Lesson completion → language store via `completeSession`
- Math Blitz → `correct * 5` to `brainTrainingStore` on game end
- Wordle → 75 XP (won) / 15 XP (lost) to `brainTrainingStore`, fires once per completion
- Actor Blitz → `correct * 8` to `triviaStore`

## Deployment

- GitHub: `HugzyMalone/slubstack`. Vercel auto-deploys on push to `main`. Use Vercel MCP after push to confirm deployment.
- Domain: `slubstack.com`. Email via Resend SMTP (`noreply@slubstack.com`)
- Required Vercel env (Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Testing

Playwright (`@playwright/test`), Chromium, auto-starts dev server. Smoke: `tests/e2e/smoke.spec.ts`. Full: `tests/e2e/full-verification.spec.ts`. Run: `pnpm exec playwright test`.

### Selector gotchas

- BottomNav has Home/Review/Profile only — language links are sidebar (lg+) only. Use `a[href="/stats"]`.
- Sidebar nav is always in DOM (even mobile). Scope to `aside` or `main`, not bare `nav`.
- Section cards on home: sidebar also has `/trivia` link — scope card selectors to `main`.
- Wordle tiles use only inline styles — match `div[style*="perspective"]`.
- Math Blitz: clicking difficulty enters countdown phase (~3.5s) before play. Don't assert on math text immediately; assert select screen disappears.
- Actor Blitz lobby: initial button is "Let's Go →" / "Loading actors…" — match `/let.s go|loading actors/i`.
- Home page facts contain apostrophes (`Alzheimer's`) which break `\w` — use `/.{40,}/` not `/\w{10,}/`.

## Conventions

- Named exports, no default exports
- All icons `lucide-react`
- Tailwind utility classes only
- Keep tier colour tables in sync (`TopBar.tsx` ↔ `ProfileClient.tsx`)
- `mandarinStore` is the legacy/default store — root `<GameStoreProvider>` uses it
- New games hide `BottomNav` on their route (game UI is full-screen)
