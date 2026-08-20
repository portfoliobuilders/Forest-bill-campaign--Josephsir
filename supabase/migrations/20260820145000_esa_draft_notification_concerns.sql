-- Restore the four ESA draft-notification concerns shown in Admin → Campaigns → 4. Concerns.
-- Previous seeds were removed from production in admin; this upsert puts the approved
-- English/Malayalam titles and letter text back on slug `esa-draft-notification`.

do $$
declare
  v_id uuid;
begin
  select id into v_id from public.campaigns where slug = 'esa-draft-notification';
  if v_id is null then
    raise exception 'ESA campaign esa-draft-notification is missing';
  end if;

  delete from public.objection_clauses oc
  where oc.campaign_id = v_id
    and oc.code not in ('ESA1', 'ESA2', 'ESA3', 'ESA4')
    and not exists (
      select 1 from public.submission_clauses sc where sc.clause_id = oc.id
    );

  update public.objection_clauses
  set is_active = false
  where campaign_id = v_id
    and code not in ('ESA1', 'ESA2', 'ESA3', 'ESA4');

  insert into public.objection_clauses (
    campaign_id, code, section_ref, sort_order, is_active,
    title_en, title_ml, explain_en, explain_ml, full_text_en, full_text_ml,
    email_en, email_ml, email_subject_en, email_subject_ml, email_body_en, email_body_ml
  ) values
  (
    v_id, 'ESA1', null, 1, true,
    'Do not designate ESA areas solely on the basis of revenue-village boundaries.',
    'റവന്യൂ വില്ലേജിന്റെ അതിർത്തി മാത്രം അടിസ്ഥാനമാക്കി ഒരു പ്രദേശത്തെ മുഴുവനായും ഇ.എസ്.എ. ആയി പ്രഖ്യാപിക്കരുത്.',
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
    'Do not designate ESA areas solely on the basis of revenue-village boundaries.',
    'റവന്യൂ വില്ലേജിന്റെ അതിർത്തി മാത്രം അടിസ്ഥാനമാക്കി ഒരു പ്രദേശത്തെ മുഴുവനായും ഇ.എസ്.എ. ആയി പ്രഖ്യാപിക്കരുത്.',
    $c1e$I request that Ecologically Sensitive Areas be identified based on accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village within the ESA boundary.

Necessary steps are requested to be taken in this regard.$c1e$,
    $c1m$യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണമെന്നും ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും സ്വമേധയാ ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തരുതെന്നും അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c1m$
  ),
  (
    v_id, 'ESA2', null, 2, true,
    'Protect legally occupied homes, agricultural land, and livelihoods.',
    'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ സംരക്ഷിക്കുക.',
    'No administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, farms, or livelihoods.',
    'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ അനാവശ്യമായി നഷ്ടപ്പെടരുത്.',
    $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
    $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ ഞാൻ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$,
    $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
    $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ ഞാൻ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$,
    'Protect legally occupied homes, agricultural land, and livelihoods.',
    'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ സംരക്ഷിക്കുക.',
    $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
    $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ ഞാൻ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$
  ),
  (
    v_id, 'ESA3', null, 3, true,
    'Exclude residential and inhabited areas from the ESA boundary.',
    'ജനവാസ കേന്ദ്രങ്ങളെ ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കുക.',
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
    'Exclude residential and inhabited areas from the ESA boundary.',
    'ജനവാസ കേന്ദ്രങ്ങളെ ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കുക.',
    $c3e$I request that residential and inhabited areas be excluded from the ESA boundary and that the final notification be issued only after accurately identifying the areas that genuinely require ecological protection.

Necessary steps are requested to be taken in this regard.$c3e$,
    $c3m$ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കി, യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങളെ കൃത്യമായി നിർണയിച്ച ശേഷം അന്തിമ വിജ്ഞാപനം പ്രസിദ്ധീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c3m$
  ),
  (
    v_id, 'ESA4', null, 4, true,
    'Prevent actions that could unnecessarily affect legally held homes, farms, and livelihoods.',
    'വീടുകളും കൃഷിയിടങ്ങളും വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന സാഹചര്യം ഒഴിവാക്കുക.',
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
    'Prevent actions that could unnecessarily affect legally held homes, farms, and livelihoods.',
    'വീടുകളും കൃഷിയിടങ്ങളും വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന സാഹചര്യം ഒഴിവാക്കുക.',
    $c4e$I have been residing on my property for years with the relevant documents and have regularly paid the applicable land tax.

I request that appropriate safeguards be implemented so that actions arising from the ESA process do not unnecessarily affect my legally held home, agricultural land, farming activities, or legitimate sources of income.$c4e$,
    $c4m$മതിയായ രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുന്ന എന്റെ വീടും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന രീതിയിലുള്ള നടപടികൾ ഒഴിവാക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c4m$
  )
  on conflict (campaign_id, code) do update set
    section_ref = excluded.section_ref,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    title_en = excluded.title_en,
    title_ml = excluded.title_ml,
    explain_en = excluded.explain_en,
    explain_ml = excluded.explain_ml,
    full_text_en = excluded.full_text_en,
    full_text_ml = excluded.full_text_ml,
    email_en = excluded.email_en,
    email_ml = excluded.email_ml,
    email_subject_en = excluded.email_subject_en,
    email_subject_ml = excluded.email_subject_ml,
    email_body_en = excluded.email_body_en,
    email_body_ml = excluded.email_body_ml,
    updated_at = now();
end $$;
