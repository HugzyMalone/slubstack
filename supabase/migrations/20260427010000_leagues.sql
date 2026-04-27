-- Weekly leagues — bronze through diamond.
-- Cohorts of up to 30 users are seeded on demand the first time a user earns XP that week.
-- Promotion/demotion at week boundary is a follow-up (intended as a scheduled function).

create table if not exists public.league_tiers (
  id   smallint primary key,
  name text     not null,
  rank smallint not null
);

insert into public.league_tiers (id, name, rank) values
  (1, 'Bronze',   1),
  (2, 'Silver',   2),
  (3, 'Gold',     3),
  (4, 'Platinum', 4),
  (5, 'Diamond',  5)
on conflict (id) do nothing;

create table if not exists public.league_cohorts (
  id         uuid primary key default gen_random_uuid(),
  tier_id    smallint not null references public.league_tiers(id),
  week_start date not null,
  created_at timestamptz not null default now()
);

create index if not exists league_cohorts_week_tier_idx
  on public.league_cohorts (week_start, tier_id);

create table if not exists public.league_members (
  cohort_id  uuid not null references public.league_cohorts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  weekly_xp  int  not null default 0,
  joined_at  timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

create index if not exists league_members_user_idx
  on public.league_members (user_id);

alter table public.league_tiers   enable row level security;
alter table public.league_cohorts enable row level security;
alter table public.league_members enable row level security;

drop policy if exists "league_tiers public read" on public.league_tiers;
create policy "league_tiers public read" on public.league_tiers for select using (true);

drop policy if exists "league_cohorts member read" on public.league_cohorts;
create policy "league_cohorts member read" on public.league_cohorts
  for select using (
    exists (
      select 1 from public.league_members
      where league_members.cohort_id = league_cohorts.id
        and league_members.user_id   = auth.uid()
    )
  );

drop policy if exists "league_members same-cohort read" on public.league_members;
create policy "league_members same-cohort read" on public.league_members
  for select using (
    exists (
      select 1 from public.league_members me
      where me.cohort_id = league_members.cohort_id
        and me.user_id   = auth.uid()
    )
  );

-- Monday of the week containing `d`, in UTC.
create or replace function public.week_start_of(d date)
returns date
language sql immutable as $$
  select d - ((extract(isodow from d)::int - 1));
$$;

-- Find or create the user's cohort for the current week.
-- Tier defaults to Bronze; otherwise inherits the user's most recent prior tier.
-- Returns the cohort id.
create or replace function public.assign_cohort(uid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  this_week date := public.week_start_of((now() at time zone 'utc')::date);
  current_tier smallint;
  cohort uuid;
begin
  select cohort_id into cohort
  from public.league_members lm
  join public.league_cohorts lc on lc.id = lm.cohort_id
  where lm.user_id = uid and lc.week_start = this_week
  limit 1;
  if cohort is not null then
    return cohort;
  end if;

  select lc.tier_id into current_tier
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

-- Increment the user's weekly_xp by `amount`, joining a cohort if needed.
create or replace function public.award_league_xp(uid uuid, amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare cohort uuid;
begin
  if amount <= 0 then return; end if;
  cohort := public.assign_cohort(uid);
  update public.league_members
    set weekly_xp = weekly_xp + amount
    where cohort_id = cohort and user_id = uid;
end;
$$;

grant execute on function public.assign_cohort(uuid)        to authenticated, service_role;
grant execute on function public.award_league_xp(uuid, int) to authenticated, service_role;
