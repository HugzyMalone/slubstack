-- Solo ranked: let a lone human's rating move against the replay bots when no
-- other humans are present. Adds p_allow_bot_rating to finalise_live_match so
-- the rating upsert runs when humans_count < 2 but the caller opted into a
-- vs-bot rated match.
--
-- Replaces (not overloads) the existing 7-arg finalise_live_match: a separate
-- overload that differs only by a trailing default param would make the common
-- 6-arg call ambiguous and break every finalise. So we drop the 7-arg version
-- and recreate it as an 8-arg superset where both p_rating_kind and
-- p_allow_bot_rating are trailing defaults — existing callers (6 or 7 named
-- args) resolve to it unchanged.
--
-- ORDERING: apply this migration to prod BEFORE deploying the code that sends
-- p_allow_bot_rating, or solo-ranked finalises will fail to resolve the RPC.
-- The >= 2-human and unranked-solo paths never send the new arg and are
-- unaffected either way.

drop function if exists public.finalise_live_match(text, uuid, integer, jsonb, jsonb, jsonb, text);
create or replace function public.finalise_live_match(
  p_game_kind text,
  p_match_id uuid,
  p_humans_count integer,
  p_bot_inserts jsonb,
  p_player_updates jsonb,
  p_rating_upserts jsonb,
  p_rating_kind text default null,
  p_allow_bot_rating boolean default false
) returns boolean
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_status text;
  v_finalise_lock_key bigint := hashtext('live_match:' || p_match_id::text);
  v_bot record;
  v_pu record;
  v_ru record;
  v_ladder text := coalesce(p_rating_kind, p_game_kind);
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

  if p_humans_count >= 2 or p_allow_bot_rating then
    for v_ru in
      select * from jsonb_to_recordset(p_rating_upserts)
        as x(user_id uuid, level smallint, rating integer, matches integer, wins integer, draws integer, losses integer)
    loop
      insert into public.live_ratings
        (user_id, game_kind, level, rating, matches, wins, draws, losses, updated_at)
      values
        (v_ru.user_id, v_ladder, v_ru.level, v_ru.rating, v_ru.matches, v_ru.wins, v_ru.draws, v_ru.losses, timezone('utc', now()))
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

revoke execute on function public.finalise_live_match(text, uuid, integer, jsonb, jsonb, jsonb, text, boolean) from public, anon, authenticated;
grant execute on function public.finalise_live_match(text, uuid, integer, jsonb, jsonb, jsonb, text, boolean) to service_role;
