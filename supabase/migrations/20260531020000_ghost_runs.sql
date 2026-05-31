-- Async ghost duels (F4). A ghost run is a recorded sprint replayed through the
-- existing bot loop: timeline is a BotTickEvent[] ([{atMs, scoreDelta}, ...]).
-- Additive only: new table + RLS. No drops, no type changes.

create table if not exists public.ghost_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_kind text not null,
  level smallint not null,
  seed text not null,
  score integer not null,
  correct integer not null,
  timeline jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ghost_runs_user_idx on public.ghost_runs (user_id, created_at desc);

alter table public.ghost_runs enable row level security;

drop policy if exists "Public read" on public.ghost_runs;
create policy "Public read" on public.ghost_runs for select using (true);

drop policy if exists "Auth insert" on public.ghost_runs;
create policy "Auth insert" on public.ghost_runs for insert with check (auth.uid() = user_id);
