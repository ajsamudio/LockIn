-- ============================================================
-- LockIn – Supabase schema
-- Run this entire file in the Supabase SQL Editor once.
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. day_data table
--    One row per user per calendar day.
--    blocks is a JSONB array of TimeBlock objects.
create table if not exists public.day_data (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            text not null,                   -- 'YYYY-MM-DD'
  blocks          jsonb not null default '[]',
  sessions        int  not null default 0,
  focused_minutes int  not null default 0,
  tasks_done      int  not null default 0,
  updated_at      timestamptz not null default now(),
  unique (user_id, date)
);

-- 2. Row Level Security – users can only touch their own rows
alter table public.day_data enable row level security;

drop policy if exists "own rows only" on public.day_data;
create policy "own rows only"
  on public.day_data
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Keep updated_at fresh automatically
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.day_data;
create trigger set_updated_at
  before update on public.day_data
  for each row execute procedure public.touch_updated_at();

-- ============================================================
-- After running this, go to:
--   Authentication → URL Configuration
--   and add your site URL to "Redirect URLs":
--     http://localhost:5173   (local dev)
--     https://<your-github-pages-url>   (production)
-- ============================================================
