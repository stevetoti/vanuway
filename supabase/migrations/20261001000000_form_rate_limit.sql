-- Durable fixed-window counters for public forms (signup, contact, newsletter).
-- Shared by every app instance; stores hashes, never raw emails/IPs.
-- Call from server code with the service role:
--   select take_form_request(sha256('contact:ip:' || ip), 5, 3600);  -- 5/hour per IP
--   select take_form_request(sha256('contact:email:' || email), 2, 3600);
-- Returns true when the request is within the limit.
create table if not exists public.form_request_limits (
  bucket text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
create index if not exists form_request_limits_expiry_idx on public.form_request_limits(window_start);
alter table public.form_request_limits enable row level security;
revoke all on public.form_request_limits from public, anon, authenticated;
grant all on public.form_request_limits to service_role;

create or replace function public.take_form_request(p_bucket text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if p_limit < 1 or p_seconds < 1 or p_seconds > 86400 then raise exception 'Invalid rate limit'; end if;
  delete from public.form_request_limits where window_start < now() - interval '2 days';
  insert into public.form_request_limits as r values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    attempts = case when r.window_start <= now() - make_interval(secs => p_seconds) then 1 else r.attempts + 1 end,
    window_start = case when r.window_start <= now() - make_interval(secs => p_seconds) then now() else r.window_start end
  returning attempts into n;
  return n <= p_limit;
end;
$$;
revoke all on function public.take_form_request(text, integer, integer) from public, anon, authenticated;
grant execute on function public.take_form_request(text, integer, integer) to service_role;
