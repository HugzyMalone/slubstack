-- Fix: the league_members and league_cohorts SELECT policies both referenced
-- league_members directly, so reading either table re-evaluated the
-- league_members policy against itself -> 42P17 infinite recursion. Every
-- authenticated read errored; /api/leagues/current ignored the error and
-- returned an empty member list, so the league page showed "Cohort empty".
-- Route the membership check through a SECURITY DEFINER helper whose inner read
-- bypasses RLS, so the policy can no longer recurse.

create or replace function public.is_cohort_member(c uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.league_members
    where cohort_id = c and user_id = auth.uid()
  );
$$;

grant execute on function public.is_cohort_member(uuid) to authenticated, anon;

drop policy if exists "league_members same-cohort read" on public.league_members;
create policy "league_members same-cohort read" on public.league_members
  for select using (public.is_cohort_member(cohort_id));

drop policy if exists "league_cohorts member read" on public.league_cohorts;
create policy "league_cohorts member read" on public.league_cohorts
  for select using (public.is_cohort_member(id));
