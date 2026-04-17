@AGENTS.md

# Slubstack

Mandarin + German flashcard PWA with a hub home screen. Next.js App Router + Supabase + Zustand.

## Stack
- **Next.js 16** (App Router, Turbopack) — see AGENTS.md for version caveats
- **Supabase** — auth (magic link + email/password), profiles, user_stats, leaderboard
- **Zustand** (persisted to localStorage) — per-language game state
- **Framer Motion** — card animations
- **Tailwind CSS v4** with CSS custom properties (`--accent`, `--bg`, `--surface`, etc.)

## App structure

### Routes
- `/` — Hub page: pick Mandarin, German, or Trivia
- `/mandarin` — Mandarin skill tree
- `/mandarin/learn/[unitId]` — Mandarin lesson (fixed full-screen, no scroll)
- `/mandarin/review` — Mandarin flashcard review
- `/german` — German skill tree
- `/german/learn/[unitId]` — German lesson
- `/german/review` — German flashcard review
- `/trivia` — Coming soon placeholder
- `/stats` — Profile / leaderboard / settings
- `/onboarding` — First-time setup (avatar, username, password)
- Legacy `/learn/[unitId]` and `/review` still work (mandarin defaults)

### Key files
- `app/layout.tsx` — root layout, wraps everything in `GameStoreProvider store={mandarinStore}` (TopBar/CloudSync use mandarin store by default)
- `app/page.tsx` — hub with big panda hero + 3 section cards
- `app/mandarin/layout.tsx` — provides `mandarinStore` via context
- `app/german/layout.tsx` — provides `germanStore` via context (separate isolated progress)
- `components/SkillTree.tsx` — shared skill tree, takes `units`, `basePath`, `greeting` props
- `components/SessionRunner.tsx` — runs a lesson session, tracks `pandaMood`, resets on each card
- `components/cards/CardShell.tsx` — **fixed full-screen** lesson layout (z-40), top 45vh = panda, bottom = question, no scrolling
- `components/cards/CardFooter` — fixed z-50, always above CardShell
- `components/Panda.tsx` — mood-mapped images (idle/happy/wrong/sad/celebrating/sleeping), supports `fill` prop for CSS-sized containers
- `components/AuthPanel.tsx` — sign-in form with shield icon, email/lock field icons, show/hide password, trust footer
- `components/TopBar.tsx` — header with panda logo, XP/streak chips, avatar
- `components/BottomNav.tsx` — hidden during lessons (`/*/learn/*`); Flashcards tab follows current language section
- `components/CloudSync.tsx` — syncs mandarin store to Supabase (german not yet synced)
- `lib/store.ts` — Zustand context pattern: `createGameStore(key)` factory, `GameStoreProvider`, `useGameStore` reads from nearest provider. `mandarinStore` = key `slubstack-v1` (preserves existing data), `germanStore` = `slubstack-german-v1`
- `lib/content.ts` — `getLanguageContent(lang)` returns `{ cards, units, getCard, getCardsForUnit, getUnit, allowedInteractions }`. German sessions exclude "build" interaction (Chinese-specific tiles).
- `lib/session.ts` — `buildUnitSession(unitId, srs, content, size)` and `buildReviewSession(srs, content, size)` — content is passed in, not imported globally
- `lib/xp.ts`, `lib/srs.ts`, `lib/utils.ts`, `lib/hooks.ts` — utilities

## Content
- `content/mandarin/vocab.json` + `units.json` — 8 units, ~160 cards
- `content/german/vocab.json` + `units.json` — 2 units: Greetings (20 cards), Numbers (15 cards)

Card shape (both languages):
```ts
{ id, category, hanzi, pinyin, english, note? }
// German: hanzi = German word, pinyin = pronunciation hint
```

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
`fixed inset-0 z-40` — covers TopBar/BottomNav, no scrolling:
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
- Trivia multiplayer challenge (see `/app/trivia/page.tsx` placeholder)
- German progress sync to Supabase (currently only mandarin syncs)
- More German content units (food, pronouns, family, etc.)
