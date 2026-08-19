-- Preview submissions write to the same tables but must never inflate public counts.
-- 0006_preview.sql and 0007_campaign_state.sql already exist; this is the next migration.

alter table public.submissions
  add column if not exists is_test boolean not null default false;

drop index if exists public.submissions_dedupe;
create unique index submissions_dedupe
  on public.submissions (campaign_id, email_normalized)
  where status in ('verified', 'handoff_opened', 'confirmed_sent', 'server_sent')
    and is_test = false;

create or replace function public.campaign_stats(p_slug text)
returns table (confirmed bigint, opened bigint, districts bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) filter (where s.is_test = false and s.status in ('confirmed_sent', 'server_sent')),
    count(*) filter (where s.is_test = false and s.status = 'handoff_opened'),
    count(distinct s.district) filter (where s.is_test = false and s.status in ('confirmed_sent', 'server_sent'))
  from public.submissions s
  join public.campaigns c on c.id = s.campaign_id
  where c.slug = p_slug;
$$;

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

create or replace function public.constituency_breakdown(p_slug text)
returns table (name_ml text, name_en text, district text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select con.name_ml, con.name_en, con.district, count(s.id)
  from public.constituencies con
  left join public.submissions s
    on s.constituency_id = con.id
   and s.is_test = false
   and s.status in ('confirmed_sent', 'server_sent')
  join public.campaigns c on c.slug = p_slug
  group by con.name_ml, con.name_en, con.district
  having count(s.id) > 0
  order by count(s.id) desc;
$$;

drop function if exists public.create_submission(
  text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, uuid, uuid[]
);

create function public.create_submission(
  p_campaign_slug   text,
  p_full_name       text,
  p_email           text,
  p_phone           text,
  p_address         text,
  p_panchayat       text,
  p_district        text,
  p_pincode         text,
  p_language        text,
  p_custom_text     text,
  p_clause_codes    text[],
  p_subject         text,
  p_body            text,
  p_ip_hash         text,
  p_user_agent      text,
  p_consent_version text,
  p_constituency_id uuid,
  p_cc_rep_ids      uuid[],
  p_is_test         boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id   uuid;
  v_is_active     boolean;
  v_submission_id uuid;
begin
  select id, is_active into v_campaign_id, v_is_active
  from public.campaigns
  where slug = p_campaign_slug;

  if v_campaign_id is null then
    raise exception 'campaign_not_active';
  end if;

  if p_is_test is not true and v_is_active is not true then
    raise exception 'campaign_not_active';
  end if;

  insert into public.submissions (
    campaign_id, full_name, email, phone_e164, address_line, panchayat,
    district, pincode, language, custom_text, generated_subject, generated_body,
    ip_hash, user_agent, consent_version, constituency_id, cc_representative_ids,
    is_test
  ) values (
    v_campaign_id, p_full_name, p_email, p_phone, p_address, p_panchayat,
    p_district, p_pincode, p_language, p_custom_text, p_subject, p_body,
    p_ip_hash, p_user_agent, p_consent_version, p_constituency_id,
    coalesce(p_cc_rep_ids, '{}'),
    coalesce(p_is_test, false)
  ) returning id into v_submission_id;

  insert into public.submission_clauses (submission_id, clause_id)
  select v_submission_id, oc.id
  from public.objection_clauses oc
  where oc.campaign_id = v_campaign_id
    and oc.code = any(p_clause_codes)
    and oc.is_active;

  return v_submission_id;
end;
$$;

revoke all on function public.create_submission(
  text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, uuid, uuid[], boolean
) from public, anon, authenticated;
grant execute on function public.create_submission(
  text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, uuid, uuid[], boolean
) to service_role;

revoke all on function public.bump_rate_limit(text, text, integer) from public, anon, authenticated;
grant execute on function public.bump_rate_limit(text, text, integer) to service_role;

grant execute on function public.campaign_stats(text) to anon, authenticated, service_role;
grant execute on function public.clause_breakdown(text) to anon, authenticated, service_role;
grant execute on function public.constituency_breakdown(text) to anon, authenticated, service_role;
