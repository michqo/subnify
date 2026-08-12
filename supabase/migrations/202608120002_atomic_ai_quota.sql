alter table public.ai_design_requests drop constraint if exists ai_design_requests_status_check;
alter table public.ai_design_requests add constraint ai_design_requests_status_check check (status in ('pending', 'success', 'failed', 'quota_blocked'));

create or replace function public.reserve_ai_design_request(p_limit integer, p_window_hours integer, p_model text)
returns table(request_id uuid, used integer, remaining integer)
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_used integer; v_id uuid;
begin
  if v_user is null then raise exception 'unauthorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  update public.ai_design_requests set status = 'failed'
    where user_id = v_user and status = 'pending' and created_at < now() - interval '5 minutes';
  select count(*)::integer into v_used from public.ai_design_requests
    where user_id = v_user and status in ('pending', 'success')
      and created_at >= now() - make_interval(hours => p_window_hours);
  if v_used >= p_limit then return query select null::uuid, v_used, 0; return; end if;
  insert into public.ai_design_requests(user_id, prompt, model, status, latency_ms)
    values (v_user, 'redacted', p_model, 'pending', 0) returning id into v_id;
  return query select v_id, v_used + 1, greatest(0, p_limit - v_used - 1);
end $$;

create or replace function public.complete_ai_design_request(p_request_id uuid, p_status text, p_latency_ms integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('success', 'failed') then raise exception 'invalid status'; end if;
  update public.ai_design_requests set status = p_status, latency_ms = greatest(0, p_latency_ms)
    where id = p_request_id and user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'reservation not found'; end if;
end $$;

revoke all on function public.reserve_ai_design_request(integer, integer, text) from public;
revoke all on function public.complete_ai_design_request(uuid, text, integer) from public;
grant execute on function public.reserve_ai_design_request(integer, integer, text) to authenticated;
grant execute on function public.complete_ai_design_request(uuid, text, integer) to authenticated;
drop policy if exists "ai_design_requests_insert_own" on public.ai_design_requests;
