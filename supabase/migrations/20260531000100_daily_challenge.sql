-- F2 Daily Challenge: per-day results + denormalised streaks.
-- STRICTLY ADDITIVE: new tables, new indexes, new policies, new function only. No drop/alter on existing objects.
-- FK -> public.profiles(id): matches every existing score table (wordle_scores, math_blitz_scores, ...)
-- and enables the PostgREST profiles embed the leaderboard read relies on. (profiles.id itself
-- references auth.users(id) on delete cascade, so cascade semantics are identical to auth.users.)

create table if not exists public.daily_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  game_kind text not null,
  score integer not null default 0,
  correct integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);
create index if not exists daily_results_date_score_idx
  on public.daily_results (date, score desc);

create table if not exists public.daily_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current integer not null default 0,
  longest integer not null default 0,
  last_played date,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.daily_results enable row level security;
alter table public.daily_streaks enable row level security;

drop policy if exists "daily results readable by everyone" on public.daily_results;
create policy "daily results readable by everyone"
on public.daily_results for select to anon, authenticated using (true);

drop policy if exists "users can insert their own daily result" on public.daily_results;
create policy "users can insert their own daily result"
on public.daily_results for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "daily streaks readable by everyone" on public.daily_streaks;
create policy "daily streaks readable by everyone"
on public.daily_streaks for select to anon, authenticated using (true);

drop policy if exists "users can insert their own daily streak" on public.daily_streaks;
create policy "users can insert their own daily streak"
on public.daily_streaks for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users can update their own daily streak" on public.daily_streaks;
create policy "users can update their own daily streak"
on public.daily_streaks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- security definer: one attempt/day insert (on-conflict-do-nothing) + streak recompute.
-- Relies on auth.uid(), so it is invoked via the RLS-respecting (user-context) server client,
-- not the service-role admin client.
create or replace function public.submit_daily_result(
  p_date date,
  p_game_kind text,
  p_score integer,
  p_correct integer
) returns table (
  rank integer,
  current_streak integer,
  longest_streak integer,
  already_played boolean
) language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean := false;
  v_current integer;
  v_longest integer;
  v_last date;
  v_rank integer;
  v_stored_score integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  with ins as (
    insert into public.daily_results (user_id, date, game_kind, score, correct)
    values (v_user_id, p_date, p_game_kind, p_score, p_correct)
    on conflict (user_id, date) do nothing
    returning 1
  )
  select count(*) > 0 into v_inserted from ins;

  if v_inserted then
    select s.current, s.longest, s.last_played
      into v_current, v_longest, v_last
      from public.daily_streaks s where s.user_id = v_user_id;

    if v_last = p_date - 1 then
      v_current := coalesce(v_current, 0) + 1;
    else
      v_current := 1;
    end if;
    v_longest := greatest(coalesce(v_longest, 0), v_current);

    insert into public.daily_streaks (user_id, current, longest, last_played, updated_at)
    values (v_user_id, v_current, v_longest, p_date, timezone('utc', now()))
    on conflict (user_id) do update
      set current = excluded.current,
          longest = excluded.longest,
          last_played = excluded.last_played,
          updated_at = excluded.updated_at;
  else
    select s.current, s.longest into v_current, v_longest
      from public.daily_streaks s where s.user_id = v_user_id;
    v_current := coalesce(v_current, 0);
    v_longest := coalesce(v_longest, 0);
  end if;

  select dr.score into v_stored_score
    from public.daily_results dr
    where dr.user_id = v_user_id and dr.date = p_date;

  select count(*) + 1 into v_rank
    from public.daily_results dr
    where dr.date = p_date and dr.score > coalesce(v_stored_score, p_score);

  return query select v_rank, v_current, v_longest, (not v_inserted);
end;
$$;
