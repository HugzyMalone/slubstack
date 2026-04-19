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
- `components/TopBar.tsx` — on mobile shows wordmark on home (`/`), shows a subtle `← Back` button on all other pages. XP/streak chips + avatar on right — **hidden when user is not logged in**. Desktop sidebar handles brand.
- Lesson overlay (`CardShell`) uses `fixed inset-0` — covers sidebar during lessons (intentional, immersive).

## App structure

### Routes
- `/` — Hub page: **static, no-scroll**. Animal hero (28vh) + hourly rotating fact + 4 section cards (Languages, Skills, Brain Training, Trivia). Body scroll locked via `useEffect`. No dynamic data. Fact rotates once per hour based on `Math.floor(Date.now() / 3600000) % FACTS.length` — 105 facts across languages, brain science, history, tech, etc.
- `/spanish` — Spanish skill tree
- `/spanish/learn/[unitId]` — Spanish lesson (games only: MC, Type, Match)
- `/spanish/review` — Spanish flashcard review
- `/mandarin` — Mandarin skill tree
- `/mandarin/learn/[unitId]` — Mandarin lesson (fixed full-screen, no scroll)
- `/mandarin/review` — Mandarin flashcard review
- `/german` — German skill tree
- `/german/learn/[unitId]` — German lesson
- `/german/review` — German flashcard review
- `/skills` — Skills hub: lists all skill curricula (currently just Vibe Coding), shows level badge per skill
- `/vibe-coding` — Vibe Coding skill tree (Claude/prompting curriculum)
- `/vibe-coding/learn/[unitId]` — Vibe Coding lesson (MC, Type, Match)
- `/vibe-coding/review` — Vibe Coding flashcard review
- `/trivia` — Trivia hub
- `/trivia/actors` — Actor Blitz game
- `/brain-training` — Brain Training hub (Math Blitz + Wordle live; Memory Match, Word Puzzles, Speed Recall coming soon)
- `/brain-training/math-blitz` — Math Blitz game (fully built)
- `/brain-training/wordle` — Daily Wordle game (fully built)
- `/stats` — Profile / leaderboard / settings
- `/stats/user/[userId]` — Public read-only profile page for any leaderboard user
- `/onboarding` — First-time setup (avatar, username, password)
- `/review` — Review hub: accordion sections (Languages + Vibe Coding, Brain Training, Trivia). Tap to expand, reveals sub-items with live localStorage stats, each navigates to that game/review page.
- `/spanish/review`, `/mandarin/review`, `/german/review`, `/vibe-coding/review` — Flashcard review pages. **Practice button always shows** when user has learned cards (not just when SRS cards are due). When cards are due: shows due count + Practice. When nothing is due: shows "Practice to earn XP". Practice session runs via `SessionRunner` → awards XP via `completeSession` on completion. If no SRS-due cards, falls back to `buildPracticeSession` (all seen cards).
- Legacy `/learn/[unitId]` and `/review` still work (mandarin defaults)

### Key files
- `app/layout.tsx` — root layout; has AppSidebar + content wrapper with `lg:ml-60`
- `app/page.tsx` — static no-scroll hub. Animal hero + hourly rotating fact (105 facts) + 3 section cards. No banners, no continue card, no badges. Body scroll locked on mount.
- `app/brain-training/page.tsx` — Brain Training hub; Math Blitz + Wordle live, others coming soon
- `app/brain-training/math-blitz/page.tsx` — Math Blitz game (self-contained client component)
- `app/brain-training/wordle/page.tsx` — Daily Wordle game (self-contained client component)
- `app/languages/page.tsx` — **client component** (reads Zustand stores directly via `useStore`). Shows `Lv. X` badge per language using live XP.
- `app/mandarin/layout.tsx` — provides `mandarinStore` via context
- `app/german/layout.tsx` — provides `germanStore` via context (separate isolated progress)
- `app/vibe-coding/layout.tsx` — provides `vibeCodingStore` via context + `<CloudSync lang="vibe-coding" />`
- `app/trivia/actors/page.tsx` — **synchronous** (no async fetch). Builds actor list from `ACTOR_CONFIGS` using local `/public/actors/*.jpg` images. No Wikipedia API calls at runtime.
- `app/api/avatar/route.ts` — server-side avatar upload using service role key (bypasses RLS). Accepts multipart form data, uploads to `avatars/{userId}/avatar.jpg` in Supabase storage.
- `app/api/user/[userId]/route.ts` — public profile API: returns username, avatar, status, xp, streak for any user (no auth required).
- `components/AppSidebar.tsx` — desktop sidebar (lg+ only). Home nav item uses exact match (`p === "/"`) — do not add other paths to its match function or it will show as active on language pages.
- `components/SkillTree.tsx` — shared skill tree, takes `units`, `basePath`, `greeting` props
- `components/SessionRunner.tsx` — runs a lesson session, tracks `pandaMood`, resets on each card
- `components/cards/CardShell.tsx` — **fixed full-screen** lesson layout (z-40), top 45vh = panda, bottom = question, no scrolling
- `components/cards/CardFooter` — fixed z-50, always above CardShell
- `components/Panda.tsx` — mood-mapped images (idle/happy/wrong/sad/celebrating/sleeping), supports `fill` prop for CSS-sized containers
- `components/TopBar.tsx` — shows `← Back` (router.back()) on all non-home pages on mobile; wordmark on home only. Right side shows streak (from `useGlobalStore`) + level chip (from `useGameStore` XP via root mandarinStore) + profile avatar — all hidden when user is not logged in (gated on `loggedIn` state derived from `supabase.auth.getSession`). On mount, syncs `globalStore.streak` to the max of all three language store streaks (fixes historical divergence). Level chip colour is tier-based (see Level & Tier system).
- `components/BottomNav.tsx` — `lg:hidden`; hidden during lessons (`/*/learn/*`) **and on all game pages** (`/brain-training/wordle`, `/brain-training/math-blitz`, `/trivia/actors`) so the nav never overlaps game UI. Uses per-tab opacity/scale transitions (not `layoutId` FLIP — avoids layout measurement jank).
- `components/CloudSync.tsx` — syncs language store to Supabase; mounted in all four language/skill layouts (mandarin/german/spanish/vibe-coding). Accepts `lang` prop. On every push it reads XP from all four raw stores and sends `totalXp` (sum) so `user_stats.xp` always reflects the cross-language total.
- `components/trivia/ActorBlitz.tsx` — Actor Blitz game component. Images from local `/public/actors/`. Uses `var(--game)` (pastel mauve) for all game UI. Answer correct delay 300ms, wrong delay 700ms. Submits score to `/api/scores/actor-blitz` on game end (fire-and-forget, fails silently if unauthenticated).
- `lib/store.ts` — Zustand context pattern: `createGameStore(key)` factory, `GameStoreProvider`, `useGameStore` reads from nearest provider. `mandarinStore` = key `slubstack-v1`, `germanStore` = `slubstack-german-v1`, `spanishStore` = `slubstack-spanish-v1`, `vibeCodingStore` = `slubstack-vibe-v1`
- `lib/content.ts` — `getLanguageContent(lang)` returns `{ cards, units, getCard, getCardsForUnit, getUnit, allowedInteractions }`. Spanish/German/Vibe Coding exclude "build"; all four languages have "match".
- `lib/session.ts` — `buildUnitSession` uses `LESSON_ORDER` (no flip — games only). `buildReviewSession` uses `REVIEW_ORDER` (games only — MC, type, match — no flip). `buildPracticeSession` builds a session from all seen cards ignoring SRS due dates (used when no cards are due but user wants to practice). All take content as param.
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
- Leaderboard shown inline in the Profile leaderboard tab (Math Blitz filter); `/stats/math-blitz` page still exists as standalone. Scores stored in `math_blitz_scores` table.
- Full roadmap (head-to-head rooms, multi-game lobby) in `MATH_BLITZ_PLAN.md`
- BottomNav hidden on `/brain-training/math-blitz`. No in-game back link — TopBar provides the back button. Do not add back links to select or result screen.

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
- **Two-phase layout**: playing phase uses `height: calc(100dvh - 52px - env(safe-area-inset-top, 0px))` flex-col (header shrink-0 → toast shrink-0 → grid flex-1 min-h-0 → keyboard shrink-0) — fits on screen with no scroll. Result/won/lost phase switches to normal scrollable layout. BottomNav is hidden on this route.
- Tile: 52px, gap 4px. Keyboard key: 48px tall, 32px wide (ENTER/⌫ 52px wide), 4px gap. Sized to fit iPhone SE and up without scroll.

## Avatar upload
- Upload goes through `/api/avatar` (POST, multipart) using the service role key — never direct from browser client (RLS blocks it)
- **`SUPABASE_SERVICE_ROLE_KEY` must be set for Production in Vercel** — adding it to Preview/Development only won't work
- Profile photo upload opens a circular crop modal first: drag to reposition, pinch to zoom, then "Use photo" crops to circle via Canvas API and sends the blob to `/api/avatar`
- No emoji avatar picker — photo upload only. Existing emoji avatars still display correctly (AvatarDisplay handles both URL and emoji string)

## Level & Tier system
`lib/xp.ts`: `levelFromXp(xp) = Math.floor(Math.sqrt(xp / 50))`. Tiers defined in both `TopBar.tsx` and `ProfileClient.tsx` (keep in sync):
| Tier | Min level | Colour |
|---|---|---|
| Bronze | 0 | `#cd7c54` |
| Silver | 5 | `#94a3b8` |
| Gold | 10 | `#f59e0b` |
| Platinum | 20 | `#b0bec5` |
| Diamond | 30 | `#60d5fa` |
| Emerald | 40 | `#10b981` |
| Obsidian | 50 | `#8b5cf6` |

- TopBar shows `Lv. X` in the tier colour (replaces XP counter).
- Profile card badge shows `{TierName} · Lv. X` with tier colour background/border; XP bar also uses tier colour.
- `LessonCompleteScreen` shows an animated per-language level bar: fills from pre-lesson progress → post-lesson progress. On level-up: bar fills to 100%, resets, then fills to new level's progress with a "Level Up!" badge.

## Profile / Settings (`app/stats/ProfileClient.tsx`)
- Three tabs: Profile, Leaderboard, Settings
- Profile tab: avatar, tier badge, XP bar (based on **total XP** = mandarin + german + spanish combined), streak + XP strip, **Language Levels** card (per-language XP bar + tier for Spanish/Mandarin/German). No medals, no streak shield.
- Leaderboard tab: filter pills — Overall, Mandarin, German, Spanish, Actor Blitz, Math Blitz. All filters show inline lists (no link-out buttons). Language leaderboards fetch from `/api/leaderboard?lang=X`. Math Blitz has Easy/Medium/Hard sub-filter. Actor Blitz fetches from `/api/scores/actor-blitz`.
- Settings tab: photo upload (with crop modal), username, status (emoji allowed in status text), save button
- Account section: signed-in email display, Forgot password button (sends Supabase reset email), Sign out
- No emoji avatar picker, no danger zone / reset progress, no streak shield, no medals
- `CropModal` component: uses pointer events + refs for live gesture state (no stale closure issues). Pinch-to-zoom via two-pointer distance tracking. CSS `transform: scale()` on image — no explicit width/height (prevents distortion).
- Username cached in `localStorage` as `slubstack_username` (alongside `slubstack_avatar`) for instant load before API response.
- Shows a skeleton while auth is being verified (instead of blank screen).

## Actor Blitz trivia game
- **Images**: 32 actor JPGs stored in `public/actors/` (e.g. `tom_hanks.jpg`, `samuel_l._jackson.jpg`). Filename = `name.replace(/ /g, "_").toLowerCase() + ".jpg"`. **Do not use Wikipedia API or proxy** — Wikimedia rate-limits server IPs (429). Local files serve instantly from Vercel CDN.
- **Game UI uses `var(--game)` (pastel mauve)** — not `var(--accent)` (purple). Keep these separate.
- `app/api/img/route.ts` exists but is no longer used for actor images. Can be repurposed or deleted.
- ActorBlitz has image loading skeleton + `onError` fallback (🎬 emoji) + `fade-in` CSS animation on actor change.
- BottomNav hidden on `/trivia/actors`. No in-game back link — TopBar provides the back button. Do not add back links to lobby or results screen.
- Scores submitted to `actor_blitz_scores` table via `/api/scores/actor-blitz` on game end. Leaderboard shown inline in the Profile leaderboard tab.

## Content
- `content/mandarin/vocab.json` + `units.json` — 8 units, ~160 cards
- `content/german/vocab.json` + `units.json` — 7 units: Greetings, Numbers, Colors, Food & Drink, Family, Verbs, Days & Time (111 cards)
- `content/spanish/vocab.json` + `units.json` — 8 units: Greetings, Numbers, Colors, Food & Drink, Verbs, Family, Days & Time, Places (116 cards)
- `content/vibe-coding/vocab.json` + `units.json` — 6 units, 88 cards: Prompting Basics, Claude Code Essentials, Project Scaffolding, Debugging with Claude, Iterate & Refine, Web App Patterns

Card shape (all languages):
```ts
{ id, category, hanzi, pinyin, english, note? }
// German/Spanish: hanzi = the word, pinyin = pronunciation guide
// Vibe Coding: hanzi = technique name, pinyin = example snippet, english = what it achieves
```

## Vibe Coding (`app/vibe-coding/`)
- Full mirror of language sections (skill tree, lessons, review, CloudSync XP)
- 88 Claude-focused flashcards: prompt patterns, Claude Code features, scaffolding strategies, debugging approaches, web app architecture rules
- `allowedInteractions`: `["multiple-choice", "type", "match"]` — no build (Mandarin-only)
- Card format: technique name (`hanzi`) + example snippet (`pinyin`) → purpose (`english`)
- MC: show technique → pick purpose. Type: show purpose → type technique name. Match: 4 technique↔purpose pairs
- `vibeCodingStore` key: `slubstack-vibe-v1`. vibeXp counted in `totalXp` sent to Supabase
- Shown in AppSidebar (with 0/6 progress pip), Review hub, and Profile Language Levels card
- Uses bear character (same as German)

## Interaction system
Lessons use `LESSON_ORDER` (no flip cards — interactive games only):
- `"multiple-choice"` — pick the meaning from 4 options
- `"type"` — type the English meaning. Accepts digit input for number words (e.g. "2" accepted when answer is "two") and vice versa. `norm()` preserves digits; `acceptedAnswers()` expands with digit↔word alternatives via `NUMBER_WORDS` map (0–20, 100, 1000, 10000).
- `"build"` — arrange character tiles (Mandarin only)
- `"match"` — tap to match 4 word-pairs across two columns (all languages)

Flashcard review uses `REVIEW_ORDER` (games only — MC, type, match). No flip cards in review.

Per-language `allowedInteractions`:
- Mandarin: `["multiple-choice", "build", "type", "match"]`
- German: `["multiple-choice", "type", "match"]`
- Spanish: `["multiple-choice", "type", "match"]`

## Lesson complete screen (`components/LessonCompleteScreen.tsx`)
- **No-scroll**: body scroll locked on mount; fixed height `calc(100dvh - 52px - env(safe-area-inset-top, 0px))`.
- Layout: character (22vh/180px max) → title → XP counter → flex-1 spacer → level bar → stats row → Done button.
- Level bar animates on a delay: if no level-up, fills from old progress → new progress (700ms ease-out). If level-up: fills to 100% → resets → "Level Up!" badge pops in → fills to new level's progress.

## Panda character
- **Hub page**: fills 28vh (max 240px), random mood — hero
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
- `user_stats` — user_id, xp (**total across all 3 languages**), streak, words_learned, units_done, updated_at, state_json, german_state_json, spanish_state_json (all jsonb). `xp` is kept up-to-date by CloudSync which sends `totalXp = mandarinXp + germanXp + spanishXp` on every push.
- `math_blitz_scores` — id, user_id, difficulty (easy/medium/hard), score, correct, created_at. RLS: public read, auth insert. Index on (difficulty, score DESC).
- `wordle_scores` — id, user_id, date, attempts (1–6), solved, created_at. Unique(user_id, date). RLS: public read, auth insert. Index on (date, solved, attempts).
- `actor_blitz_scores` — id, user_id, score, correct, total, best_streak, accuracy, created_at. RLS: public read, auth insert. Index on (score DESC). See `supabase/schema.sql` — must be created manually in Supabase dashboard if not already present.
- `avatars` — Supabase Storage bucket for profile photos

## Auth flow
1. New user: magic link → `/auth/callback` → `/onboarding` (pick avatar, set username + password)
2. Returning user: email + password on Profile page
3. Stay-signed-in uses `localStorage`/`sessionStorage` flag (`slubstack_stay_signed_in`)
4. Avatar cached in `localStorage` as `slubstack_avatar`
5. Password reset: Supabase `resetPasswordForEmail` triggered from Settings tab

## Testing
- Playwright (`@playwright/test`) installed, config at `playwright.config.ts` — targets Chromium only, auto-starts dev server
- Smoke tests: `tests/e2e/smoke.spec.ts` — home, Spanish, Mandarin load checks
- Full verification suite: `tests/e2e/full-verification.spec.ts` — covers all routes, nav, API, 404
- Run with: `pnpm exec playwright test`

### Playwright selector gotchas
- **BottomNav** has Home (`/`), Review (`/review`), Profile (`/stats`) tabs only — language links (`/spanish` etc.) are desktop sidebar only. Use `a[href="/stats"]` to target BottomNav.
- **Sidebar nav** is always in the DOM (even on mobile) — `nav` locators that don't scope to viewport-visible elements will find the hidden sidebar. Prefer `aside` or scope to `main`.
- **Section cards on home page**: the sidebar also has a `/trivia` link — scope card selectors to `main` to avoid double-counting.
- **Wordle tiles** use only inline styles (no class names) — use `div[style*="perspective"]` to find tile wrappers.
- **Math Blitz phases**: clicking a difficulty goes to `countdown` (3→2→1→Go!, ~3.5s) before `playing`. Don't assert on math question text immediately; assert the select screen disappears instead.
- **Actor Blitz lobby**: initial state shows "Let's Go →" / "Loading actors…" button — no actor images until the game starts. Match `/let.s go|loading actors/i`.
- **Hourly fact regex**: home page facts contain apostrophes (`Alzheimer's`) which break `\w` sequences — use `/.{40,}/` not `/\w{10,}/` to match any fact.

## Deployment
- `proxy.ts` (root) — Next.js 16 proxy (formerly `middleware.ts`); refreshes Supabase session cookies on every request. Export must be named `proxy` (not `middleware`).
- GitHub: `HugzyMalone/slubstack` — Vercel auto-deploys on push to `main`
- Domain: slubstack.com
- Supabase project: `pbzpgyjyiprepxbzgkmf.supabase.co`
- Email via Resend SMTP (`noreply@slubstack.com`)
- Vercel env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (all must be set for **Production**)

## Planned / not yet built
- Brain Training games (Memory Match, Word Puzzles, Speed Recall) — see `MATH_BLITZ_PLAN.md` for full roadmap incl. head-to-head
- Head-to-head multiplayer lobby (`/play/[roomCode]`) — see `MATH_BLITZ_PLAN.md`
- More trivia game modes (Sports Stars, Music Icons)
