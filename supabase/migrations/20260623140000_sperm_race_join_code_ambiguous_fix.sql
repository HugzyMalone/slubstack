-- Fix: create_private_live_match raised 42702 "column reference join_code is
-- ambiguous" at call time. The collision check `join_code = v_code` was ambiguous
-- between the live_matches column and the RETURNS TABLE OUT column of the same
-- name. Qualify it as live_matches.join_code. Body is otherwise identical to
-- 20260617120000_sperm_race.sql.

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

revoke execute on function public.create_private_live_match(uuid, text, smallint, text, text) from public, anon, authenticated;
grant execute on function public.create_private_live_match(uuid, text, smallint, text, text) to service_role;
