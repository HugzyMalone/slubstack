-- Wikirace daily-puzzle scores. Mirrors the wordle_scores / connections_scores RLS pattern.

create table if not exists public.wiki_race_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles (id) on delete cascade not null,
  date date not null,
  clicks integer not null check (clicks >= 0),
  seconds integer not null check (seconds >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, date)
);

create index if not exists wiki_race_scores_date_idx on public.wiki_race_scores (date, clicks, seconds);

alter table public.wiki_race_scores enable row level security;

drop policy if exists "wiki race scores readable by everyone" on public.wiki_race_scores;
create policy "wiki race scores readable by everyone"
on public.wiki_race_scores
for select
to anon, authenticated
using (true);

drop policy if exists "users can upsert their own wiki race score" on public.wiki_race_scores;
create policy "users can upsert their own wiki race score"
on public.wiki_race_scores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update their own wiki race score" on public.wiki_race_scores;
create policy "users can update their own wiki race score"
on public.wiki_race_scores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
