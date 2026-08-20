-- Public aggregates must never include preview/test rows.
-- Names on /data: show_name_public only, and never anything but name + district.
-- custom_text is never returned here (rejected or approved).

create or replace function public.district_breakdown(p_slug text)
returns table (district text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select s.district, count(*)
  from submissions s
  join campaigns c on c.id = s.campaign_id and c.slug = p_slug
  where s.is_test = false
    and s.status in ('confirmed_sent', 'server_sent')
  group by s.district
  having count(*) > 0
  order by count(*) desc;
$$;

create or replace function public.public_supporters(p_slug text)
returns table (display_name text, district text)
language sql
security definer
set search_path = public
stable
as $$
  select s.full_name, s.district
  from submissions s
  join campaigns c on c.id = s.campaign_id and c.slug = p_slug
  where s.show_name_public = true
    and s.is_test = false
    and s.status in ('confirmed_sent', 'server_sent')
    and s.full_name is not null
    and length(trim(s.full_name)) > 0
  order by s.confirmed_at desc nulls last
  limit 100;
$$;

grant execute on function public.district_breakdown(text) to anon, authenticated, service_role;
grant execute on function public.public_supporters(text) to anon, authenticated, service_role;

-- Purge is irreversible and must not be callable via the Data API.
revoke all on function public.purge_expired_submission_pii() from public, anon, authenticated;
