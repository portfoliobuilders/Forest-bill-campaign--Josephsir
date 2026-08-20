-- Replace the Kerala Forest (Amendment) Bill campaign with the ESA campaign.
--
-- Safety:
-- 1. Copy current campaign-domain rows into forest_bill_backup_20260820
--    so they can be restored if needed.
-- 2. Delete only non-ESA campaign rows (and dependents via FK cascade).
-- 3. Upsert the single live ESA campaign, four concerns, recipients,
--    form fields, and email configuration.
--
-- Does not touch auth.users, site_settings branding, admin accounts,
-- constituencies, representatives, or locality_constituency.

begin;

create schema if not exists forest_bill_backup_20260820;

do $$
begin
  if to_regclass('forest_bill_backup_20260820.campaigns') is null then
    execute 'create table forest_bill_backup_20260820.campaigns as table public.campaigns';
  end if;
  if to_regclass('forest_bill_backup_20260820.objection_clauses') is null then
    execute 'create table forest_bill_backup_20260820.objection_clauses as table public.objection_clauses';
  end if;
  if to_regclass('forest_bill_backup_20260820.campaign_recipients') is null then
    execute 'create table forest_bill_backup_20260820.campaign_recipients as table public.campaign_recipients';
  end if;
  if to_regclass('forest_bill_backup_20260820.campaign_form_fields') is null then
    execute 'create table forest_bill_backup_20260820.campaign_form_fields as table public.campaign_form_fields';
  end if;
  if to_regclass('forest_bill_backup_20260820.submissions') is null then
    execute 'create table forest_bill_backup_20260820.submissions as table public.submissions';
  end if;
  if to_regclass('forest_bill_backup_20260820.submission_clauses') is null then
    execute 'create table forest_bill_backup_20260820.submission_clauses as table public.submission_clauses';
  end if;
end $$;

-- Explicit child cleanup for Forest Bill / leftover campaigns, then the parent row.
-- FKs already cascade; this keeps the order obvious and avoids a constraint surprise.
delete from public.submission_clauses
where submission_id in (
  select s.id
  from public.submissions s
  join public.campaigns c on c.id = s.campaign_id
  where c.slug is distinct from 'esa-draft-notification'
);

delete from public.submissions
where campaign_id in (
  select id from public.campaigns where slug is distinct from 'esa-draft-notification'
);

delete from public.campaign_recipients
where campaign_id in (
  select id from public.campaigns where slug is distinct from 'esa-draft-notification'
);

delete from public.campaign_form_fields
where campaign_id in (
  select id from public.campaigns where slug is distinct from 'esa-draft-notification'
);

delete from public.objection_clauses
where campaign_id in (
  select id from public.campaigns where slug is distinct from 'esa-draft-notification'
);

delete from public.campaigns
where slug is distinct from 'esa-draft-notification';

-- Remaining demo/test rows on ESA, if any.
delete from public.submissions
where campaign_id in (select id from public.campaigns where slug = 'esa-draft-notification')
  and (
    is_test is true
    or lower(coalesce(email, '')) in ('demo@example.com')
    or full_name ilike 'Demo farmer%'
    or full_name ilike 'മാതൃകാ%'
    or coalesce(panchayat, '') ilike 'Example panchayat%'
    or coalesce(panchayat, '') ilike 'മാതൃകാ പഞ്ചായത്ത്%'
    or coalesce(address_line, '') ilike 'Example house%'
    or coalesce(phone_e164, '') like '%9876543210%'
  );

do $$
declare
  v_id uuid;
  v_ml_intro text := $ml$കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് കേന്ദ്ര സർക്കാർ പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക ഉയർന്നിട്ടുണ്ട്.

പശ്ചിമഘട്ടത്തിലെ 56,825.7 ചതുരശ്ര കിലോമീറ്റർ പ്രദേശം പരിസ്ഥിതിലോല മേഖലയായി നിർദേശിക്കുന്ന കരട് വിജ്ഞാപനത്തിൽ കേരളത്തിലെ 131 ഗ്രാമങ്ങളിലായി 9,993.7 ചതുരശ്ര കിലോമീറ്റർ പ്രദേശമാണ് ഉൾപ്പെടുത്തിയിരിക്കുന്നത്.

സമർപ്പിച്ച രേഖകളിലോ അതിർത്തിനിർണയത്തിലോ ഉണ്ടായിട്ടുള്ള തെറ്റുകൾ പരിശോധിച്ച് ആവശ്യമായ തിരുത്തലുകൾ വരുത്തുന്നതിനുള്ള നടപടികൾ സർക്കാർ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തുന്നതിന് പകരം യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ ശാസ്ത്രീയമായും കൃത്യമായും നിർണയിക്കണമെന്നതാണ് പ്രധാന ആവശ്യം.

കരട് വിജ്ഞാപനത്തിലെ അപാകതകളെക്കുറിച്ചുള്ള പരാതികളും അഭിപ്രായങ്ങളും അനുവദിച്ചിരിക്കുന്ന സമയപരിധിക്കുള്ളിൽ സമർപ്പിക്കേണ്ടതാണ്.

താഴെ നൽകിയിരിക്കുന്ന വിഷയങ്ങളിൽ നിങ്ങളുടെ ആശങ്കയുമായി ബന്ധപ്പെട്ട ഒരു വിഷയം തിരഞ്ഞെടുക്കുകയും ബന്ധപ്പെട്ട അധികാരികൾക്ക് ഇമെയിൽ മുഖേന നിങ്ങളുടെ അഭിപ്രായം അറിയിക്കുകയും ചെയ്യുക.$ml$;
  v_en_intro text := $en$Concerns have been raised regarding the boundary demarcation and maps contained in the draft notification relating to Ecologically Sensitive Areas (ESA), issued by the Central Government based on the recommendations associated with the Kasturirangan Report.

The draft proposes approximately 56,825.7 sq. km. of the Western Ghats as Ecologically Sensitive Area, including approximately 9,993.7 sq. km. across 131 villages in Kerala.

The Government is requested to review the submitted records, boundaries, and maps and take the necessary steps to rectify any inaccuracies.

Instead of automatically treating an entire revenue village as an ESA, the actual ecologically sensitive areas should be identified accurately through appropriate scientific and administrative assessment.

Citizens may submit their objections, concerns, and representations within the applicable period prescribed for public feedback.

Select the concern below that best represents your issue and send your representation to the relevant authorities.$en$;
  v_body_ml text := $mlt${{intro}}

{{concerns}}

{{closing}}

പേര്: {{full_name}}
പിൻകോഡ്: {{pincode}}
ജില്ല: {{district}}
പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി: {{panchayat}}
വില്ലേജ്: {{village}}
വിലാസം: {{address}}

ആദരപൂർവ്വം,
{{full_name}}$mlt$;
  v_body_en text := $ent${{intro}}

{{concerns}}

{{closing}}

Name: {{full_name}}
PIN: {{pincode}}
District: {{district}}
Panchayat / Municipality: {{panchayat}}
Village: {{village}}
Address: {{address}}

Regards,
{{full_name}}$ent$;
begin
  select id into v_id from public.campaigns where slug = 'esa-draft-notification';

  if v_id is null then
    insert into public.campaigns (
      slug,
      title_ml,
      title_en,
      summary_ml,
      summary_en,
      homepage_intro_ml,
      homepage_intro_en,
      recipient_email,
      recipient_emails,
      cc_emails,
      bcc_emails,
      subject_ml,
      subject_en,
      intro_ml,
      intro_en,
      closing_ml,
      closing_en,
      body_template_ml,
      body_template_en,
      source_url,
      reference_url,
      opens_at,
      deadline_at,
      status,
      is_active,
      publish_status,
      allow_multiple_concerns,
      concern_selection_mode,
      max_concern_selections,
      allow_custom_concern,
      og_title_ml,
      og_title_en,
      og_description_ml,
      og_description_en,
      explainer_ml,
      explainer_en
    ) values (
      'esa-draft-notification',
      'പരിസ്ഥിതിലോല പ്രദേശം (ESA) — കരട് വിജ്ഞാപനം',
      'Ecologically Sensitive Area (ESA) — Draft Notification',
      'കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് കേന്ദ്ര സർക്കാർ പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക ഉയർന്നിട്ടുണ്ട്.',
      'Concerns have been raised regarding the boundary demarcation and maps contained in the draft notification relating to Ecologically Sensitive Areas (ESA), issued by the Central Government based on the recommendations associated with the Kasturirangan Report.',
      v_ml_intro,
      v_en_intro,
      'min.for@kerala.gov.in',
      array['min.for@kerala.gov.in']::text[],
      array[
        'min.for@kerala.gov.in',
        'prlsecy.forest@kerala.gov.in',
        'pccf.for@kerala.gov.in',
        'www.for@kerala.gov.in',
        'pccf-d.for@kerala.gov.in',
        'pccf-flr.for@kerala.gov.in'
      ]::text[],
      array['esacomplaints2026@gmail.com']::text[],
      'പരിസ്ഥിതിലോല പ്രദേശം (ESA) കരട് വിജ്ഞാപനവുമായി ബന്ധപ്പെട്ട നിവേദനം',
      'Representation regarding Ecologically Sensitive Area (ESA) Draft Notification',
      'കരട് ഇ.എസ്.എ. വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തെയും ഭൂപടങ്ങളെയും കുറിച്ച് ഞാൻ താഴെപ്പറയുന്ന ആശങ്ക രേഖപ്പെടുത്തുന്നു.',
      'I submit the following representation regarding the draft Ecologically Sensitive Area (ESA) notification.',
      'ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.',
      'Necessary steps are requested to be taken in this regard.',
      v_body_ml,
      v_body_en,
      'https://moef.gov.in/',
      null,
      timestamptz '2026-07-27 00:00:00+05:30',
      timestamptz '2026-09-25 18:29:59+05:30',
      'active',
      true,
      'live',
      false,
      'single',
      null,
      true,
      'പരിസ്ഥിതിലോല പ്രദേശം (ESA) — കരട് വിജ്ഞാപനം',
      'Ecologically Sensitive Area (ESA) — Draft Notification',
      'കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക.',
      'Concerns about boundary demarcation and maps in the ESA draft notification.',
      '{}'::text[],
      '{}'::text[]
    )
    returning id into v_id;
  else
    update public.campaigns
    set
      title_ml = 'പരിസ്ഥിതിലോല പ്രദേശം (ESA) — കരട് വിജ്ഞാപനം',
      title_en = 'Ecologically Sensitive Area (ESA) — Draft Notification',
      summary_ml = 'കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് കേന്ദ്ര സർക്കാർ പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക ഉയർന്നിട്ടുണ്ട്.',
      summary_en = 'Concerns have been raised regarding the boundary demarcation and maps contained in the draft notification relating to Ecologically Sensitive Areas (ESA), issued by the Central Government based on the recommendations associated with the Kasturirangan Report.',
      homepage_intro_ml = v_ml_intro,
      homepage_intro_en = v_en_intro,
      recipient_email = 'min.for@kerala.gov.in',
      recipient_emails = array['min.for@kerala.gov.in']::text[],
      cc_emails = array[
        'min.for@kerala.gov.in',
        'prlsecy.forest@kerala.gov.in',
        'pccf.for@kerala.gov.in',
        'www.for@kerala.gov.in',
        'pccf-d.for@kerala.gov.in',
        'pccf-flr.for@kerala.gov.in'
      ]::text[],
      bcc_emails = array['esacomplaints2026@gmail.com']::text[],
      subject_ml = 'പരിസ്ഥിതിലോല പ്രദേശം (ESA) കരട് വിജ്ഞാപനവുമായി ബന്ധപ്പെട്ട നിവേദനം',
      subject_en = 'Representation regarding Ecologically Sensitive Area (ESA) Draft Notification',
      intro_ml = 'കരട് ഇ.എസ്.എ. വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തെയും ഭൂപടങ്ങളെയും കുറിച്ച് ഞാൻ താഴെപ്പറയുന്ന ആശങ്ക രേഖപ്പെടുത്തുന്നു.',
      intro_en = 'I submit the following representation regarding the draft Ecologically Sensitive Area (ESA) notification.',
      closing_ml = 'ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.',
      closing_en = 'Necessary steps are requested to be taken in this regard.',
      body_template_ml = v_body_ml,
      body_template_en = v_body_en,
      source_url = coalesce(nullif(source_url, ''), 'https://moef.gov.in/'),
      status = 'active',
      is_active = true,
      publish_status = 'live',
      allow_multiple_concerns = false,
      concern_selection_mode = 'single',
      max_concern_selections = null,
      allow_custom_concern = true,
      og_title_ml = 'പരിസ്ഥിതിലോല പ്രദേശം (ESA) — കരട് വിജ്ഞാപനം',
      og_title_en = 'Ecologically Sensitive Area (ESA) — Draft Notification',
      og_description_ml = 'കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക.',
      og_description_en = 'Concerns about boundary demarcation and maps in the ESA draft notification.',
      explainer_ml = '{}'::text[],
      explainer_en = '{}'::text[],
      updated_at = now()
    where id = v_id;
  end if;

  delete from public.campaign_recipients where campaign_id = v_id;
  insert into public.campaign_recipients (campaign_id, recipient_type, email, display_order) values
    (v_id, 'to',  'min.for@kerala.gov.in', 1),
    (v_id, 'cc',  'min.for@kerala.gov.in', 1),
    (v_id, 'cc',  'prlsecy.forest@kerala.gov.in', 2),
    (v_id, 'cc',  'pccf.for@kerala.gov.in', 3),
    (v_id, 'cc',  'www.for@kerala.gov.in', 4),
    (v_id, 'cc',  'pccf-d.for@kerala.gov.in', 5),
    (v_id, 'cc',  'pccf-flr.for@kerala.gov.in', 6),
    (v_id, 'bcc', 'esacomplaints2026@gmail.com', 1);

  delete from public.campaign_form_fields where campaign_id = v_id;
  insert into public.campaign_form_fields (campaign_id, field_key, label_en, label_ml, is_enabled, is_required, display_order) values
    (v_id, 'name',           'Full name',                'പൂർണ്ണ നാമം',                   true,  true,  1),
    (v_id, 'pincode',        'PIN code',                 'പിൻകോഡ്',                      true,  true,  2),
    (v_id, 'email',          'Email',                    'ഇമെയിൽ',                       false, false, 3),
    (v_id, 'phone',          'Mobile number',            'മൊബൈൽ നമ്പർ',                   false, false, 4),
    (v_id, 'address',        'Address',                  'വിലാസം',                        false, false, 5),
    (v_id, 'district',       'District',                 'ജില്ല',                         false, false, 6),
    (v_id, 'local_body',     'Panchayat / Municipality', 'പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി', false, false, 7),
    (v_id, 'village',        'Village',                  'വില്ലേജ്',                      false, false, 8),
    (v_id, 'custom_message', 'Additional concern',       'അധിക ആശങ്ക',                    true,  false, 9);

  delete from public.objection_clauses where campaign_id = v_id;
  insert into public.objection_clauses (
    campaign_id, code, section_ref, sort_order, is_active,
    title_en, title_ml, explain_en, explain_ml, full_text_en, full_text_ml,
    email_en, email_ml, email_subject_en, email_subject_ml, email_body_en, email_body_ml
  ) values
  (
    v_id, 'ESA_01_REVENUE_BOUNDARY', null, 1, true,
    'Do not designate ESA areas solely on the basis of revenue-village boundaries',
    'റവന്യൂ വില്ലേജിന്റെ അതിർത്തി മാത്രം അടിസ്ഥാനമാക്കി ഒരു പ്രദേശത്തെ മുഴുവനായും ഇ.എസ്.എ. ആയി പ്രഖ്യാപിക്കരുത്',
    'Identify ESA areas through accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village.',
    'യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണം.',
    $c1e$I request that Ecologically Sensitive Areas be identified based on accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village within the ESA boundary.

Necessary steps are requested to be taken in this regard.$c1e$,
    $c1m$യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണമെന്നും ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും സ്വമേധയാ ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തരുതെന്നും അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c1m$,
    $c1e$I request that Ecologically Sensitive Areas be identified based on accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village within the ESA boundary.

Necessary steps are requested to be taken in this regard.$c1e$,
    $c1m$യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണമെന്നും ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും സ്വമേധയാ ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തരുതെന്നും അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c1m$,
    '',
    '',
    $c1e$I request that Ecologically Sensitive Areas be identified based on accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village within the ESA boundary.

Necessary steps are requested to be taken in this regard.$c1e$,
    $c1m$യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണമെന്നും ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും സ്വമേധയാ ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തരുതെന്നും അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c1m$
  ),
  (
    v_id, 'ESA_02_HOME_FARM_LIVELIHOOD', null, 2, true,
    'Protect legally occupied homes, agricultural land, and livelihoods',
    'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ സംരക്ഷിക്കുക',
    'No administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, farms, or livelihoods.',
    'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ അനാവശ്യമായി നഷ്ടപ്പെടരുത്.',
    $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
    $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$,
    $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
    $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$,
    '',
    '',
    $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
    $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$
  ),
  (
    v_id, 'ESA_03_INHABITED_AREAS', null, 3, true,
    'Exclude residential and inhabited areas from the ESA boundary',
    'ജനവാസ കേന്ദ്രങ്ങളെ ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കുക',
    'Residential and inhabited areas should be excluded from the ESA boundary before the final notification is issued.',
    'ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കണം.',
    $c3e$I request that residential and inhabited areas be excluded from the ESA boundary and that the final notification be issued only after accurately identifying the areas that genuinely require ecological protection.

Necessary steps are requested to be taken in this regard.$c3e$,
    $c3m$ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കി, യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങളെ കൃത്യമായി നിർണയിച്ച ശേഷം അന്തിമ വിജ്ഞാപനം പ്രസിദ്ധീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c3m$,
    $c3e$I request that residential and inhabited areas be excluded from the ESA boundary and that the final notification be issued only after accurately identifying the areas that genuinely require ecological protection.

Necessary steps are requested to be taken in this regard.$c3e$,
    $c3m$ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കി, യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങളെ കൃത്യമായി നിർണയിച്ച ശേഷം അന്തിമ വിജ്ഞാപനം പ്രസിദ്ധീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c3m$,
    '',
    '',
    $c3e$I request that residential and inhabited areas be excluded from the ESA boundary and that the final notification be issued only after accurately identifying the areas that genuinely require ecological protection.

Necessary steps are requested to be taken in this regard.$c3e$,
    $c3m$ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കി, യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങളെ കൃത്യമായി നിർണയിച്ച ശേഷം അന്തിമ വിജ്ഞാപനം പ്രസിദ്ധീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c3m$
  ),
  (
    v_id, 'ESA_04_PROPERTY_LIVELIHOOD', null, 4, true,
    'Prevent actions that could unnecessarily affect legally held homes, farms, and livelihoods',
    'വീടുകളും കൃഷിയിടങ്ങളും വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന സാഹചര്യം ഒഴിവാക്കുക',
    'Safeguards are needed so that ESA-related actions do not unnecessarily affect legally held homes, farms, and livelihoods.',
    'നിയമാനുസൃതമായ വീടുകളും കൃഷിയിടങ്ങളും വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന നടപടികൾ ഒഴിവാക്കണം.',
    $c4e$I have been residing on my property for years with the relevant documents and have regularly paid the applicable land tax.

I request that appropriate safeguards be implemented so that actions arising from the ESA process do not unnecessarily affect my legally held home, agricultural land, farming activities, or legitimate sources of income.$c4e$,
    $c4m$മതിയായ രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുന്ന എന്റെ വീടും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന രീതിയിലുള്ള നടപടികൾ ഒഴിവാക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c4m$,
    $c4e$I have been residing on my property for years with the relevant documents and have regularly paid the applicable land tax.

I request that appropriate safeguards be implemented so that actions arising from the ESA process do not unnecessarily affect my legally held home, agricultural land, farming activities, or legitimate sources of income.$c4e$,
    $c4m$മതിയായ രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുന്ന എന്റെ വീടും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന രീതിയിലുള്ള നടപടികൾ ഒഴിവാക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c4m$,
    '',
    '',
    $c4e$I have been residing on my property for years with the relevant documents and have regularly paid the applicable land tax.

I request that appropriate safeguards be implemented so that actions arising from the ESA process do not unnecessarily affect my legally held home, agricultural land, farming activities, or legitimate sources of income.$c4e$,
    $c4m$മതിയായ രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുന്ന എന്റെ വീടും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന രീതിയിലുള്ള നടപടികൾ ഒഴിവാക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c4m$
  );
end $$;

-- Leftover Forest Bill clause codes must not remain on any live campaign row.
delete from public.objection_clauses
where code in (
  'C1_OFFICER','C1_NOTICE','C2_RIVER','C2_LAND','C3_SEARCH','C3_ARREST',
  'C4_VEHICLE','C4_PANCHAYAT','C5_ARREST','C5_TRIBAL','C6_OBSTRUCT','C6_APPEAL',
  'C7_LOCKUP','C7_COMPENSATION','C8_BNSS','C9_PRESUME','C10_CERTIFY','C11_PENALTY',
  'C12_WILDLIFE','ESA1','ESA2','ESA3','ESA4'
);

do $$
declare
  v_campaigns int;
  v_live int;
  v_forest int;
  v_concerns int;
  v_forest_concerns int;
begin
  select count(*) into v_campaigns from public.campaigns;
  select count(*) into v_live
    from public.campaigns
    where status = 'active' and publish_status = 'live' and slug = 'esa-draft-notification';
  select count(*) into v_forest
    from public.campaigns
    where slug in ('kerala-forest-amendment-2024', 'demo')
       or title_en ilike '%Kerala Forest%'
       or title_en ilike '%Forest (Amendment)%'
       or title_en ilike '%Forest Amendment%'
       or title_ml ilike '%ഫോറസ്റ്റ് (ഭേദഗതി)%';
  select count(*) into v_concerns
    from public.objection_clauses oc
    join public.campaigns c on c.id = oc.campaign_id
    where c.slug = 'esa-draft-notification';
  select count(*) into v_forest_concerns
    from public.objection_clauses
    where code in (
      'C1_OFFICER','C1_NOTICE','C2_RIVER','C2_LAND','C3_SEARCH','C3_ARREST',
      'C4_VEHICLE','C4_PANCHAYAT','C5_ARREST','C5_TRIBAL','C6_OBSTRUCT','C6_APPEAL',
      'C7_LOCKUP','C7_COMPENSATION','C8_BNSS'
    );

  if v_campaigns <> 1 then
    raise exception 'ESA cleanup expected 1 campaign, found %', v_campaigns;
  end if;
  if v_live <> 1 then
    raise exception 'ESA cleanup expected 1 live ESA campaign, found %', v_live;
  end if;
  if v_forest <> 0 then
    raise exception 'ESA cleanup found leftover Forest Bill campaign rows';
  end if;
  if v_concerns <> 4 then
    raise exception 'ESA cleanup expected 4 ESA concerns, found %', v_concerns;
  end if;
  if v_forest_concerns <> 0 then
    raise exception 'ESA cleanup found leftover Forest Bill concern codes';
  end if;
end $$;

commit;
