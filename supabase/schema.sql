create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  email text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  streak integer not null default 0,
  words_learned integer not null default 0,
  units_done integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

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
