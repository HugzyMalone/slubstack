-- Sperm Race — 4-player live race over the generic live_matches plumbing, with
-- private invite-code rooms alongside the existing public auto-matchmaking.
--
-- Security model mirrors the post-20260617000000 hardening: every RPC reads
-- auth.uid() internally (never a caller-supplied uid) and write paths are kept
-- off the `authenticated` role where forgery would otherwise be possible.

-- 1. Private-room columns on live_matches.
alter table public.live_matches
  add column if not exists join_code text;
alter table public.live_matches
  add column if not exists is_private boolean not null default false;

-- 2. Codes only need to be unique among joinable (waiting) rooms; finished or
-- abandoned rooms may share a recycled code.
create unique index if not exists live_matches_join_code_waiting_idx
  on public.live_matches (join_code)
  where status = 'waiting';

-- 3. create_private_live_match — host opens a private waiting lobby with a
-- generated short code and takes slot 0. Service-role-only RPC: the room route
-- derives user.id server-side from getUser() and passes it as p_user_id,
-- mirroring create_draw_room / find_or_create_waiting_live_match.
drop function if exists public.create_private_live_match(uuid, text, smallint, text, text);
create or replace function public.create_private_live_match(
  p_user_id uuid,
  p_game_kind text,
  p_level smallint,
  p_display_name text,
  p_avatar_url text
) returns table (
  match_id uuid,
  seed text,
  join_code text,
  slot_index smallint
) language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_uid uuid := p_user_id;
  v_match_id uuid;
  v_seed text;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt int := 0;
  v_collision boolean;
begin
  if v_uid is null then
    raise exception 'p_user_id is required';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code :=
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);

    select exists (
      select 1 from public.live_matches
      where status = 'waiting'
        and join_code = v_code
    ) into v_collision;

    exit when not v_collision or v_attempt >= 5;
  end loop;

  if v_collision then
    raise exception 'could not allocate unique join code after % attempts', v_attempt;
  end if;

  v_seed := encode(extensions.gen_random_bytes(8), 'hex');

  insert into public.live_matches (game_kind, level, seed, is_private, join_code)
  values (p_game_kind, p_level, v_seed, true, v_code)
  returning id into v_match_id;

  insert into public.live_match_players
    (match_id, slot, user_id, is_bot, display_name, avatar_url)
  values
    (v_match_id, 0, v_uid, false, p_display_name, p_avatar_url);

  return query select v_match_id, v_seed, v_code, 0::smallint;
end;
$$;

revoke execute on function public.create_private_live_match(uuid, text, smallint, text, text) from public, anon, authenticated;
grant execute on function public.create_private_live_match(uuid, text, smallint, text, text) to service_role;

-- 4. join_live_match_by_code — find the waiting private room, allocate next free
-- slot 1..3 (4-player cap). Service-role-only RPC: identity comes from p_user_id,
-- which the room route derives server-side, mirroring join_draw_room.
drop function if exists public.join_live_match_by_code(uuid, text, text, text);
create or replace function public.join_live_match_by_code(
  p_user_id uuid,
  p_join_code text,
  p_display_name text,
  p_avatar_url text
) returns table (
  match_id uuid,
  seed text,
  slot_index smallint
) language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_uid uuid := p_user_id;
  v_match_id uuid;
  v_seed text;
  v_slot smallint;
  v_existing_slot smallint;
  v_lock_key bigint;
begin
  if v_uid is null then
    raise exception 'p_user_id is required';
  end if;

  v_lock_key := hashtext('join_code:' || upper(p_join_code));
  perform pg_advisory_xact_lock(v_lock_key);

  select m.id, m.seed
  into v_match_id, v_seed
  from public.live_matches m
  where m.status = 'waiting'
    and m.is_private = true
    and m.join_code = upper(p_join_code)
  order by m.created_at desc
  limit 1
  for update;

  if v_match_id is null then
    raise exception 'room not found or already started';
  end if;

  select p.slot into v_existing_slot
  from public.live_match_players p
  where p.match_id = v_match_id and p.user_id = v_uid;

  if v_existing_slot is not null then
    return query select v_match_id, v_seed, v_existing_slot;
    return;
  end if;

  select coalesce(min(s.slot), -1)::smallint into v_slot
  from generate_series(1, 3) as s(slot)
  where not exists (
    select 1 from public.live_match_players p
    where p.match_id = v_match_id and p.slot = s.slot
  );

  if v_slot = -1 then
    raise exception 'room is full';
  end if;

  insert into public.live_match_players
    (match_id, slot, user_id, is_bot, display_name, avatar_url)
  values
    (v_match_id, v_slot, v_uid, false, p_display_name, p_avatar_url);

  return query select v_match_id, v_seed, v_slot;
end;
$$;

revoke execute on function public.join_live_match_by_code(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.join_live_match_by_code(uuid, text, text, text) to service_role;

-- 5. find_or_create_waiting_live_match — auto-matchmaking must never surface a
-- private room. Body is the latest definition (20260511000000_live_match_fresh_replay.sql)
-- with `and m.is_private = false` added to both waiting-room lookups; everything
-- else is preserved exactly.
drop function if exists public.find_or_create_waiting_live_match(text, smallint, uuid, text, text, smallint);

create or replace function public.find_or_create_waiting_live_match(
  p_game_kind text,
  p_level smallint,
  p_user_id uuid,
  p_display_name text,
  p_avatar_url text,
  p_max_players smallint default 4
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

  -- Rejoin own in-lobby match (resume after refresh during the queue grace).
  -- 15s covers the 5s QUEUE_GRACE_MS plus countdown/network slack. After that
  -- we treat the row as stale and create a fresh match.
  select m.id, m.seed, p.slot
  into v_match_id, v_seed, v_slot
  from public.live_matches m
  join public.live_match_players p on p.match_id = m.id
  where m.game_kind = p_game_kind
    and m.level = p_level
    and m.status = 'waiting'
    and m.is_private = false
    and m.created_at > now() - interval '15 seconds'
    and p.user_id = p_user_id
  order by m.created_at desc
  limit 1;

  if v_match_id is not null then
    return query select v_match_id, v_seed, v_slot;
    return;
  end if;

  -- Join the oldest fresh waiting match with a free slot. Same 15s cutoff
  -- avoids joining a stale lobby that another user abandoned.
  select m.id, m.seed, (
    select count(*) from public.live_match_players p where p.match_id = m.id
  )::smallint
  into v_match_id, v_seed, v_slot
  from public.live_matches m
  where m.game_kind = p_game_kind
    and m.level = p_level
    and m.status = 'waiting'
    and m.is_private = false
    and m.created_at > now() - interval '15 seconds'
    and (select count(*) from public.live_match_players p where p.match_id = m.id) < p_max_players
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

revoke execute on function public.find_or_create_waiting_live_match(text, smallint, uuid, text, text, smallint) from public, anon, authenticated;
grant execute on function public.find_or_create_waiting_live_match(text, smallint, uuid, text, text, smallint) to service_role;

-- 6. Single-player best-time leaderboard, one row per (user, track 1-3).
create table if not exists public.sperm_race_times (
  user_id uuid not null references auth.users (id) on delete cascade,
  track int not null check (track in (1, 2, 3)),
  best_ms int not null check (best_ms > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, track)
);
create index if not exists sperm_race_times_track_best_idx
  on public.sperm_race_times (track, best_ms asc);

alter table public.sperm_race_times enable row level security;

-- Public read; no authenticated insert/update policy, so the only write path is
-- the SECURITY DEFINER RPC below running as service_role.
drop policy if exists "sperm race times readable by everyone" on public.sperm_race_times;
create policy "sperm race times readable by everyone"
on public.sperm_race_times for select using (true);

-- 7. record_race_times — monotonic-best upsert for one user's row. Service-role-only
-- RPC: identity comes from p_user_id (the result route derives it server-side from
-- getUser()), never a caller-supplied value reaching the browser. Granting this to
-- `authenticated` would let a client post an arbitrary best_ms straight from the
-- browser, bypassing the tap-timeline validation in the result route.
drop function if exists public.record_race_times(int, int);
drop function if exists public.record_race_times(uuid, int, int);
create or replace function public.record_race_times(
  p_user_id uuid,
  p_track int,
  p_best_ms int
) returns boolean
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_uid uuid := p_user_id;
  v_improved boolean := false;
begin
  if v_uid is null then
    raise exception 'p_user_id is required';
  end if;

  insert into public.sperm_race_times (user_id, track, best_ms, updated_at)
  values (v_uid, p_track, p_best_ms, timezone('utc', now()))
  on conflict (user_id, track) do update
    set best_ms = excluded.best_ms,
        updated_at = timezone('utc', now())
    where excluded.best_ms < public.sperm_race_times.best_ms
  returning true into v_improved;

  return coalesce(v_improved, false);
end;
$$;

revoke execute on function public.record_race_times(uuid, int, int) from public, anon, authenticated;
grant execute on function public.record_race_times(uuid, int, int) to service_role;
