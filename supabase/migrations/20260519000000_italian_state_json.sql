alter table public.user_stats
  add column if not exists italian_state_json jsonb;
