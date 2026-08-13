alter table public.ai_design_requests drop constraint if exists ai_design_requests_status_check;
alter table public.ai_design_requests add constraint ai_design_requests_status_check check (status in ('pending', 'success', 'failed', 'quota_blocked'));

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

create table if not exists private.ai_design_quota_policy (
  singleton boolean primary key default true check (singleton),
  request_limit integer not null default 3 check (request_limit between 1 and 100),
  window_hours integer not null default 24 check (window_hours between 1 and 168),
  pending_timeout_minutes integer not null default 5 check (pending_timeout_minutes between 1 and 60)
);

insert into private.ai_design_quota_policy(singleton, request_limit, window_hours, pending_timeout_minutes)
values (true, 3, 24, 5)
on conflict (singleton) do nothing;

revoke all on table private.ai_design_quota_policy from public, anon, authenticated, service_role;

drop function if exists public.reserve_ai_design_request(integer, integer, text);
drop function if exists public.complete_ai_design_request(uuid, text, integer);

create or replace function public.get_ai_design_quota(p_user_id uuid)
returns table("limit" integer, used integer, remaining integer, window_hours integer)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_limit integer;
  v_window_hours integer;
  v_pending_timeout_minutes integer;
  v_used integer;
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'invalid user' using errcode = '22023';
  end if;

  select policy.request_limit, policy.window_hours, policy.pending_timeout_minutes
    into strict v_limit, v_window_hours, v_pending_timeout_minutes
    from private.ai_design_quota_policy as policy
    where policy.singleton;

  if v_limit not between 1 and 100
    or v_window_hours not between 1 and 168
    or v_pending_timeout_minutes not between 1 and 60 then
    raise exception 'invalid quota policy' using errcode = '22023';
  end if;

  select count(*)::integer into v_used
    from public.ai_design_requests
    where user_id = p_user_id
      and created_at >= now() - make_interval(hours => v_window_hours)
      and (
        status = 'success'
        or (
          status = 'pending'
          and created_at >= now() - make_interval(mins => v_pending_timeout_minutes)
        )
      );

  return query
    select v_limit, least(v_used, v_limit), greatest(0, v_limit - v_used), v_window_hours;
end
$$;

create or replace function public.reserve_ai_design_request(p_user_id uuid, p_model text)
returns table(request_id uuid, "limit" integer, used integer, remaining integer, window_hours integer)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_limit integer;
  v_window_hours integer;
  v_pending_timeout_minutes integer;
  v_used integer;
  v_id uuid;
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'invalid user' using errcode = '22023';
  end if;

  if p_model is null or char_length(btrim(p_model)) not between 1 and 200 then
    raise exception 'invalid model' using errcode = '22023';
  end if;

  select policy.request_limit, policy.window_hours, policy.pending_timeout_minutes
    into strict v_limit, v_window_hours, v_pending_timeout_minutes
    from private.ai_design_quota_policy as policy
    where policy.singleton;

  if v_limit not between 1 and 100
    or v_window_hours not between 1 and 168
    or v_pending_timeout_minutes not between 1 and 60 then
    raise exception 'invalid quota policy' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.ai_design_requests
    set status = 'failed'
    where user_id = p_user_id
      and status = 'pending'
      and created_at < now() - make_interval(mins => v_pending_timeout_minutes);

  select count(*)::integer into v_used
    from public.ai_design_requests
    where user_id = p_user_id
      and status in ('pending', 'success')
      and created_at >= now() - make_interval(hours => v_window_hours);

  if v_used >= v_limit then
    return query select null::uuid, v_limit, least(v_used, v_limit), 0, v_window_hours;
    return;
  end if;

  insert into public.ai_design_requests(user_id, prompt, model, status, latency_ms)
    values (p_user_id, 'redacted', btrim(p_model), 'pending', 0)
    returning id into v_id;

  return query
    select v_id, v_limit, least(v_used + 1, v_limit), greatest(0, v_limit - v_used - 1), v_window_hours;
end
$$;

create or replace function public.complete_ai_design_request(
  p_user_id uuid,
  p_request_id uuid,
  p_status text,
  p_latency_ms integer
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'invalid user' using errcode = '22023';
  end if;

  if p_request_id is null then
    raise exception 'invalid reservation' using errcode = '22023';
  end if;

  if p_status is null or p_status not in ('success', 'failed') then
    raise exception 'invalid status' using errcode = '22023';
  end if;

  if p_latency_ms is null or p_latency_ms not between 0 and 900000 then
    raise exception 'invalid latency' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.ai_design_requests
    set status = p_status, latency_ms = p_latency_ms
    where id = p_request_id
      and user_id = p_user_id
      and status = 'pending';

  if not found then
    raise exception 'reservation not found' using errcode = 'P0002';
  end if;
end
$$;

revoke all on function public.get_ai_design_quota(uuid) from public, anon, authenticated;
revoke all on function public.reserve_ai_design_request(uuid, text) from public, anon, authenticated;
revoke all on function public.complete_ai_design_request(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.get_ai_design_quota(uuid) to service_role;
grant execute on function public.reserve_ai_design_request(uuid, text) to service_role;
grant execute on function public.complete_ai_design_request(uuid, uuid, text, integer) to service_role;

drop policy if exists "ai_design_requests_insert_own" on public.ai_design_requests;
