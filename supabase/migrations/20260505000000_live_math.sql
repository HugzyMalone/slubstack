-- Live Math Blitz — realtime head-to-head Math Blitz tables.
-- Match record, per-slot player rows, and per-difficulty ELO ratings.
-- All writes flow through the service-role admin client; reads are public.

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

drop policy if exists "live math matches readable by everyone" on public.live_math_matches;
create policy "live math matches readable by everyone"
on public.live_math_matches for select using (true);

drop policy if exists "live math match players readable by everyone" on public.live_math_match_players;
create policy "live math match players readable by everyone"
on public.live_math_match_players for select using (true);

drop policy if exists "live math ratings readable by everyone" on public.live_math_ratings;
create policy "live math ratings readable by everyone"
on public.live_math_ratings for select using (true);

-- security definer: callable only via service-role admin client from API route
drop function if exists public.find_or_create_waiting_live_math_match(smallint, uuid, text, text);
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
    v_seed := encode(gen_random_bytes(8), 'hex');
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

drop function if exists public.finalise_live_math_match(uuid, jsonb, jsonb, jsonb);
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

-- Harden: pin search_path on the SECURITY DEFINER functions, and revoke EXECUTE from PUBLIC.
-- (PUBLIC includes anon and authenticated; revoking from anon/authenticated alone is a no-op
-- because the grant is implicit through PUBLIC.)
alter function public.find_or_create_waiting_live_math_match(smallint, uuid, text, text)
  set search_path = public, pg_temp;
alter function public.finalise_live_math_match(uuid, jsonb, jsonb, jsonb)
  set search_path = public, pg_temp;

revoke execute on function public.find_or_create_waiting_live_math_match(smallint, uuid, text, text) from public;
revoke execute on function public.finalise_live_math_match(uuid, jsonb, jsonb, jsonb) from public;
