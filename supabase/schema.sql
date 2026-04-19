create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  email text,
  avatar_url text,
  status text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  streak integer not null default 0,
  words_learned integer not null default 0,
  units_done integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  state_json jsonb,
  german_state_json jsonb,
  spanish_state_json jsonb
);

create table if not exists public.math_blitz_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles (id) on delete cascade not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  score integer not null check (score >= 0),
  correct integer not null default 0 check (correct >= 0),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists math_blitz_scores_difficulty_score_idx on public.math_blitz_scores (difficulty, score desc);

alter table public.profiles enable row level security;
alter table public.user_stats enable row level security;

create policy "profiles are readable by everyone"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "stats are readable by everyone"
on public.user_stats
for select
to anon, authenticated
using (true);

create policy "users can insert their own stats"
on public.user_stats
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update their own stats"
on public.user_stats
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.math_blitz_scores enable row level security;

create policy "math blitz scores are readable by everyone"
on public.math_blitz_scores
for select
to anon, authenticated
using (true);

create policy "users can insert their own math blitz scores"
on public.math_blitz_scores
for insert
to authenticated
with check (auth.uid() = user_id);
