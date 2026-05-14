-- Draw My Thing — realtime Pictionary on top of live_matches.
-- Invite-code rooms (4-char alphanumeric), one drawer per round, rotating drawer.
-- Round records carry the secret word; a view masks the word for non-drawers
-- so guessers can subscribe to round state without leaking the answer.
-- No ELO ladder (rating_kind null at finalise time).

-- live_matches needs an extras jsonb for game-specific config (room code,
-- total rounds, round duration). Add it once here; future games can reuse.
alter table public.live_matches
  add column if not exists extras jsonb not null default '{}'::jsonb;

-- Lookup invite codes by upper(extras->>'roomCode') for case-insensitive joins.
create index if not exists live_matches_room_code_idx
  on public.live_matches ((upper(extras->>'roomCode')))
  where game_kind = 'draw_my_thing' and status = 'waiting';

-- 1. Round table — one row per drawing round in a match.
create table if not exists public.live_draw_rounds (
  match_id uuid not null references public.live_matches (id) on delete cascade,
  round_index smallint not null check (round_index >= 0),
  drawer_slot smallint not null check (drawer_slot between 0 and 7),
  word text not null,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  winner_slot smallint,
  points_awarded jsonb,
  primary key (match_id, round_index)
);
create index if not exists live_draw_rounds_match_idx
  on public.live_draw_rounds (match_id, round_index);

alter table public.live_draw_rounds enable row level security;

-- Match players can read their match's rounds; the view's CASE expression
-- below NULLs the word for non-drawers, so the policy itself is broad.
-- Writes happen via SECURITY DEFINER RPCs only.
drop policy if exists "draw rounds readable by match players" on public.live_draw_rounds;
create policy "draw rounds readable by match players"
on public.live_draw_rounds for select
to authenticated
using (
  exists (
    select 1 from public.live_match_players p
    where p.match_id = live_draw_rounds.match_id
      and p.user_id = auth.uid()
  )
);

-- 2. Public view: word is NULL unless caller is the drawer for that round.
-- security_invoker=true keeps RLS on live_match_players honoured by the view.
drop view if exists public.live_draw_rounds_public;
create view public.live_draw_rounds_public
  with (security_invoker = true) as
select
  r.match_id,
  r.round_index,
  r.drawer_slot,
  case
    when exists (
      select 1 from public.live_match_players p
      where p.match_id = r.match_id
        and p.slot = r.drawer_slot
        and p.user_id = auth.uid()
    ) then r.word
    else null
  end as word,
  r.started_at,
  r.ended_at,
  r.winner_slot,
  r.points_awarded
from public.live_draw_rounds r;

grant select on public.live_draw_rounds_public to anon, authenticated;

-- 3. Single-player leaderboard — mirrors math_blitz_scores style.
create table if not exists public.draw_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score int not null check (score >= 0),
  rounds_won int not null default 0,
  won_as_drawer int not null default 0,
  won_as_guesser int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists draw_scores_score_idx
  on public.draw_scores (score desc);

alter table public.draw_scores enable row level security;

drop policy if exists "draw scores readable by everyone" on public.draw_scores;
create policy "draw scores readable by everyone"
on public.draw_scores for select using (true);

drop policy if exists "draw scores insertable by owner" on public.draw_scores;
create policy "draw scores insertable by owner"
on public.draw_scores for insert
to authenticated
with check (user_id = auth.uid());

-- 4. create_draw_room — host creates a waiting lobby with a unique 4-char code.
drop function if exists public.create_draw_room(uuid, text, text, smallint, integer);
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
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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

revoke execute on function public.create_draw_room(uuid, text, text, smallint, integer) from public, anon;
grant execute on function public.create_draw_room(uuid, text, text, smallint, integer) to authenticated, service_role;

-- 5. join_draw_room — find the room by code, allocate next free slot 1..7.
drop function if exists public.join_draw_room(uuid, text, text, text);
create or replace function public.join_draw_room(
  p_user_id uuid,
  p_display_name text,
  p_avatar_url text,
  p_room_code text
) returns table (
  match_id uuid,
  seed text,
  slot_index smallint,
  total_rounds smallint,
  round_duration_ms int
) language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_match_id uuid;
  v_seed text;
  v_slot smallint;
  v_existing_slot smallint;
  v_total_rounds smallint;
  v_round_duration_ms int;
  v_lock_key bigint;
  v_extras jsonb;
begin
  v_lock_key := hashtext('draw_room:' || upper(p_room_code));
  perform pg_advisory_xact_lock(v_lock_key);

  select m.id, m.seed, m.extras
  into v_match_id, v_seed, v_extras
  from public.live_matches m
  where m.game_kind = 'draw_my_thing'
    and m.status = 'waiting'
    and upper(m.extras->>'roomCode') = upper(p_room_code)
  order by m.created_at desc
  limit 1
  for update;

  if v_match_id is null then
    raise exception 'room not found or already started';
  end if;

  v_total_rounds := coalesce((v_extras->>'totalRounds')::smallint, 4);
  v_round_duration_ms := coalesce((v_extras->>'roundDurationMs')::int, 60000);

  select p.slot into v_existing_slot
  from public.live_match_players p
  where p.match_id = v_match_id and p.user_id = p_user_id;

  if v_existing_slot is not null then
    return query select v_match_id, v_seed, v_existing_slot, v_total_rounds, v_round_duration_ms;
    return;
  end if;

  select coalesce(min(s.slot), -1)::smallint into v_slot
  from generate_series(1, 7) as s(slot)
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
    (v_match_id, v_slot, p_user_id, false, p_display_name, p_avatar_url);

  return query select v_match_id, v_seed, v_slot, v_total_rounds, v_round_duration_ms;
end;
$$;

revoke execute on function public.join_draw_room(uuid, text, text, text) from public, anon;
grant execute on function public.join_draw_room(uuid, text, text, text) to authenticated, service_role;

-- 6. start_draw_round — picks drawer (round_index % humans) and a fresh word.
-- Drawer assignment uses live_match_players ordered by slot ascending.
drop function if exists public.start_draw_round(uuid, smallint, smallint);
create or replace function public.start_draw_round(
  p_match_id uuid,
  p_round_index smallint,
  p_caller_slot smallint
) returns table (
  drawer_slot smallint,
  word text
) language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_words text[] := array[
    'acorn','anchor','angel','ankle','apple','arrow','axe','balloon','banana',
    'basket','beach','bear','bed','bell','bench','bicycle','boat','book','boot',
    'bowl','bread','bridge','broom','brush','bucket','butterfly','cactus','cake',
    'camel','camera','candle','car','carrot','castle','cat','chair','cheese',
    'cherry','church','clock','cloud','clown','cookie','crab','crown','cup','dog',
    'donut','door','dragon','drum','duck','eagle','egg','elephant','envelope','eye',
    'fan','feather','fence','fire','fish','flag','flower','foot','fork','fox','frog',
    'ghost','giraffe','glove','guitar','hammer','hat','heart','helicopter','honey',
    'horse','house','igloo','kangaroo','key','kite','knife','ladder','lamp','leaf',
    'lemon','lion','lipstick','lobster','mailbox','melon','mirror','moon','mountain',
    'mouse','mushroom','nose','octopus','owl','panda','pencil','penguin','phone',
    'piano','pirate','pizza','plane','plate','rabbit','rainbow','robot','rocket',
    'shark','ship','shoe','snake','snowman','spider','spoon','star','sun','tiger',
    'train','tree','turtle','umbrella','volcano','whale','witch','zebra'
  ];
  v_seed text;
  v_humans smallint;
  v_drawer_slot smallint;
  v_word text;
  v_hash bigint;
  v_used text[];
  v_pool text[];
  v_caller_user uuid;
begin
  perform pg_advisory_xact_lock(hashtext('draw_round:' || p_match_id::text));

  -- Caller must be a real human in the match.
  select user_id into v_caller_user
  from public.live_match_players
  where match_id = p_match_id and slot = p_caller_slot;

  if v_caller_user is null or v_caller_user <> auth.uid() then
    raise exception 'caller slot does not match auth.uid()';
  end if;

  -- Round already exists? Return it (idempotent).
  select r.drawer_slot, r.word
  into v_drawer_slot, v_word
  from public.live_draw_rounds r
  where r.match_id = p_match_id and r.round_index = p_round_index;

  if v_drawer_slot is not null then
    return query select v_drawer_slot, v_word;
    return;
  end if;

  select m.seed into v_seed
  from public.live_matches m
  where m.id = p_match_id;

  if v_seed is null then
    raise exception 'match not found';
  end if;

  -- Drawer = round_index mod human-player count, ordered by slot.
  select count(*)::smallint into v_humans
  from public.live_match_players
  where match_id = p_match_id and is_bot = false;

  if v_humans = 0 then
    raise exception 'no humans in match';
  end if;

  with ordered as (
    select slot, row_number() over (order by slot) - 1 as idx
    from public.live_match_players
    where match_id = p_match_id and is_bot = false
  )
  select slot into v_drawer_slot
  from ordered
  where idx = (p_round_index % v_humans);

  -- Authorisation: lobby host (slot 0) or the upcoming drawer can start a round.
  if p_caller_slot <> 0 and p_caller_slot <> v_drawer_slot then
    raise exception 'only host or drawer may start a round';
  end if;

  -- Pick a word deterministically by (seed, round_index), skipping words
  -- already used in earlier rounds of this match.
  select array_agg(r.word) into v_used
  from public.live_draw_rounds r
  where r.match_id = p_match_id;

  v_pool := (
    select array_agg(w)
    from unnest(v_words) as w
    where v_used is null or not (w = any(v_used))
  );

  if v_pool is null or array_length(v_pool, 1) = 0 then
    -- All curated words exhausted (only possible with very long matches);
    -- fall back to the full list and accept a repeat.
    v_pool := v_words;
  end if;

  v_hash := abs(hashtext(v_seed || ':' || p_round_index::text));
  v_word := v_pool[1 + (v_hash % array_length(v_pool, 1))];

  insert into public.live_draw_rounds (match_id, round_index, drawer_slot, word)
  values (p_match_id, p_round_index, v_drawer_slot, v_word);

  return query select v_drawer_slot, v_word;
end;
$$;

revoke execute on function public.start_draw_round(uuid, smallint, smallint) from public, anon;
grant execute on function public.start_draw_round(uuid, smallint, smallint) to authenticated, service_role;

-- 7. finalise_draw_match — write final scores, mark match finished.
-- No ELO ladder for Pictionary in v1, so no rating upserts.
drop function if exists public.finalise_draw_match(uuid, jsonb);
create or replace function public.finalise_draw_match(
  p_match_id uuid,
  p_player_updates jsonb
) returns boolean
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_status text;
  v_lock_key bigint := hashtext('live_match:' || p_match_id::text);
  v_pu record;
begin
  perform pg_advisory_xact_lock(v_lock_key);

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

  for v_pu in
    select * from jsonb_to_recordset(p_player_updates)
      as x(slot smallint, score integer, correct integer, rank smallint)
  loop
    update public.live_match_players
    set score = v_pu.score,
        correct = v_pu.correct,
        rank = v_pu.rank
    where match_id = p_match_id and slot = v_pu.slot;
  end loop;

  update public.live_matches
  set status = 'finished',
      ended_at = timezone('utc', now())
  where id = p_match_id;

  return true;
end;
$$;

revoke execute on function public.finalise_draw_match(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.finalise_draw_match(uuid, jsonb) to service_role;
