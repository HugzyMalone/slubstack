-- Daily quest progress.
-- Quest definitions are deterministic from date in lib/quests.ts; we only persist progress.

create table if not exists public.quest_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  quest_id     text not null,
  progress     int  not null default 0,
  completed_at timestamptz,
  primary key (user_id, date, quest_id)
);

alter table public.quest_progress enable row level security;

create policy "quest_progress own select" on public.quest_progress
  for select using (auth.uid() = user_id);

create policy "quest_progress own insert" on public.quest_progress
  for insert with check (auth.uid() = user_id);

create policy "quest_progress own update" on public.quest_progress
  for update using (auth.uid() = user_id);

create index if not exists quest_progress_user_date_idx
  on public.quest_progress (user_id, date desc);
