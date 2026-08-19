-- Custom text moderation for public display
alter table submissions
  add column if not exists custom_text_public boolean not null default false;

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
  where s.status in ('confirmed_sent', 'server_sent')
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
    and s.status in ('confirmed_sent', 'server_sent')
    and s.full_name is not null
  order by s.confirmed_at desc nulls last
  limit 100;
$$;

grant execute on function public.district_breakdown(text) to anon;
grant execute on function public.public_supporters(text) to anon;
