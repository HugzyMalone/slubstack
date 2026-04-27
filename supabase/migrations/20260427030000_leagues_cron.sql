-- Weekly promote/demote tick.
-- Top 7 of a cohort move up a tier, bottom 5 move down. Middle stays.
-- Tier transitions are stored on the *previous* membership row as next_tier_id;
-- assign_cohort reads that to place the user in the right cohort the next week.

alter table public.league_members
  add column if not exists next_tier_id smallint references public.league_tiers(id);

alter table public.league_cohorts
  add column if not exists processed_at timestamptz;

create index if not exists league_members_user_next_idx
  on public.league_members (user_id, next_tier_id);

-- Re-create assign_cohort to prefer next_tier_id from the user's most recent
-- prior cohort, falling back to that cohort's tier_id, then Bronze.
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

-- Process every cohort whose week_start is strictly before this week and
-- which hasn't been processed yet. Top 7 promote (clamp at max rank), bottom 5
-- demote (clamp at min rank). Middle members get next_tier_id = current tier_id.
create or replace function public.promote_demote()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  this_week date := public.week_start_of((now() at time zone 'utc')::date);
  max_rank  smallint;
  min_rank  smallint;
  c         record;
  processed int := 0;
begin
  select max(rank), min(rank) into max_rank, min_rank from public.league_tiers;

  for c in
    select id, tier_id
    from public.league_cohorts
    where week_start < this_week and processed_at is null
  loop
    with ranked as (
      select lm.user_id, lm.weekly_xp,
             row_number() over (order by lm.weekly_xp desc, lm.joined_at asc) as rk,
             count(*) over () as n
      from public.league_members lm
      where lm.cohort_id = c.id
    ),
    decided as (
      select r.user_id,
        case
          when r.rk <= 7 then
            (select id from public.league_tiers where rank =
              least(max_rank, (select rank from public.league_tiers where id = c.tier_id) + 1))
          when r.rk > r.n - 5 then
            (select id from public.league_tiers where rank =
              greatest(min_rank, (select rank from public.league_tiers where id = c.tier_id) - 1))
          else c.tier_id
        end as next_id
      from ranked r
    )
    update public.league_members lm
       set next_tier_id = d.next_id
      from decided d
     where lm.cohort_id = c.id and lm.user_id = d.user_id;

    update public.league_cohorts set processed_at = now() where id = c.id;
    processed := processed + 1;
  end loop;

  return processed;
end;
$$;

grant execute on function public.promote_demote() to service_role;

-- Schedule weekly Monday 00:05 UTC. pg_cron must be enabled on the project.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
      from cron.job where jobname = 'slubstack_promote_demote';
    perform cron.schedule('slubstack_promote_demote', '5 0 * * 1', $cron$select public.promote_demote();$cron$);
  end if;
exception
  when others then null;
end$$;
