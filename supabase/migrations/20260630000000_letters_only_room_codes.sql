-- Letters-only room/join codes. Party-game UX fix: players join on a phone
-- without flipping to the numbers keyboard. Drops digits 2-9 from the alphabet
-- in both code generators; the alphabet already excludes I and O to avoid
-- visual confusion. Function bodies are otherwise identical to their previous
-- definitions (20260514000000_live_draw.sql, 20260623140000_sperm_race_join_code_ambiguous_fix.sql).

-- Draw My Thing room codes.
create or replace function public.create_draw_room(
  p_user_id uuid,
  p_display_name text,
  p_avatar_url text,
  p_total_rounds smallint default 4,
  p_round_duration_ms int default 60000
) returns table (
  match_id uuid,
  room_code text,
  seed text,
  slot_index smallint
) language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_match_id uuid;
  v_code text;
  v_seed text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_attempt int := 0;
  v_collision boolean;
begin
  loop
    v_attempt := v_attempt + 1;
    v_code :=
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);

    select exists (
      select 1 from public.live_matches
      where game_kind = 'draw_my_thing'
        and status = 'waiting'
        and upper(extras->>'roomCode') = v_code
    ) into v_collision;

    exit when not v_collision or v_attempt >= 5;
  end loop;

  if v_collision then
    raise exception 'could not allocate unique room code after % attempts', v_attempt;
  end if;

  v_seed := encode(extensions.gen_random_bytes(8), 'hex');

  insert into public.live_matches (game_kind, level, seed, extras)
  values (
    'draw_my_thing',
    1,
    v_seed,
    jsonb_build_object(
      'roomCode', v_code,
      'totalRounds', p_total_rounds,
      'roundDurationMs', p_round_duration_ms
    )
  )
  returning id into v_match_id;

  insert into public.live_match_players
    (match_id, slot, user_id, is_bot, display_name, avatar_url)
  values
    (v_match_id, 0, p_user_id, false, p_display_name, p_avatar_url);

  return query select v_match_id, v_code, v_seed, 0::smallint;
end;
$$;

-- Sperm Race (and any future private live_matches) join codes.
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
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
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
        and live_matches.join_code = v_code
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
