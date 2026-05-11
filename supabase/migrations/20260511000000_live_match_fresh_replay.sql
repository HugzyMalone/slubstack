-- Replays were rejoining the user's previous `waiting` match (same seed → same
-- GeoClone locations). The live_matches row stays `waiting` for the full round
-- duration since nothing bumps it to `playing` server-side; only the result
-- POST flips it to `finished`. If the user abandons (refresh mid-round, close
-- tab pre-submission, finalise error) the row lingers and the next call to
-- find_or_create_waiting_live_match resurrects it.
--
-- Fix: filter both rejoin branches by created_at so only genuinely-fresh
-- lobby rows count. Resume-on-refresh during the 5s lobby still works; older
-- waiting rows are ignored and a new match (new seed) is created.

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
