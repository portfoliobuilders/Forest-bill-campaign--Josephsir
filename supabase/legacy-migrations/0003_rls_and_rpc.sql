alter table campaigns            enable row level security;
alter table objection_clauses    enable row level security;
alter table submissions          enable row level security;
alter table submission_clauses   enable row level security;
alter table otp_codes            enable row level security;
alter table rate_limits          enable row level security;
alter table deletion_requests    enable row level security;
alter table constituencies       enable row level security;
alter table representatives      enable row level security;
alter table locality_constituency enable row level security;

create policy campaigns_public_read on campaigns
  for select to anon using (is_active = true);

create policy clauses_public_read on objection_clauses
  for select to anon using (
    is_active = true
    and exists (select 1 from campaigns c where c.id = campaign_id and c.is_active)
  );

create policy constituencies_public_read on constituencies
  for select to anon using (is_active = true);

create policy representatives_public_read on representatives
  for select to anon using (is_current = true);

create policy locality_public_read on locality_constituency
  for select to anon using (true);

-- NO anon policy on submissions, submission_clauses, otp_codes,
-- rate_limits or deletion_requests. Deliberate. Service role only.

create or replace function public.campaign_stats(p_slug text)
returns table (confirmed bigint, opened bigint, districts bigint)
language sql security definer set search_path = public stable as $$
  select
    count(*) filter (where s.status in ('confirmed_sent','server_sent')),
    count(*) filter (where s.status = 'handoff_opened'),
    count(distinct s.district) filter (where s.status in ('confirmed_sent','server_sent'))
  from submissions s
  join campaigns c on c.id = s.campaign_id
  where c.slug = p_slug;
$$;

create or replace function public.clause_breakdown(p_slug text)
returns table (code text, title_ml text, title_en text, cnt bigint)
language sql security definer set search_path = public stable as $$
  select oc.code, oc.title_ml, oc.title_en, count(sc.submission_id)
  from objection_clauses oc
  join campaigns c on c.id = oc.campaign_id and c.slug = p_slug
  left join submission_clauses sc on sc.clause_id = oc.id
  left join submissions s
    on s.id = sc.submission_id
   and s.status in ('confirmed_sent','server_sent')
  group by oc.code, oc.title_ml, oc.title_en, oc.sort_order
  order by oc.sort_order;
$$;

create or replace function public.constituency_breakdown(p_slug text)
returns table (name_ml text, name_en text, district text, cnt bigint)
language sql security definer set search_path = public stable as $$
  select con.name_ml, con.name_en, con.district, count(s.id)
  from constituencies con
  left join submissions s
    on s.constituency_id = con.id
   and s.status in ('confirmed_sent','server_sent')
  join campaigns c on c.slug = p_slug
  group by con.name_ml, con.name_en, con.district
  having count(s.id) > 0
  order by count(s.id) desc;
$$;

create or replace function public.bump_rate_limit(
  p_bucket text, p_identifier text, p_limit int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_count  int;
begin
  insert into rate_limits (bucket, identifier, window_start, count)
  values (p_bucket, p_identifier, v_window, 1)
  on conflict (bucket, identifier, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;

create or replace function public.create_submission(
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
  p_cc_rep_ids      uuid[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_campaign_id   uuid;
  v_submission_id uuid;
begin
  select id into v_campaign_id
  from campaigns where slug = p_campaign_slug and is_active;

  if v_campaign_id is null then
    raise exception 'campaign_not_active';
  end if;

  insert into submissions (
    campaign_id, full_name, email, phone_e164, address_line, panchayat,
    district, pincode, language, custom_text, generated_subject, generated_body,
    ip_hash, user_agent, consent_version, constituency_id, cc_representative_ids
  ) values (
    v_campaign_id, p_full_name, p_email, p_phone, p_address, p_panchayat,
    p_district, p_pincode, p_language, p_custom_text, p_subject, p_body,
    p_ip_hash, p_user_agent, p_consent_version, p_constituency_id,
    coalesce(p_cc_rep_ids, '{}')
  ) returning id into v_submission_id;

  insert into submission_clauses (submission_id, clause_id)
  select v_submission_id, oc.id
  from objection_clauses oc
  where oc.campaign_id = v_campaign_id
    and oc.code = any(p_clause_codes)
    and oc.is_active;

  return v_submission_id;
end;
$$;

grant execute on function public.campaign_stats(text)          to anon;
grant execute on function public.clause_breakdown(text)        to anon;
grant execute on function public.constituency_breakdown(text)  to anon;
