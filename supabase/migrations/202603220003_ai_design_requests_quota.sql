create table if not exists public.ai_design_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  model text not null,
  status text not null default 'success',
  latency_ms integer,
  created_at timestamptz not null default now(),
  constraint ai_design_requests_status_check check (status in ('success', 'failed', 'quota_blocked'))
);

create index if not exists idx_ai_design_requests_user_created_at
  on public.ai_design_requests (user_id, created_at desc);

alter table public.ai_design_requests enable row level security;

drop policy if exists "ai_design_requests_select_own" on public.ai_design_requests;
create policy "ai_design_requests_select_own"
  on public.ai_design_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "ai_design_requests_insert_own" on public.ai_design_requests;
create policy "ai_design_requests_insert_own"
  on public.ai_design_requests
  for insert
  with check (auth.uid() = user_id);
