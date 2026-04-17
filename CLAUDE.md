@AGENTS.md

# Slubstack

Mandarin flashcard PWA. Next.js App Router + Supabase + Zustand.

## Stack
- **Next.js** (App Router, Turbopack) — see AGENTS.md for version caveats
- **Supabase** — auth (magic link + email/password), profiles, user_stats, leaderboard
- **Zustand** (persisted to localStorage) — local game state: xp, streak, srs, completedUnits, seenCardIds
- **Framer Motion** — card animations
- **Tailwind CSS v4** with CSS custom properties (`--accent`, `--bg`, `--surface`, etc.)

## Key files
- `app/layout.tsx` — root layout, TopBar + BottomNav + CloudSync
- `app/page.tsx` → `components/SkillTree.tsx` — home/learn tab
- `app/review/ReviewClient.tsx` — flashcard tab (flip cards + SRS practice)
- `app/stats/ProfileClient.tsx` — profile page (Account / Leaderboard / Settings tabs)
- `app/onboarding/page.tsx` — first-time setup after magic link (avatar, username, password)
- `app/auth/callback/route.ts` — Supabase auth callback, redirects to /onboarding for new users
- `components/AuthPanel.tsx` — sign-in form (email+password or magic link)
- `components/Panda.tsx` — 3D panda image, random variant picked on each mount
- `components/TopBar.tsx` — header with panda logo, XP/streak chips, avatar
- `components/CloudSync.tsx` — pushes full game state to Supabase on change, pulls on sign-in
- `lib/store.ts` — Zustand store with `mergeFromServer` for cross-device sync
- `lib/supabase/` — browser + server Supabase clients

## Supabase schema
- `profiles` — id, username, email, avatar_url (stores emoji string)
- `user_stats` — user_id, xp, streak, words_learned, units_done, updated_at, state_json (jsonb — full game state for cross-device sync)

## Auth flow
1. New user: magic link → `/auth/callback` → `/onboarding` (pick avatar, set username + password)
2. Returning user: email + password on Profile page
3. Stay-signed-in uses `localStorage`/`sessionStorage` flag (`slubstack_stay_signed_in`)
4. Avatar cached in `localStorage` as `slubstack_avatar`

## Panda images
All in `public/`: `3dpanda.png`, `3dpanda-angry.png`, `3dpanda-sad.png`, `3dpanda-wink.png`, `3dpanda-wink2.png`

## Deployment
- GitHub: `HugzyMalone/slubstack` — Vercel auto-deploys on push to `main`
- Domain: slubstack.com
- Supabase project: `pbzpgyjyiprepxbzgkmf.supabase.co`
- Email via Resend SMTP (`noreply@slubstack.com`)
