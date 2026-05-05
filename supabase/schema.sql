create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  email text,
  avatar_url text,
  status text,
  native_language text not null default 'en' check (native_language in ('en', 'de')),
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

create table if not exists public.wordle_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles (id) on delete cascade not null,
  date date not null,
  attempts integer not null check (attempts between 1 and 6),
  solved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, date)
);
create index if not exists wordle_scores_date_idx on public.wordle_scores (date, solved, attempts);

alter table public.wordle_scores enable row level security;

create policy "wordle scores readable by everyone"
on public.wordle_scores
for select
to anon, authenticated
using (true);

create policy "users can upsert their own wordle score"
on public.wordle_scores
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.actor_blitz_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles (id) on delete cascade not null,
  score integer not null check (score >= 0),
  correct integer not null default 0 check (correct >= 0),
  total integer not null default 0 check (total >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  accuracy integer not null default 0 check (accuracy >= 0 and accuracy <= 100),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists actor_blitz_scores_score_idx on public.actor_blitz_scores (score desc);

alter table public.actor_blitz_scores enable row level security;

create policy "actor blitz scores readable by everyone"
on public.actor_blitz_scores
for select
using (true);

create policy "users can insert their own actor blitz score"
on public.actor_blitz_scores
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.live_math_matches (
  id uuid default gen_random_uuid() primary key,
  level smallint not null check (level in (1, 2, 3)),
  seed text not null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'abandoned')),
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  ended_at timestamptz
);
create index if not exists live_math_matches_open_idx
  on public.live_math_matches (level, status, created_at)
  where status = 'waiting';

create table if not exists public.live_math_match_players (
  match_id uuid references public.live_math_matches (id) on delete cascade,
  slot smallint not null check (slot between 0 and 3),
  user_id uuid references public.profiles (id) on delete set null,
  is_bot boolean not null default false,
  display_name text not null,
  avatar_url text,
  score integer,
  correct integer,
  rank smallint,
  elo_before integer,
  elo_after integer,
  primary key (match_id, slot)
);

create table if not exists public.live_math_ratings (
  user_id uuid references public.profiles (id) on delete cascade,
  level smallint not null check (level in (1, 2, 3)),
  rating integer not null default 1200,
  matches integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, level)
);
create index if not exists live_math_ratings_level_rating_idx
  on public.live_math_ratings (level, rating desc);

alter table public.live_math_matches enable row level security;
alter table public.live_math_match_players enable row level security;
alter table public.live_math_ratings enable row level security;

create policy "live math matches readable by everyone"
on public.live_math_matches for select using (true);

create policy "live math match players readable by everyone"
on public.live_math_match_players for select using (true);

create policy "live math ratings readable by everyone"
on public.live_math_ratings for select using (true);

-- security definer: callable only via service-role admin client from API route
create or replace function public.find_or_create_waiting_live_math_match(
  p_level smallint,
  p_user_id uuid,
  p_display_name text,
  p_avatar_url text
) returns table (
  match_id uuid,
  seed text,
  slot_index smallint
) language plpgsql security definer as $$
declare
  v_match_id uuid;
  v_seed text;
  v_slot smallint;
begin
  perform pg_advisory_xact_lock(p_level::bigint);

  select m.id, m.seed, (
    select count(*) from public.live_math_match_players p where p.match_id = m.id
  )::smallint
  into v_match_id, v_seed, v_slot
  from public.live_math_matches m
  where m.level = p_level
    and m.status = 'waiting'
    and (select count(*) from public.live_math_match_players p where p.match_id = m.id) < 4
  order by m.created_at asc
  limit 1
  for update;

  if v_match_id is null then
    v_seed := encode(extensions.gen_random_bytes(8), 'hex');
    insert into public.live_math_matches (level, seed)
    values (p_level, v_seed)
    returning id into v_match_id;
    v_slot := 0;
  end if;

  insert into public.live_math_match_players (match_id, slot, user_id, is_bot, display_name, avatar_url)
  values (v_match_id, v_slot, p_user_id, false, p_display_name, p_avatar_url);

  return query select v_match_id, v_seed, v_slot;
end;
$$;

create or replace function public.finalise_live_math_match(
  p_match_id uuid,
  p_bot_inserts jsonb,
  p_player_updates jsonb,
  p_rating_upserts jsonb
) returns boolean
language plpgsql security definer as $$
declare
  v_status text;
  v_finalise_lock_key bigint := hashtext('live_math:' || p_match_id::text);
  v_bot record;
  v_pu record;
  v_ru record;
begin
  perform pg_advisory_xact_lock(v_finalise_lock_key);

  select status into v_status
  from public.live_math_matches
  where id = p_match_id
  for update;

  if v_status is null then
    return false;
  end if;

  if v_status = 'finished' then
    return false;
  end if;

  for v_bot in
    select * from jsonb_to_recordset(p_bot_inserts)
      as x(slot smallint, display_name text, score integer, correct integer, rank smallint)
  loop
    insert into public.live_math_match_players
      (match_id, slot, user_id, is_bot, display_name, score, correct, rank)
    values
      (p_match_id, v_bot.slot, null, true, v_bot.display_name, v_bot.score, v_bot.correct, v_bot.rank)
    on conflict (match_id, slot) do nothing;
  end loop;

  for v_pu in
    select * from jsonb_to_recordset(p_player_updates)
      as x(slot smallint, score integer, correct integer, rank smallint, elo_before integer, elo_after integer)
  loop
    update public.live_math_match_players
    set score = v_pu.score,
        correct = v_pu.correct,
        rank = v_pu.rank,
        elo_before = v_pu.elo_before,
        elo_after = v_pu.elo_after
    where match_id = p_match_id and slot = v_pu.slot;
  end loop;

  for v_ru in
    select * from jsonb_to_recordset(p_rating_upserts)
      as x(user_id uuid, level smallint, rating integer, matches integer, wins integer, draws integer, losses integer)
  loop
    insert into public.live_math_ratings
      (user_id, level, rating, matches, wins, draws, losses, updated_at)
    values
      (v_ru.user_id, v_ru.level, v_ru.rating, v_ru.matches, v_ru.wins, v_ru.draws, v_ru.losses, timezone('utc', now()))
    on conflict (user_id, level) do update
    set rating = excluded.rating,
        matches = excluded.matches,
        wins = excluded.wins,
        draws = excluded.draws,
        losses = excluded.losses,
        updated_at = timezone('utc', now());
  end loop;

  update public.live_math_matches
  set status = 'finished',
      ended_at = timezone('utc', now())
  where id = p_match_id;

  return true;
end;
$$;
