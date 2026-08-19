-- Demo campaign: inactive until a live consultation is verified from a primary source.
insert into campaigns (
  slug,
  title_ml,
  title_en,
  summary_ml,
  summary_en,
  recipient_email,
  subject_ml,
  subject_en,
  intro_ml,
  intro_en,
  closing_ml,
  closing_en,
  source_url,
  deadline_at,
  is_active
) values (
  'demo',
  'ജനശബ്ദം — മാതൃകാ കാമ്പെയ്ൻ',
  'Janashabdam — Demo Campaign',
  'ഇത് ഒരു മാതൃകയാണ്. തത്സമയ കൺസൾട്ടേഷൻ സ്ഥിരീകരിക്കുന്നതുവരെ സജീവമാക്കില്ല.',
  'This is a placeholder campaign. It stays inactive until a live consultation is verified.',
  'consultation@example.gov.in',
  'നിയമ കൂടിയാലോചനയോടുള്ള എന്റെ എതിർപ്പ്',
  'My objection to the legislative consultation',
  'ബഹുമാനപ്പെട്ട സെക്രട്ടറി, ഞാൻ താഴെപ്പറയുന്ന കാര്യങ്ങളിൽ എതിർപ്പ് രേഖപ്പെടുത്തുന്നു.',
  'Respected Secretary, I record my objection on the points below.',
  'ദയവായി എന്റെ അഭിപ്രായം പരിഗണിക്കുക. നന്ദി.',
  'Please consider my views. Thank you.',
  'https://example.gov.in/consultation/placeholder-primary-source',
  now() + interval '90 days',
  false
);

insert into objection_clauses (
  campaign_id, code, section_ref, title_ml, title_en,
  explain_ml, explain_en, email_ml, email_en, sort_order
)
select
  c.id,
  v.code,
  v.section_ref,
  v.title_ml,
  v.title_en,
  v.explain_ml,
  v.explain_en,
  v.email_ml,
  v.email_en,
  v.sort_order
from campaigns c
cross join (
  values
    (
      'C1_NOTICE',
      'Notice period',
      'അറിയിപ്പ് കാലാവധി',
      'Notice period',
      'ഹൈറേഞ്ചിലെ കർഷകർക്ക് വായിച്ച് മനസ്സിലാക്കാൻ മതിയായ സമയം വേണം. തിടുക്കത്തിലുള്ള കൂടിയാലോചന അർത്ഥമില്ല.',
      'Highland farmers need enough time to read and understand the proposal. A rushed consultation is not a real one.',
      'പൊതുജന അഭിപ്രായത്തിന് മതിയായ സമയം നൽകണം. ഹൈറേഞ്ചിലെ കർഷകർക്ക് വായിച്ച് മനസ്സിലാക്കാൻ കുറഞ്ഞത് അറുപത് ദിവസം വേണം.',
      'Give the public enough time to comment. Highland farmers need at least sixty days to read and understand this.',
      1
    ),
    (
      'C2_LAND',
      'Private land',
      'സ്വകാര്യ ഭൂമി',
      'Private land',
      'കൃഷിയിടവും വീടും സംരക്ഷിക്കപ്പെടണം. കർഷകന്റെ ഭൂമി വനമായി കണക്കാക്കി അവകാശം നഷ്ടപ്പെടുത്തരുത്.',
      'Farms and homes must stay protected. A farmer’s land should not be treated as forest in a way that strips rights.',
      'സ്വകാര്യ ഭൂമിയിലെ കൃഷിയും വീടും സംരക്ഷിക്കപ്പെടണം. കർഷകന്റെ ഭൂമി വനമായി കണക്കാക്കി അവകാശം നഷ്ടപ്പെടുത്തരുത്.',
      'Farms and homes on private land must be protected. Do not treat a farmer’s land as forest to take away rights.',
      2
    ),
    (
      'C3_ARREST',
      'Arrest powers',
      'അറസ്റ്റ് അധികാരം',
      'Arrest powers',
      'സാധാരണ താമസക്കാരെ അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം വ്യക്തമായ പരിധിയോടെ മാത്രമേ ഉണ്ടാകാവൂ.',
      'Power to arrest ordinary residents should exist only with clear, written limits.',
      'സാധാരണ താമസക്കാരെ അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം വ്യക്തമായ പരിധിയോടെ മാത്രമേ ഉണ്ടാകാവൂ. ദുരുപയോഗം തടയണം.',
      'Power to arrest ordinary residents must exist only with clear limits. Misuse must be prevented.',
      3
    ),
    (
      'C4_PANCHAYAT',
      'Local bodies',
      'പഞ്ചായത്ത് അഭിപ്രായം',
      'Panchayat voice',
      'തദ്ദേശ സ്ഥാപനങ്ങൾ കേൾക്കണം. പഞ്ചായത്ത് തീരുമാനം മറികടക്കരുത്.',
      'Local bodies must be heard. Panchayat decisions should not be overridden in silence.',
      'തദ്ദേശ സ്ഥാപനങ്ങളുടെ അഭിപ്രായം നിർബന്ധമായി കേൾക്കണം. പഞ്ചായത്ത് തലത്തിലുള്ള തീരുമാനം മറികടക്കരുത്.',
      'Local bodies must be heard as a requirement. Do not override panchayat-level decisions in silence.',
      4
    ),
    (
      'C5_TRIBAL',
      'Forest rights',
      'ആദിവാസി അവകാശം',
      'Adivasi rights',
      'വനാവകാശ നിയമവും പരമ്പരാഗത വാസസ്ഥലവും ദുർബലമാക്കരുത്.',
      'The Forest Rights Act and traditional habitation must not be weakened.',
      'ആദിവാസി അവകാശങ്ങളും വനാവകാശ നിയമവും ദുർബലമാക്കരുത്. പരമ്പരാഗത വാസസ്ഥലം സംരക്ഷിക്കണം.',
      'Adivasi rights and the Forest Rights Act must not be weakened. Traditional habitation must be protected.',
      5
    ),
    (
      'C6_APPEAL',
      'Appeals',
      'അപ്പീൽ വഴി',
      'Appeal path',
      'തീരുമാനത്തിനെതിരെ ലളിതമായ അപ്പീൽ വേണം. ദരിദ്രർക്ക് കോടതി ചെലവ് താങ്ങാനാവില്ല.',
      'There must be a simple appeal path. Poor families cannot bear court costs.',
      'തീരുമാനത്തിനെതിരെ ലളിതമായ അപ്പീൽ വഴി വേണം. ദരിദ്രർക്ക് കോടതി ചെലവ് താങ്ങാനാവില്ല.',
      'There must be a simple appeal path against decisions. Poor families cannot bear court costs.',
      6
    ),
    (
      'C7_COMPENSATION',
      'Compensation',
      'നഷ്ടപരിഹാരം',
      'Compensation',
      'നഷ്ടപരിഹാരം നീതിയുക്തവും മുൻകൂട്ടി നൽകേണ്ടതുമാണ്. വാക്ക് മാത്രം മതിയാകില്ല.',
      'Compensation must be fair and paid in advance. A verbal promise is not enough.',
      'നഷ്ടപരിഹാരം നീതിയുക്തവും മുൻകൂട്ടി നൽകേണ്ടതുമാണ്. വാക്ക് മാത്രം മതിയാകില്ല.',
      'Compensation must be fair and paid in advance. A verbal promise is not enough.',
      7
    ),
    (
      'C8_LANGUAGE',
      'Language',
      'മലയാളം അറിയിപ്പ്',
      'Malayalam notice',
      'എല്ലാ അറിയിപ്പുകളും മലയാളത്തിലും ഇംഗ്ലീഷിലും ലഭ്യമാകണം.',
      'Every notice must be available in Malayalam and English.',
      'എല്ലാ അറിയിപ്പുകളും മലയാളത്തിലും ഇംഗ്ലീഷിലും ലഭ്യമാകണം. ഇംഗ്ലീഷ് മാത്രമുള്ള രേഖ പൊതുജനങ്ങളെ ഒഴിവാക്കുന്നു.',
      'Every notice must be available in Malayalam and English. English-only documents exclude the public.',
      8
    )
) as v(
  code, section_ref, title_ml, title_en,
  explain_ml, explain_en, email_ml, email_en, sort_order
)
where c.slug = 'demo';

insert into constituencies (code, name_en, name_ml, district, level) values
  ('KL-TVM', 'Thiruvananthapuram', 'തിരുവനന്തപുരം', 'Thiruvananthapuram', 'mla'),
  ('KL-KLM', 'Kollam', 'കൊല്ലം', 'Kollam', 'mla'),
  ('KL-PTA', 'Pathanamthitta', 'പത്തനംതിട്ട', 'Pathanamthitta', 'mla'),
  ('KL-ALP', 'Alappuzha', 'ആലപ്പുഴ', 'Alappuzha', 'mla'),
  ('KL-KTM', 'Kottayam', 'കോട്ടയം', 'Kottayam', 'mla'),
  ('KL-IDK', 'Idukki', 'ഇടുക്കി', 'Idukki', 'mla'),
  ('KL-EKM', 'Ernakulam', 'എറണാകുളം', 'Ernakulam', 'mla'),
  ('KL-TSR', 'Thrissur', 'തൃശൂർ', 'Thrissur', 'mla'),
  ('KL-PKD', 'Palakkad', 'പാലക്കാട്', 'Palakkad', 'mla'),
  ('KL-MLP', 'Malappuram', 'മലപ്പുറം', 'Malappuram', 'mla'),
  ('KL-KKD', 'Kozhikode', 'കോഴിക്കോട്', 'Kozhikode', 'mla'),
  ('KL-WYD', 'Wayanad', 'വയനാട്', 'Wayanad', 'mla'),
  ('KL-KNR', 'Kannur', 'കണ്ണൂർ', 'Kannur', 'mla'),
  ('KL-KSD', 'Kasaragod', 'കാസർഗോഡ്', 'Kasaragod', 'mla');

-- Representative rows must be seeded ONLY from post-4-May-2026 official sources
-- (niyamasabha.org, ceo.kerala.gov.in). The 16th Kerala Assembly was seated
-- 21 May 2026. Every row needs a real source_url and verified_at.
-- Never invent names, emails, or party affiliations.
