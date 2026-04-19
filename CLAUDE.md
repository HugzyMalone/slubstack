@AGENTS.md

# Slubstack

Mandarin, German & Spanish language PWA with a hub home screen. Next.js App Router + Supabase + Zustand.

## Stack
- **Next.js 16** (App Router, Turbopack) — see AGENTS.md for version caveats
- **Supabase** — auth (magic link + email/password), profiles, user_stats, leaderboard
- **Zustand** (persisted to localStorage) — per-language game state
- **Framer Motion** — card animations
- **Tailwind CSS v4** with CSS custom properties (`--accent`, `--bg`, `--surface`, etc.)

## Theme / colour system
Three-accent system defined in `app/globals.css`:
- `--accent` — pastel purple (`#b08ee8` light / `#c4a8f0` dark) — main brand, nav active states, XP chips
- `--game` — pastel mauve/rose (`#e085c4` light / `#f0a8dd` dark) — trivia/game UI (ActorBlitz buttons, timer, score)
- `--learn` — pastel cyan (`#67e8f9` light / `#a5f3fc` dark) — lesson interactions
- Light bg is warm purple-tinted: `--bg: #f8f6fd`, `--surface: #ffffff`, `--border: #e4ddf5`
- Dark mode is deep navy-purple: `--bg: #100e1a`, `--surface: #1c1830`, `--border: #2e2845`
- All exposed to Tailwind via `@theme inline` — use `text-accent`, `bg-game`, `text-learn` etc.

## Desktop layout
- `components/AppSidebar.tsx` — fixed left sidebar, **only visible on `lg+`** (hidden on mobile). Contains brand + nav links (Home, Spanish, Mandarin, German, Trivia) + Profile at bottom. Uses `usePathname` for active states. Active item: accent left border + tinted bg.
- `app/layout.tsx` — AppSidebar added. Content wrapped in `<div className="flex flex-1 flex-col lg:ml-60">` to offset from sidebar.
- `components/BottomNav.tsx` — has `lg:hidden` so it only shows on mobile.
- `components/TopBar.tsx` — on mobile shows wordmark on home (`/`), shows a subtle `← Back` button on all other pages. XP/streak chips + avatar on right. Desktop sidebar handles brand.
- Lesson overlay (`CardShell`) uses `fixed inset-0` — covers sidebar during lessons (intentional, immersive).

## App structure

### Routes
- `/` — Hub page: three accordions (Languages, Brain Training, Trivia) — all collapsed by default
- `/spanish` — Spanish skill tree
- `/spanish/learn/[unitId]` — Spanish lesson (games only: MC, Type, Match)
- `/spanish/review` — Spanish flashcard review
- `/mandarin` — Mandarin skill tree
- `/mandarin/learn/[unitId]` — Mandarin lesson (fixed full-screen, no scroll)
- `/mandarin/review` — Mandarin flashcard review
- `/german` — German skill tree
- `/german/learn/[unitId]` — German lesson
- `/german/review` — German flashcard review
- `/trivia` — Trivia hub
- `/trivia/actors` — Actor Blitz game
- `/brain-training` — Brain Training hub (Math Blitz + Wordle live; Memory Match, Word Puzzles, Speed Recall coming soon)
- `/brain-training/math-blitz` — Math Blitz game (fully built)
- `/brain-training/wordle` — Daily Wordle game (fully built)
- `/stats` — Profile / leaderboard / settings
- `/onboarding` — First-time setup (avatar, username, password)
- Legacy `/learn/[unitId]` and `/review` still work (mandarin defaults)

### Key files
- `app/layout.tsx` — root layout; has AppSidebar + content wrapper with `lg:ml-60`
- `app/page.tsx` — hub with panda hero + 3 accordion sections (Languages, Brain Training, Trivia). All use shared `AccordionSection` component. All collapsed by default.
- `app/brain-training/page.tsx` — Brain Training hub; Math Blitz + Wordle live, others coming soon
- `app/brain-training/math-blitz/page.tsx` — Math Blitz game (self-contained client component)
- `app/brain-training/wordle/page.tsx` — Daily Wordle game (self-contained client component)
- `app/mandarin/layout.tsx` — provides `mandarinStore` via context
- `app/german/layout.tsx` — provides `germanStore` via context (separate isolated progress)
- `app/trivia/actors/page.tsx` — **synchronous** (no async fetch). Builds actor list from `ACTOR_CONFIGS` using local `/public/actors/*.jpg` images. No Wikipedia API calls at runtime.
- `app/api/avatar/route.ts` — server-side avatar upload using service role key (bypasses RLS). Accepts multipart form data, uploads to `avatars/{userId}/avatar.jpg` in Supabase storage.
- `components/AppSidebar.tsx` — desktop sidebar (lg+ only)
- `components/SkillTree.tsx` — shared skill tree, takes `units`, `basePath`, `greeting` props
- `components/SessionRunner.tsx` — runs a lesson session, tracks `pandaMood`, resets on each card
- `components/cards/CardShell.tsx` — **fixed full-screen** lesson layout (z-40), top 45vh = panda, bottom = question, no scrolling
- `components/cards/CardFooter` — fixed z-50, always above CardShell
- `components/Panda.tsx` — mood-mapped images (idle/happy/wrong/sad/celebrating/sleeping), supports `fill` prop for CSS-sized containers
- `components/TopBar.tsx` — shows `← Back` (router.back()) on all non-home pages on mobile; wordmark on home only
- `components/BottomNav.tsx` — `lg:hidden`; hidden during lessons (`/*/learn/*`); Flashcards tab follows current language section
- `components/CloudSync.tsx` — syncs language store to Supabase; mounted in all three language layouts (mandarin/german/spanish). Accepts `lang` prop.
- `components/trivia/ActorBlitz.tsx` — Actor Blitz game component. Images from local `/public/actors/`. Uses `var(--game)` (pastel mauve) for all game UI. Answer correct delay 300ms, wrong delay 700ms.
- `lib/store.ts` — Zustand context pattern: `createGameStore(key)` factory, `GameStoreProvider`, `useGameStore` reads from nearest provider. `mandarinStore` = key `slubstack-v1`, `germanStore` = `slubstack-german-v1`, `spanishStore` = `slubstack-spanish-v1`
- `lib/content.ts` — `getLanguageContent(lang)` returns `{ cards, units, getCard, getCardsForUnit, getUnit, allowedInteractions }`. Spanish/German exclude "build"; Spanish/German/Mandarin all have "match".
- `lib/session.ts` — `buildUnitSession` uses `LESSON_ORDER` (no flip — games only). `buildReviewSession` uses `REVIEW_ORDER` (includes flip for flashcard tool). Both take content as param.
- `lib/hooks.ts` — `useHydrated` (useSyncExternalStore), `useNow` (useState/useEffect — NOT useSyncExternalStore, which caused infinite loop with Date.now())
- `lib/supabase/admin.ts` — Supabase admin client using `SUPABASE_SERVICE_ROLE_KEY` (server-only, bypasses RLS)
- `lib/wordle-words.ts` — ~700-word answer pool, `getDailyWord()`, `getDayIndex()`, `getTodayStr()`, `isValidGuess()`
- `lib/xp.ts`, `lib/srs.ts`, `lib/utils.ts` — utilities

## Math Blitz (`app/brain-training/math-blitz/page.tsx`)
- 30 second countdown timer, 3 lives (3 wrong = game over)
- Difficulty select upfront: Easy (+/−, to 10), Medium (all ops, to 20), Hard (all ops, to 50)
- Scoring: 10pts base + speed bonus (+5 if <3s, +3 if <5s) × streak multiplier (×1.5 at 3, ×2 at 5, ×3 at 10)
- Personal best per difficulty stored in localStorage (`slubstack_mathblitz_best`)
- All game state in `liveRef` to avoid stale closures in timer callbacks; React state only for display
- Result screen shows inline top-5 leaderboard for the played difficulty (fetched 800ms after game ends)
- Full leaderboard at `/stats/math-blitz`; scores stored in `math_blitz_scores` table
- Full roadmap (head-to-head rooms, multi-game lobby) in `MATH_BLITZ_PLAN.md`

## Wordle (`app/brain-training/wordle/page.tsx`)
- NYT-style daily word puzzle: 6 tries to guess a 5-letter word
- 3D tile flip reveal animation (Framer Motion, staggered per column via `rotateX`)
- QWERTY on-screen keyboard with colour-coded key states (correct > present > absent priority)
- Physical keyboard support via `window.addEventListener('keydown')`
- Daily word from `lib/wordle-words.ts` — ~700-word pool, seeded by day index since 2026-04-19
- Game state persisted in localStorage (`slubstack_wordle`) keyed by date — restores in-progress games on reload
- Share button copies emoji grid to clipboard (`Slubstack Wordle #N · X/6`)
- Daily leaderboard via `/api/scores/wordle` — shows all users' scores for today, signed-in only
- Scores stored in `wordle_scores` table (unique per user per date — can't resubmit)

## Avatar upload
- Upload goes through `/api/avatar` (POST, multipart) using the service role key — never direct from browser client (RLS blocks it)
- **`SUPABASE_SERVICE_ROLE_KEY` must be set for Production in Vercel** — adding it to Preview/Development only won't work
- Profile photo upload opens a circular crop modal first: drag to reposition, pinch to zoom, then "Use photo" crops to circle via Canvas API and sends the blob to `/api/avatar`
- No emoji avatar picker — photo upload only. Existing emoji avatars still display correctly (AvatarDisplay handles both URL and emoji string)

## Profile / Settings (`app/stats/ProfileClient.tsx`)
- Three tabs: Profile, Leaderboard, Settings
- Settings tab: photo upload (with crop modal), username, status (emoji allowed in status text), save button
- Account section: signed-in email display, Forgot password button (sends Supabase reset email), Sign out
- No emoji avatar picker, no danger zone / reset progress
- `CropModal` component: uses pointer events + refs for live gesture state (no stale closure issues). Pinch-to-zoom via two-pointer distance tracking. CSS `transform: scale()` on image — no explicit width/height (prevents distortion).

## Actor Blitz trivia game
- **Images**: 32 actor JPGs stored in `public/actors/` (e.g. `tom_hanks.jpg`, `samuel_l._jackson.jpg`). Filename = `name.replace(/ /g, "_").toLowerCase() + ".jpg"`. **Do not use Wikipedia API or proxy** — Wikimedia rate-limits server IPs (429). Local files serve instantly from Vercel CDN.
- **Game UI uses `var(--game)` (pastel mauve)** — not `var(--accent)` (purple). Keep these separate.
- `app/api/img/route.ts` exists but is no longer used for actor images. Can be repurposed or deleted.
- ActorBlitz has image loading skeleton + `onError` fallback (🎬 emoji) + `fade-in` CSS animation on actor change.

## Content
- `content/mandarin/vocab.json` + `units.json` — 8 units, ~160 cards
- `content/german/vocab.json` + `units.json` — 7 units: Greetings, Numbers, Colors, Food & Drink, Family, Verbs, Days & Time (111 cards)
- `content/spanish/vocab.json` + `units.json` — 8 units: Greetings, Numbers, Colors, Food & Drink, Verbs, Family, Days & Time, Places (116 cards)

Card shape (all languages):
```ts
{ id, category, hanzi, pinyin, english, note? }
// German/Spanish: hanzi = the word, pinyin = pronunciation guide
```

## Interaction system
Lessons use `LESSON_ORDER` (no flip cards — interactive games only):
- `"multiple-choice"` — pick the meaning from 4 options
- `"type"` — type the English meaning
- `"build"` — arrange character tiles (Mandarin only)
- `"match"` — tap to match 4 word-pairs across two columns (all languages)

Flashcard review uses `REVIEW_ORDER` (includes `"flip"` for self-rated SRS review).

Per-language `allowedInteractions`:
- Mandarin: `["multiple-choice", "build", "type", "match"]`
- German: `["multiple-choice", "type", "match"]`
- Spanish: `["multiple-choice", "type", "match"]`

## Panda character
- **Hub page**: fills 32vh (max 280px), `mood="happy"` — hero
- **Review empty state**: fills 45vh, `mood="sleeping"`
- **Skill tree pages**: 200px, `mood="idle"`
- **Lesson pages**: fills 45vh zone in CardShell, reacts to answers:
  - idle → `/3dpanda.png`
  - happy (correct) → `/3dpanda-wink.png`
  - wrong (incorrect) → `/3dpanda-angry.png`
  - celebrating → `/3dpanda-wink2.png`
  - sad/sleeping → `/3dpanda-sad.png`
- Card components call `onFeedback(correct)` on answer reveal → SessionRunner sets pandaMood

## Lesson screen layout (CardShell)
`fixed inset-0 z-40` — covers TopBar/BottomNav/Sidebar, no scrolling:
1. Progress bar (shrink-0, ~48px)
2. Panda (45vh, reacts to answers)
3. Question content (flex-1, overflow-hidden)
4. Answer buttons (CardFooter, fixed z-50)

Card text sizes automatically by word length (`wordSize()` helper in each card component) to prevent overflow on long German words.

## Store / context pattern
```ts
// Root layout wraps everything:
<GameStoreProvider store={mandarinStore}>...</GameStoreProvider>

// Language layouts override for their section:
// app/mandarin/layout.tsx → mandarinStore
// app/german/layout.tsx  → germanStore

// All components just call:
useGameStore(s => s.xp)  // reads from nearest provider
```

## Supabase schema
- `profiles` — id, username, email, avatar_url, status
- `user_stats` — user_id, xp, streak, words_learned, units_done, updated_at, state_json, german_state_json, spanish_state_json (all jsonb)
- `math_blitz_scores` — id, user_id, difficulty (easy/medium/hard), score, correct, created_at. RLS: public read, auth insert. Index on (difficulty, score DESC).
- `wordle_scores` — id, user_id, date, attempts (1–6), solved, created_at. Unique(user_id, date). RLS: public read, auth insert. Index on (date, solved, attempts).
- `avatars` — Supabase Storage bucket for profile photos

## Auth flow
1. New user: magic link → `/auth/callback` → `/onboarding` (pick avatar, set username + password)
2. Returning user: email + password on Profile page
3. Stay-signed-in uses `localStorage`/`sessionStorage` flag (`slubstack_stay_signed_in`)
4. Avatar cached in `localStorage` as `slubstack_avatar`
5. Password reset: Supabase `resetPasswordForEmail` triggered from Settings tab

## Deployment
- GitHub: `HugzyMalone/slubstack` — Vercel auto-deploys on push to `main`
- Domain: slubstack.com
- Supabase project: `pbzpgyjyiprepxbzgkmf.supabase.co`
- Email via Resend SMTP (`noreply@slubstack.com`)
- Vercel env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (all must be set for **Production**)

## Planned / not yet built
- Brain Training games (Memory Match, Word Puzzles, Speed Recall) — see `MATH_BLITZ_PLAN.md` for full roadmap incl. head-to-head
- Head-to-head multiplayer lobby (`/play/[roomCode]`) — see `MATH_BLITZ_PLAN.md`
- More trivia game modes (Sports Stars, Music Icons)
