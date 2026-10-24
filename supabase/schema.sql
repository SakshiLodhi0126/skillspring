-- SkillSpring — per-user application state
-- Run this in the Supabase Dashboard: SQL Editor (or `supabase db push`).
-- Stores each authenticated user's full app state as JSONB so the frontend
-- can sync progress to the cloud while still keeping a localStorage fallback.

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_data is 'SkillSpring app state stored per authenticated user.';

-- ---------------------------------------------------------------------------
-- Row Level Security: users can only ever touch their own row.
-- ---------------------------------------------------------------------------
alter table public.user_data enable row level security;

-- Drop-then-create so this migration is safe to re-run.
drop policy if exists "Users can view own data" on public.user_data;
create policy "Users can view own data"
  on public.user_data for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own data" on public.user_data;
create policy "Users can insert own data"
  on public.user_data for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own data" on public.user_data;
create policy "Users can update own data"
  on public.user_data for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Keep updated_at accurate on every write.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_data_set_updated_at on public.user_data;
create trigger user_data_set_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();
