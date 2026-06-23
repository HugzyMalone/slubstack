-- All-time tier ladder: replace weekly cohorts with cumulative lifetime XP.
-- Tier is DERIVED from lifetime XP crossing fixed thresholds, never stored, so it
-- can't drift. XP only accumulates, so promotion is one-way (no relegation, no reset).
-- The weekly cohort tables are kept for history but no longer drive reads or writes.

-- 1. Fixed XP thresholds per tier. Bronze starts at 0 so everyone qualifies.
alter table public.league_tiers add column if not exists min_xp int not null default 0;
update public.league_tiers set min_xp = case id
  when 1 then 0    -- Bronze
  when 2 then 20   -- Silver
  when 3 then 50   -- Gold
  when 4 then 100  -- Platinum
  when 5 then 500  -- Diamond
end;

-- 2. Single lifetime-XP total per player.
create table if not exists public.league_standings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  lifetime_xp int  not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.league_standings enable row level security;
drop policy if exists "league_standings public read" on public.league_standings;
create policy "league_standings public read" on public.league_standings for select using (true);

-- 3. Backfill from existing weekly memberships, summing every historical cohort.
-- Additive: do nothing on conflict so a re-apply can never clobber live totals.
insert into public.league_standings (user_id, lifetime_xp)
select user_id, sum(weekly_xp)::int from public.league_members group by user_id
on conflict (user_id) do nothing;

-- 4. award_league_xp now increments the player's lifetime total; tier follows.
create or replace function public.award_league_xp(amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if amount <= 0 then return; end if;
  insert into public.league_standings (user_id, lifetime_xp, updated_at)
  values (uid, amount, now())
  on conflict (user_id) do update
    set lifetime_xp = public.league_standings.lifetime_xp + excluded.lifetime_xp,
        updated_at  = now();
end;
$$;

-- 5. Read path: the caller's tier, their lifetime XP, the ranked board for that
-- tier, and the full ladder. SECURITY DEFINER so the profile/standings joins
-- bypass RLS cleanly (no policy recursion, no swallowed errors).
create or replace function public.league_view()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  uid     uuid := auth.uid();
  my_xp   int;
  my_tier record;
  members jsonb;
  tiers   jsonb;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  select coalesce((select lifetime_xp from public.league_standings where user_id = uid), 0)
    into my_xp;

  select t.id, t.name, t.rank, t.min_xp into my_tier
  from public.league_tiers t
  where t.min_xp <= my_xp
  order by t.min_xp desc
  limit 1;

  with bounds as (
    select my_tier.min_xp as lo,
           coalesce(
             (select min(t2.min_xp) from public.league_tiers t2 where t2.min_xp > my_tier.min_xp),
             2147483647
           ) as hi
  ),
  board as (
    select s.user_id, s.lifetime_xp,
           row_number() over (order by s.lifetime_xp desc, s.updated_at asc) as rnk
    from public.league_standings s, bounds b
    where s.lifetime_xp >= b.lo and s.lifetime_xp < b.hi
  )
  select jsonb_agg(jsonb_build_object(
           'rank', board.rnk,
           'userId', board.user_id,
           'username', coalesce(p.username, 'learner-' || substr(board.user_id::text, 1, 8)),
           'avatar', p.avatar_url,
           'lifetimeXp', board.lifetime_xp,
           'isYou', board.user_id = uid
         ) order by board.rnk)
    into members
  from board left join public.profiles p on p.id = board.user_id;

  select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'rank', rank, 'minXp', min_xp) order by rank)
    into tiers
  from public.league_tiers;

  return jsonb_build_object(
    'tier', jsonb_build_object('id', my_tier.id, 'name', my_tier.name, 'rank', my_tier.rank, 'minXp', my_tier.min_xp),
    'lifetimeXp', my_xp,
    'members', coalesce(members, '[]'::jsonb),
    'tiers', coalesce(tiers, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.league_view() to authenticated, service_role;

-- 6. Retire the weekly machinery from the live path. The promote/demote cron was
-- only ever scheduled when pg_cron was present; unschedule defensively, then drop
-- the now-dead weekly RPCs. Historical cohort tables are left intact.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'slubstack_promote_demote';
  end if;
exception when others then null;
end$$;

drop function if exists public.promote_demote();
drop function if exists public.assign_cohort();
