-- Security fix: SECURITY DEFINER RPCs that took a caller-supplied user id AND
-- were granted to `authenticated` let any logged-in user spoof another user's id
-- by calling supabase.rpc(...) directly from the browser, bypassing the API routes.
--
-- Two shapes of fix:
--   * League RPCs are called from server routes using the *user-context* client
--     (RLS / authenticated role), so they must stay callable by authenticated —
--     but they now read auth.uid() internally instead of trusting a uid argument.
--   * Draw RPCs are only ever called from server routes using the *service-role*
--     admin client, so they are revoked from authenticated/anon and left to
--     service_role only, matching finalise_draw_match.

-- 1. award_league_xp / assign_cohort — drop the uid parameter, read auth.uid().
-- award_league_xp depends on assign_cohort, so drop it first.
drop function if exists public.award_league_xp(uuid, int);
drop function if exists public.assign_cohort(uuid);

-- assign_cohort body matches the latest definition (20260427030000_leagues_cron.sql),
-- which prefers next_tier_id; only the uid source changes to auth.uid().
create or replace function public.assign_cohort()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  this_week date := public.week_start_of((now() at time zone 'utc')::date);
  current_tier smallint;
  cohort uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select cohort_id into cohort
  from public.league_members lm
  join public.league_cohorts lc on lc.id = lm.cohort_id
  where lm.user_id = uid and lc.week_start = this_week
  limit 1;
  if cohort is not null then
    return cohort;
  end if;

  select coalesce(lm.next_tier_id, lc.tier_id) into current_tier
  from public.league_members lm
  join public.league_cohorts lc on lc.id = lm.cohort_id
  where lm.user_id = uid
  order by lc.week_start desc
  limit 1;

  if current_tier is null then
    current_tier := 1;
  end if;

  select lc.id into cohort
  from public.league_cohorts lc
  where lc.tier_id = current_tier and lc.week_start = this_week
    and (select count(*) from public.league_members where cohort_id = lc.id) < 30
  order by lc.created_at asc
  limit 1;

  if cohort is null then
    insert into public.league_cohorts (tier_id, week_start)
    values (current_tier, this_week)
    returning id into cohort;
  end if;

  insert into public.league_members (cohort_id, user_id) values (cohort, uid)
  on conflict do nothing;
  return cohort;
end;
$$;

create or replace function public.award_league_xp(amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cohort uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if amount <= 0 then return; end if;
  cohort := public.assign_cohort();
  update public.league_members
    set weekly_xp = weekly_xp + amount
    where cohort_id = cohort and user_id = uid;
end;
$$;

grant execute on function public.assign_cohort()      to authenticated, service_role;
grant execute on function public.award_league_xp(int) to authenticated, service_role;

-- 2. Draw RPCs — service-role-only. Called solely via the admin client in
-- app/api/live/draw/*, so authenticated/anon never need execute.
revoke execute on function public.create_draw_room(uuid, text, text, smallint, integer) from authenticated, anon;
revoke execute on function public.join_draw_room(uuid, text, text, text)                 from authenticated, anon;
revoke execute on function public.start_draw_round(uuid, smallint, smallint)             from authenticated, anon;
