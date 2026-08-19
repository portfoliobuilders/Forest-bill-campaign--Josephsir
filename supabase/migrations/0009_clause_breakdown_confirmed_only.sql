-- Idempotent with the count(s.id) fix in 0008. Safe to apply after the first is_test migration.

create or replace function public.clause_breakdown(p_slug text)
returns table (code text, title_ml text, title_en text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select oc.code, oc.title_ml, oc.title_en, count(s.id)
  from public.objection_clauses oc
  join public.campaigns c on c.id = oc.campaign_id and c.slug = p_slug
  left join public.submission_clauses sc on sc.clause_id = oc.id
  left join public.submissions s
    on s.id = sc.submission_id
   and s.is_test = false
   and s.status in ('confirmed_sent', 'server_sent')
  group by oc.code, oc.title_ml, oc.title_en, oc.sort_order
  order by oc.sort_order;
$$;

grant execute on function public.clause_breakdown(text) to anon, authenticated, service_role;
