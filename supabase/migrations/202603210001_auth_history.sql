create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  base_network text not null,
  base_cidr integer not null,
  input_subnets jsonb not null,
  result_subnets jsonb not null,
  total_required_hosts integer not null,
  total_usable_hosts integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_calculations_user_created_at
  on public.calculations (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.calculations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "calculations_select_own" on public.calculations;
create policy "calculations_select_own"
  on public.calculations
  for select
  using (auth.uid() = user_id);

drop policy if exists "calculations_insert_own" on public.calculations;
create policy "calculations_insert_own"
  on public.calculations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "calculations_update_own" on public.calculations;
create policy "calculations_update_own"
  on public.calculations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
