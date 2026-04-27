-- Hearts state for cross-device sync.
-- Local store wins on conflict; this is best-effort persistence.

alter table public.user_stats
  add column if not exists hearts smallint not null default 5,
  add column if not exists hearts_last_regen_at timestamptz;
