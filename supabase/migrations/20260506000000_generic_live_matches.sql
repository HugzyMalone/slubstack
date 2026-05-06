-- Generic live multiplayer tables: rename live_math_* to live_*, add game_kind,
-- create new generic RPCs alongside the existing math-blitz ones.
--
-- Expand-then-contract: the old find_or_create_waiting_live_math_match and
-- finalise_live_math_match keep their signatures and are updated to query
-- the renamed tables filtered to game_kind = 'math_blitz', so the existing
-- /api/live-math/* routes keep working unchanged until Phase 2 cuts the
-- shell over to the new generic RPCs. A follow-up migration drops the old
-- RPC names after the cutover ships.

-- 1. Rename tables.
alter table public.live_math_matches rename to live_matches;
alter table public.live_math_match_players rename to live_match_players;
alter table public.live_math_ratings rename to live_ratings;

-- 2. Add game_kind columns. Existing rows are all math_blitz.
alter table public.live_matches
  add column if not exists game_kind text not null default 'math_blitz';
alter table public.live_ratings
  add column if not exists game_kind text not null default 'math_blitz';

-- 3. Swap live_ratings PK to include game_kind.
-- (Trivial: 0 rows in prod at migration time.)
alter table public.live_ratings drop constraint if exists live_math_ratings_pkey;
alter table public.live_ratings add primary key (user_id, game_kind, level);

-- 4. Rebuild partial index for waiting-match lookups, with game_kind first.
drop index if exists public.live_math_matches_open_idx;
create index if not exists live_matches_open_idx
  on public.live_matches (game_kind, level, status, created_at)
  where status = 'waiting';

-- 5. Rebuild ratings index to include game_kind.
drop index if exists public.live_math_ratings_level_rating_idx;
create index if not exists live_ratings_kind_level_rating_idx
  on public.live_ratings (game_kind, level, rating desc);

-- 6. Rename RLS policies to match new table names.
drop policy if exists "live math matches readable by everyone" on public.live_matches;
create policy "live matches readable by everyone"
on public.live_matches for select using (true);

drop policy if exists "live math match players readable by everyone" on public.live_match_players;
create policy "live match players readable by everyone"
on public.live_match_players for select using (true);

drop policy if exists "live math ratings readable by everyone" on public.live_ratings;
create policy "live ratings readable by everyone"
on public.live_ratings for select using (true);

-- 7. Update the existing math-blitz RPCs to query the renamed tables.
-- Same signatures, same return shape, hardcoded game_kind = 'math_blitz'.
-- Existing /api/live-math/* routes keep working untouched.
create or replace function public.find_or_create_waiting_live_math_match(
  p_level smallint,
  p_user_id uuid,
  p_display_name text,
  p_avatar_url text
) returns table (
  match_id uuid,
  seed text,
  slot_index smallint
) language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_match_id uuid;
  v_seed text;
  v_slot smallint;
begin
  perform pg_advisory_xact_lock(p_level::bigint);

  select m.id, m.seed, p.slot
  into v_match_id, v_seed, v_slot
  from public.live_matches m
  join public.live_match_players p on p.match_id = m.id
  where m.game_kind = 'math_blitz'
    and m.level = p_level
    and m.status = 'waiting'
    and p.user_id = p_user_id
  order by m.created_at desc
  limit 1;

  if v_match_id is not null then
    return query select v_match_id, v_seed, v_slot;
    return;
  end if;

  select m.id, m.seed, (
    select count(*) from public.live_match_players p where p.match_id = m.id
  )::smallint
  into v_match_id, v_seed, v_slot
  from public.live_matches m
  where m.game_kind = 'math_blitz'
    and m.level = p_level
    and m.status = 'waiting'
    and (select count(*) from public.live_match_players p where p.match_id = m.id) < 4
  order by m.created_at asc
  limit 1
  for update;

  if v_match_id is null then
    v_seed := encode(extensions.gen_random_bytes(8), 'hex');
    insert into public.live_matches (game_kind, level, seed)
    values ('math_blitz', p_level, v_seed)
    returning id into v_match_id;
    v_slot := 0;
  end if;

  insert into public.live_match_players (match_id, slot, user_id, is_bot, display_name, avatar_url)
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
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_status text;
  v_finalise_lock_key bigint := hashtext('live_match:' || p_match_id::text);
  v_bot record;
  v_pu record;
  v_ru record;
begin
  perform pg_advisory_xact_lock(v_finalise_lock_key);

  select status into v_status
  from public.live_matches
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
    insert into public.live_match_players
      (match_id, slot, user_id, is_bot, display_name, score, correct, rank)
    values
      (p_match_id, v_bot.slot, null, true, v_bot.display_name, v_bot.score, v_bot.correct, v_bot.rank)
    on conflict (match_id, slot) do nothing;
  end loop;

  for v_pu in
    select * from jsonb_to_recordset(p_player_updates)
      as x(slot smallint, score integer, correct integer, rank smallint, elo_before integer, elo_after integer)
  loop
    update public.live_match_players
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
    insert into public.live_ratings
      (user_id, game_kind, level, rating, matches, wins, draws, losses, updated_at)
    values
      (v_ru.user_id, 'math_blitz', v_ru.level, v_ru.rating, v_ru.matches, v_ru.wins, v_ru.draws, v_ru.losses, timezone('utc', now()))
    on conflict (user_id, game_kind, level) do update
    set rating = excluded.rating,
        matches = excluded.matches,
        wins = excluded.wins,
        draws = excluded.draws,
        losses = excluded.losses,
        updated_at = timezone('utc', now());
  end loop;

  update public.live_matches
  set status = 'finished',
      ended_at = timezone('utc', now())
  where id = p_match_id;

  return true;
end;
$$;

revoke execute on function public.find_or_create_waiting_live_math_match(smallint, uuid, text, text) from public;
revoke execute on function public.finalise_live_math_match(uuid, jsonb, jsonb, jsonb) from public;
grant execute on function public.find_or_create_waiting_live_math_match(smallint, uuid, text, text) to service_role;
grant execute on function public.finalise_live_math_match(uuid, jsonb, jsonb, jsonb) to service_role;

-- 8. New generic RPCs for any game_kind.
-- find_or_create_waiting_live_match takes p_game_kind first.
drop function if exists public.find_or_create_waiting_live_match(text, smallint, uuid, text, text);
create or replace function public.find_or_create_waiting_live_match(
  p_game_kind text,
  p_level smallint,
  p_user_id uuid,
  p_display_name text,
  p_avatar_url text
) returns table (
  match_id uuid,
  seed text,
  slot_index smallint
) language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_match_id uuid;
  v_seed text;
  v_slot smallint;
  v_lock_key bigint := hashtext(p_game_kind || ':' || p_level::text);
begin
  perform pg_advisory_xact_lock(v_lock_key);

  -- Already in a waiting match for this game_kind+level? Return that slot.
  select m.id, m.seed, p.slot
  into v_match_id, v_seed, v_slot
  from public.live_matches m
  join public.live_match_players p on p.match_id = m.id
  where m.game_kind = p_game_kind
    and m.level = p_level
    and m.status = 'waiting'
    and p.user_id = p_user_id
  order by m.created_at desc
  limit 1;

  if v_match_id is not null then
    return query select v_match_id, v_seed, v_slot;
    return;
  end if;

  -- Find oldest waiting match with a free slot.
  select m.id, m.seed, (
    select count(*) from public.live_match_players p where p.match_id = m.id
  )::smallint
  into v_match_id, v_seed, v_slot
  from public.live_matches m
  where m.game_kind = p_game_kind
    and m.level = p_level
    and m.status = 'waiting'
    and (select count(*) from public.live_match_players p where p.match_id = m.id) < 4
  order by m.created_at asc
  limit 1
  for update;

  if v_match_id is null then
    v_seed := encode(extensions.gen_random_bytes(8), 'hex');
    insert into public.live_matches (game_kind, level, seed)
    values (p_game_kind, p_level, v_seed)
    returning id into v_match_id;
    v_slot := 0;
  end if;

  insert into public.live_match_players (match_id, slot, user_id, is_bot, display_name, avatar_url)
  values (v_match_id, v_slot, p_user_id, false, p_display_name, p_avatar_url);

  return query select v_match_id, v_seed, v_slot;
end;
$$;

-- finalise_live_match: skips ELO upsert when humans_count < 2 (three-ladder rule).
drop function if exists public.finalise_live_match(text, uuid, integer, jsonb, jsonb, jsonb);
create or replace function public.finalise_live_match(
  p_game_kind text,
  p_match_id uuid,
  p_humans_count integer,
  p_bot_inserts jsonb,
  p_player_updates jsonb,
  p_rating_upserts jsonb
) returns boolean
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_status text;
  v_finalise_lock_key bigint := hashtext('live_match:' || p_match_id::text);
  v_bot record;
  v_pu record;
  v_ru record;
begin
  perform pg_advisory_xact_lock(v_finalise_lock_key);

  select status into v_status
  from public.live_matches
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
    insert into public.live_match_players
      (match_id, slot, user_id, is_bot, display_name, score, correct, rank)
    values
      (p_match_id, v_bot.slot, null, true, v_bot.display_name, v_bot.score, v_bot.correct, v_bot.rank)
    on conflict (match_id, slot) do nothing;
  end loop;

  for v_pu in
    select * from jsonb_to_recordset(p_player_updates)
      as x(slot smallint, score integer, correct integer, rank smallint, elo_before integer, elo_after integer)
  loop
    update public.live_match_players
    set score = v_pu.score,
        correct = v_pu.correct,
        rank = v_pu.rank,
        elo_before = v_pu.elo_before,
        elo_after = v_pu.elo_after
    where match_id = p_match_id and slot = v_pu.slot;
  end loop;

  -- Three-ladder rule: bot-only matches award XP + league only, never ELO.
  if p_humans_count >= 2 then
    for v_ru in
      select * from jsonb_to_recordset(p_rating_upserts)
        as x(user_id uuid, level smallint, rating integer, matches integer, wins integer, draws integer, losses integer)
    loop
      insert into public.live_ratings
        (user_id, game_kind, level, rating, matches, wins, draws, losses, updated_at)
      values
        (v_ru.user_id, p_game_kind, v_ru.level, v_ru.rating, v_ru.matches, v_ru.wins, v_ru.draws, v_ru.losses, timezone('utc', now()))
      on conflict (user_id, game_kind, level) do update
      set rating = excluded.rating,
          matches = excluded.matches,
          wins = excluded.wins,
          draws = excluded.draws,
          losses = excluded.losses,
          updated_at = timezone('utc', now());
    end loop;
  end if;

  update public.live_matches
  set status = 'finished',
      ended_at = timezone('utc', now())
  where id = p_match_id;

  return true;
end;
$$;

-- Supabase grants EXECUTE to anon/authenticated explicitly on new functions
-- (not just via PUBLIC inheritance), so REVOKE FROM PUBLIC alone is a no-op
-- against those roles. Strip them by name. Same lesson as the original
-- MathStack ship, one layer deeper.
revoke execute on function public.find_or_create_waiting_live_match(text, smallint, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.finalise_live_match(text, uuid, integer, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.find_or_create_waiting_live_match(text, smallint, uuid, text, text) to service_role;
grant execute on function public.finalise_live_match(text, uuid, integer, jsonb, jsonb, jsonb) to service_role;
