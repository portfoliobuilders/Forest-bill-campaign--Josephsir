-- Live compose for the Forest Bill campaign.
-- Gmail/mailto use the listed TO/CC. This site still does not send email.
-- is_active is the live switch; the gazette window is not required for compose.
-- Gazette dates stay historical so the homepage does not invent a new deadline.

update public.campaigns
set
  is_active = true,
  opens_at = timestamptz '2024-11-01 00:00:00+05:30',
  deadline_at = timestamptz '2024-12-31 23:59:59+05:30',
  recipient_email = 'esz-mef@nic.in',
  recipient_emails = array['esz-mef@nic.in', 'prlsecy.forest@kerala.gov.in'],
  cc_emails = array['emailkifa@gmail.com'],
  summary_ml = '2024 നവംബർ 1-ലെ ഗസറ്റ് ബിൽ 228. പൊതുജന അഭിപ്രായത്തിന് 2024 ഡിസംബർ 31 വരെ സമയമുണ്ടായിരുന്നു. ആ കൂടിയാലോചന അവസാനിച്ചു; കാബിനറ്റ് ബിൽ പിൻവലിച്ചു. നിങ്ങളുടെ സ്വന്തം ഇമെയിലിൽ നിന്ന് ലിസ്റ്റ് ചെയ്ത ഓഫീസുകളിലേക്ക് എതിർപ്പ് അയയ്ക്കാം.',
  summary_en = 'Gazette Bill 228 of 1 November 2024. Public comments closed on 31 December 2024. The Cabinet later dropped the Bill. You can still send a personal objection from your own email to the listed offices.'
where slug in ('demo', 'kerala-forest-amendment-2024');

create or replace function public.campaign_public_state(p_slug text, p_preview text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec public.campaigns%rowtype;
  tok text := nullif(btrim(coalesce(p_preview, '')), '');
begin
  select * into rec
  from public.campaigns
  where slug = p_slug
  limit 1;

  if not found then
    select * into rec
    from public.campaigns
    order by created_at desc
    limit 1;
  end if;

  if found then
    if rec.is_active then
      return jsonb_build_object(
        'state', 'live',
        'campaign', to_jsonb(rec) - 'preview_token'
      );
    end if;

    if rec.preview_token is not null and tok is not null and rec.preview_token = tok then
      return jsonb_build_object(
        'state', 'preview',
        'campaign', to_jsonb(rec) - 'preview_token'
      );
    end if;
  end if;

  if tok is not null then
    select * into rec
    from public.campaigns
    where is_active is not true
      and preview_token is not null
      and preview_token = tok
    limit 1;

    if found then
      return jsonb_build_object(
        'state', 'preview',
        'campaign', to_jsonb(rec) - 'preview_token'
      );
    end if;
  end if;

  return jsonb_build_object('state', 'dormant');
end;
$$;

revoke all on function public.campaign_public_state(text, text) from public;
grant execute on function public.campaign_public_state(text, text) to anon, authenticated, service_role;
