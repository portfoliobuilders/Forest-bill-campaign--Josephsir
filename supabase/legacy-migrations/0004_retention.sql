/*
 * RETENTION POLICY — runs daily via pg_cron
 * (This file is 0004 because 0007_campaign_state.sql already exists in this repo.
 *  The behaviour matches the original 0007_retention spec.)
 *
 * Trigger: campaign deadline_at is more than 180 days in the past.
 *
 * DESTROYED (irreversible):
 *   full_name, email, phone_e164, address_line, pincode, custom_text, ip_hash, user_agent
 *
 * PRESERVED (aggregates survive):
 *   district, constituency_id, status, submission_clauses rows, timestamps, send_method
 *
 * After purge, individual citizens cannot be re-identified from the row.
 * District and constituency breakdowns continue to work.
 */

create extension if not exists pg_cron with schema extensions;

alter table submissions
  alter column full_name drop not null,
  alter column email drop not null,
  alter column address_line drop not null;

create or replace function public.purge_expired_submission_pii()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update submissions s
  set
    full_name     = null,
    email         = null,
    phone_e164    = null,
    address_line  = null,
    pincode       = null,
    custom_text   = null,
    ip_hash       = null,
    user_agent    = null
  from campaigns c
  where s.campaign_id = c.id
    and c.deadline_at < now() - interval '180 days'
    and (
      s.full_name is not null
      or s.email is not null
      or s.custom_text is not null
      or s.ip_hash is not null
    );
end;
$$;

select cron.schedule(
  'purge-expired-submission-pii',
  '0 3 * * *',
  $$select public.purge_expired_submission_pii()$$
);
