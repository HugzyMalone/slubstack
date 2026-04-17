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
- `--accent` — orange (`#f97316` light / `#fb923c` dark) — main brand, nav active states, XP chips
- `--game` — purple (`#8b5cf6` light / `#a78bfa` dark) — trivia/game UI (ActorBlitz buttons, timer, score)
- `--learn` — blue (`#3b82f6` light / `#60a5fa` dark) — lesson interactions
- Dark mode is Claude-like near-black: `--bg: #0d0d0d`, `--surface: #1a1a1a`, `--border: #2a2a2a`
- All exposed to Tailwind via `@theme inline` — use `text-accent`, `bg-game`, `text-learn` etc.

## Desktop layout (added)
- `components/AppSidebar.tsx` — fixed left sidebar, **only visible on `lg+`** (hidden on mobile). Contains brand + nav links (Home, Spanish, Mandarin, German, Trivia) + Profile at bottom. Uses `usePathname` for active states. Active item: orange accent left border + tinted bg.
- `app/layout.tsx` — AppSidebar added. Content wrapped in `<div className="flex flex-1 flex-col lg:ml-60">` to offset from sidebar.
- `components/BottomNav.tsx` — has `lg:hidden` so it only shows on mobile.
- `components/TopBar.tsx` — brand link has `lg:hidden` (sidebar has brand on desktop). Inner div uses `max-w-xl lg:max-w-none` to span full width on desktop.
- Lesson overlay (`CardShell`) uses `fixed inset-0` — covers sidebar during lessons (intentional, immersive).

## App structure

### Routes
- `/` — Hub page: pick Spanish, Mandarin, German, or Trivia
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
- `/stats` — Profile / leaderboard / settings
- `/onboarding` — First-time setup (avatar, username, password)
- Legacy `/learn/[unitId]` and `/review` still work (mandarin defaults)

### Key files
- `app/layout.tsx` — root layout; has AppSidebar + content wrapper with `lg:ml-60`
- `app/page.tsx` — hub with big panda hero + 3 section cards
- `app/mandarin/layout.tsx` — provides `mandarinStore` via context
- `app/german/layout.tsx` — provides `germanStore` via context (separate isolated progress)
- `app/trivia/actors/page.tsx` — **synchronous** (no async fetch). Builds actor list from `ACTOR_CONFIGS` using local `/public/actors/*.jpg` images. No Wikipedia API calls at runtime.
- `components/AppSidebar.tsx` — desktop sidebar (lg+ only)
- `components/SkillTree.tsx` — shared skill tree, takes `units`, `basePath`, `greeting` props
- `components/SessionRunner.tsx` — runs a lesson session, tracks `pandaMood`, resets on each card
- `components/cards/CardShell.tsx` — **fixed full-screen** lesson layout (z-40), top 45vh = panda, bottom = question, no scrolling
- `components/cards/CardFooter` — fixed z-50, always above CardShell
- `components/Panda.tsx` — mood-mapped images (idle/happy/wrong/sad/celebrating/sleeping), supports `fill` prop for CSS-sized containers
- `components/AuthPanel.tsx` — sign-in form with shield icon, email/lock field icons, show/hide password, trust footer
- `components/TopBar.tsx` — header with panda logo (hidden on desktop), XP/streak chips, avatar
- `components/BottomNav.tsx` — `lg:hidden`; hidden during lessons (`/*/learn/*`); Flashcards tab follows current language section
- `components/CloudSync.tsx` — syncs mandarin store to Supabase (german not yet synced)
- `components/trivia/ActorBlitz.tsx` — Actor Blitz game component. Images from local `/public/actors/`. Uses `var(--game)` (purple) for all game UI. Answer correct delay 300ms, wrong delay 700ms.
- `lib/store.ts` — Zustand context pattern: `createGameStore(key)` factory, `GameStoreProvider`, `useGameStore` reads from nearest provider. `mandarinStore` = key `slubstack-v1`, `germanStore` = `slubstack-german-v1`, `spanishStore` = `slubstack-spanish-v1`
- `lib/content.ts` — `getLanguageContent(lang)` returns `{ cards, units, getCard, getCardsForUnit, getUnit, allowedInteractions }`. Spanish/German exclude "build"; Spanish/German/Mandarin all have "match".
- `lib/session.ts` — `buildUnitSession` uses `LESSON_ORDER` (no flip — games only). `buildReviewSession` uses `REVIEW_ORDER` (includes flip for flashcard tool). Both take content as param.
- `lib/hooks.ts` — `useHydrated` (useSyncExternalStore), `useNow` (useState/useEffect — NOT useSyncExternalStore, which caused infinite loop with Date.now())
- `lib/xp.ts`, `lib/srs.ts`, `lib/utils.ts` — utilities

## Actor Blitz trivia game
- **Images**: 32 actor JPGs stored in `public/actors/` (e.g. `tom_hanks.jpg`, `samuel_l._jackson.jpg`). Filename = `name.replace(/ /g, "_").toLowerCase() + ".jpg"`. **Do not use Wikipedia API or proxy** — Wikimedia rate-limits server IPs (429). Local files serve instantly from Vercel CDN.
- **Game UI uses `var(--game)` (purple)** — not `var(--accent)` (orange). Keep these separate.
- `app/api/img/route.ts` exists but is no longer used for actor images. Can be repurposed or deleted.
- ActorBlitz has image loading skeleton + `onError` fallback (🎬 emoji) + `fade-in` CSS animation on actor change.

## Content
- `content/mandarin/vocab.json` + `units.json` — 8 units, ~160 cards
- `content/german/vocab.json` + `units.json` — 2 units: Greetings (20 cards), Numbers (15 cards)
- `content/spanish/vocab.json` + `units.json` — 5 units: Greetings (16), Numbers (15), Colors (12), Food (16), Verbs (16) = 75 cards

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
- **Hub page**: fills 45vh, `mood="happy"` — big hero
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
- `profiles` — id, username, email, avatar_url (stores emoji string)
- `user_stats` — user_id, xp, streak, words_learned, units_done, updated_at, state_json (jsonb — full game state)

## Auth flow
1. New user: magic link → `/auth/callback` → `/onboarding` (pick avatar, set username + password)
2. Returning user: email + password on Profile page
3. Stay-signed-in uses `localStorage`/`sessionStorage` flag (`slubstack_stay_signed_in`)
4. Avatar cached in `localStorage` as `slubstack_avatar`

## Deployment
- GitHub: `HugzyMalone/slubstack` — Vercel auto-deploys on push to `main`
- Domain: slubstack.com
- Supabase project: `pbzpgyjyiprepxbzgkmf.supabase.co`
- Email via Resend SMTP (`noreply@slubstack.com`)

## Planned / not yet built
- More trivia game modes (beyond Actor Blitz)
- German + Spanish progress sync to Supabase (currently only mandarin syncs)
- More German content units (food, pronouns, family, etc.)
- More Spanish content units
