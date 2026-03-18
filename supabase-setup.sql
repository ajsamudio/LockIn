-- Run this in your Supabase project: SQL Editor → New query

create table day_data (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users not null,
  date            text not null,
  blocks          jsonb default '[]',
  sessions        int  default 0,
  focused_minutes int  default 0,
  tasks_done      int  default 0,
  updated_at      timestamptz default now(),
  unique(user_id, date)
);

alter table day_data enable row level security;

create policy "Users own their data"
  on day_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
