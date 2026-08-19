-- Kerala Forest (Amendment) Bill 2024.
-- Stays inactive: public comments closed 31 Dec 2024; Cabinet dropped the Bill in Jan 2025.
-- Primary source: Kerala Gazette Extraordinary No. 3488, 1 Nov 2024 (Bill No. 228).
insert into campaigns (
  slug,
  title_ml,
  title_en,
  summary_ml,
  summary_en,
  recipient_email,
  cc_emails,
  subject_ml,
  subject_en,
  intro_ml,
  intro_en,
  closing_ml,
  closing_en,
  source_url,
  opens_at,
  deadline_at,
  is_active
) values (
  'kerala-forest-amendment-2024',
  'കേരള ഫോറസ്റ്റ് (ഭേദഗതി) ബിൽ 2024',
  'Kerala Forest (Amendment) Bill, 2024',
  '2024 നവംബർ 1-ലെ ഗസറ്റ് ബിൽ 228. പൊതുജന അഭിപ്രായത്തിന് 2024 ഡിസംബർ 31 വരെ സമയമുണ്ടായിരുന്നു. ആ കൂടിയാലോചന അവസാനിച്ചു; കാബിനറ്റ് ബിൽ പിൻവലിച്ചു. പുതിയ ഔദ്യോഗിക കൂടിയാലോചന വരുന്നതുവരെ ഇത് സജീവമല്ല.',
  'Gazette Bill 228 of 1 November 2024. Public comments closed on 31 December 2024. The Cabinet later dropped the Bill. This campaign stays inactive until a new official consultation is verified.',
  'prlsecy.forest@kerala.gov.in',
  array['emailkifa@gmail.com'],
  'കേരള ഫോറസ്റ്റ് (ഭേദഗതി) ബിൽ 2024 — എന്റെ എതിർപ്പ്',
  'Objection to the Kerala Forest (Amendment) Bill, 2024',
  'ബഹുമാനപ്പെട്ട പ്രിൻസിപ്പൽ സെക്രട്ടറി, കേരള ഫോറസ്റ്റ് (ഭേദഗതി) ബിൽ 2024-നോട് ഞാൻ താഴെപ്പറയുന്ന ആശങ്കകളിൽ എതിർപ്പ് രേഖപ്പെടുത്തുന്നു.',
  'Respected Principal Secretary, I record my objection to the Kerala Forest (Amendment) Bill, 2024, on the points below.',
  'ദയവായി ഈ ആശങ്കകൾ പരിഗണിച്ച് ബിൽ പിൻവലിക്കുക. നന്ദി.',
  'Please consider these concerns and withdraw the Bill. Thank you.',
  'https://prsindia.org/files/bills_acts/bills_states/kerala/2024/Bills228of2024KL.pdf',
  timestamptz '2024-11-01 00:00:00+05:30',
  timestamptz '2024-12-31 23:59:59+05:30',
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
      'C1_OFFICER',
      'Section 2',
      'ഫോറസ്റ്റ് ഓഫീസർ നിർവചനം',
      'Forest Officer definition',
      'സെക്ഷൻ 2-ൽ വാച്ചർ, ട്രൈബൽ വാച്ചർ എന്നിവരെയും ഫോറസ്റ്റ് ഓഫീസറായി കണക്കാക്കുന്നു. അവരിൽ പലരും PSC വഴിയല്ല. വന നിയമത്തിലെ അധികാരങ്ങൾ അവർക്ക് കിട്ടും.',
      'Section 2 would treat Watchers and Tribal Watchers as Forest Officers. Many are not PSC recruits. Forest Act powers would then sit with them.',
      'വാച്ചർ, ട്രൈബൽ വാച്ചർ എന്നിവരെ ഫോറസ്റ്റ് ഓഫീസർ നിർവചനത്തിൽ നിന്ന് ഒഴിവാക്കുക. PSC വഴി സ്ഥിര നിയമനവും പരിശീലനവും നേടിയവർക്ക് മാത്രമേ ആ പദവി നൽകാവൂ.',
      'Remove Watchers and Tribal Watchers from the Forest Officer definition. Only trained, regularly appointed PSC staff should hold that status.',
      1
    ),
    (
      'C2_RIVER',
      'River definition',
      'പുഴയുടെ നിർവചനം',
      'Definition of river',
      'വനത്തിലേക്ക് ഒഴുകിയെത്തുന്ന പുഴകളും വനപുഴയായി കാണുന്നു. കേരളത്തിൽ പുഴകൾ ജനവാസ കേന്ദ്രങ്ങളിലൂടെയും ഒഴുകുന്നു. ഇത് വനം വകുപ്പ് അധികാരം വീടുകളിലേക്ക് വ്യാപിപ്പിക്കും.',
      'Rivers that flow into forest would be treated as forest rivers. In Kerala many rivers pass through settlements. That would extend Forest Department power into homes.',
      'പുഴ എന്നത് പൂർണമായും വനത്തിലൂടെ ഒഴുകുന്ന ഭാഗത്തേക്ക് മാത്രം ചുരുക്കുക. വനാതിർത്തിയിലെ പുഴകളിൽ അധികാരം പഞ്ചായത്തിനായിരിക്കണം.',
      'Limit "river" to stretches that flow wholly through forest. Panchayats must keep authority over rivers along the forest boundary.',
      2
    ),
    (
      'C3_SEARCH',
      'Section 52',
      'വീട്ടിലേക്കുള്ള പരിശോധന',
      'House search powers',
      'ബീറ്റ് ഫോറസ്റ്റ് ഓഫീസർക്ക് വെറും സംശയത്തിൽ വീട്ടിൽ കയറി പരിശോധിക്കാനുള്ള അധികാരം നൽകുന്നു. വനത്തിന് പുറത്തുള്ള വീടുകളിൽ ഇത് ദുരുപയോഗത്തിന് വഴി തുറക്കും.',
      'Beat Forest Officers would be able to enter and search homes on mere suspicion. Outside the forest, that invites abuse.',
      'വനത്തിന് പുറത്തുള്ള വീട് പരിശോധിക്കാൻ വെറും സംശയം മതിയാകരുത്. DFO അല്ലെങ്കിൽ ACF റാങ്കിലുള്ള വാറന്റ് വേണം. പരിശോധന ഫോറസ്റ്റ് ഉദ്യോഗസ്ഥർക്ക് മാത്രം.',
      'Do not allow house searches outside the forest on mere suspicion. Require a warrant from DFO or ACF rank. Only Forest Officers should take part.',
      3
    ),
    (
      'C4_VEHICLE',
      'Section 52',
      'വാഹന പരിശോധന',
      'Vehicle checks',
      'വാഹനം തടഞ്ഞ് പരിശോധിക്കാൻ താഴെത്തട്ടിലുള്ള ഉദ്യോഗസ്ഥർക്ക് അനിയന്ത്രിത അധികാരം നൽകുന്നു.',
      'Junior staff would get unchecked power to stop and search vehicles.',
      'വാഹന പരിശോധന ഫോറസ്റ്റ് ഓഫീസറുടെയോ എസ്.ഐ. റാങ്കിൽ കുറയാത്ത പോലീസുകാരന്റെയോ സന്നിധ്യത്തിൽ മാത്രം നടത്തുക.',
      'Vehicle checks must take place only in the presence of a Forest Officer or a police officer of at least SI rank.',
      4
    ),
    (
      'C5_ARREST',
      'Section 63',
      'വാറന്റില്ലാത്ത അറസ്റ്റ്',
      'Arrest without warrant',
      'വനത്തിനുള്ളിൽ മാത്രമല്ല, എവിടെ വെച്ചും വാറന്റില്ലാതെ അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം ബീറ്റ് ഫോറസ്റ്റ് ഓഫീസർ മുതൽ നൽകുന്നു. ഫോറസ്റ്റ് ഉദ്യോഗസ്ഥർ രേഖപ്പെടുത്തുന്ന കുറ്റസമ്മതം കോടതിയിൽ തെളിവാകാം.',
      'Warrantless arrest would apply anywhere, not only inside the forest, from Beat Forest Officer rank up. Confessions recorded by forest staff can be used as evidence.',
      'വനത്തിന് പുറത്ത് വാറന്റില്ലാതെ അറസ്റ്റ് ചെയ്യരുത്. അങ്ങനെ അറസ്റ്റ് വേണമെങ്കിൽ DFO അല്ലെങ്കിൽ ACF റാങ്കിലുള്ള വാറന്റ് വേണം.',
      'Do not allow warrantless arrests outside the forest. Any such arrest must rest on a warrant from DFO or ACF rank.',
      5
    ),
    (
      'C6_OBSTRUCT',
      'Section 63(2)',
      'കൃത്യനിർവഹണം തടസ്സപ്പെടുത്തൽ',
      'Obstructing official duty',
      'ഔദ്യോഗിക കൃത്യം തടഞ്ഞു എന്ന് പറഞ്ഞ് ആരെയും അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം സെക്ഷൻ ഫോറസ്റ്റ് ഓഫീസർക്ക് നൽകുന്നു. ഇത് ഇപ്പോൾ പോലീസിന് മാത്രമുള്ള അധികാരമാണ്.',
      'Section Forest Officers would be able to arrest anyone for allegedly obstructing official work. That power currently belongs to the police.',
      'സെക്ഷൻ 63.2 റദ്ദാക്കുക. ഔദ്യോഗിക കൃത്യം തടഞ്ഞു എന്ന് പറഞ്ഞ് ആരെയും അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം ഫോറസ്റ്റ് ഉദ്യോഗസ്ഥർക്ക് നൽകരുത്. അത് പോലീസിന് മാത്രം.',
      'Drop section 63.2. Forest staff must not get police-style power to arrest anyone for allegedly obstructing official duty.',
      6
    ),
    (
      'C7_LOCKUP',
      'Section 63(3)',
      'ഫോറസ്റ്റ് സ്റ്റേഷൻ ഹാജർ',
      'Forest station custody',
      'അറസ്റ്റ് ചെയ്ത ആളെ പോലീസ് സ്റ്റേഷനോ ഫോറസ്റ്റ് സ്റ്റേഷനോ ആക്കാം എന്ന് പറയുന്നു. ഫോറസ്റ്റ് സ്റ്റേഷനിൽ ലോക്കപ്പ് മർദ്ദനത്തിന് വഴി തുറക്കും.',
      'Arrested people could be taken to a forest station instead of a police station. That opens the door to lock-up abuse.',
      'അറസ്റ്റ് ചെയ്ത ആളെ ഫോറസ്റ്റ് സ്റ്റേഷനിലേക്ക് കൊണ്ടുപോകരുത്. ഉടൻ അടുത്ത പോലീസ് സ്റ്റേഷനിൽ ഹാജരാക്കണം എന്ന നിലവിലെ വ്യവസ്ഥ പുനഃസ്ഥാപിക്കുക.',
      'Do not take arrested people to a forest station. Restore the rule that they must be produced at the nearest police station at once.',
      7
    ),
    (
      'C8_BNSS',
      'Section 63(4)',
      'കേന്ദ്ര നിയമവുമായുള്ള വൈരുദ്ധ്യം',
      'Conflict with central law',
      'അറസ്റ്റ് BNS 2023 പ്രകാരമാകണമെന്ന് പറയുന്നു. എന്നാൽ കോഗ്നിസബിൾ അല്ലാത്ത കുറ്റത്തിനും വാറന്റില്ലാതെ അറസ്റ്റ് അനുവദിക്കുന്നു. അത് കേന്ദ്ര നിയമത്തിന് വിരുദ്ധമാണ്.',
      'Arrests are said to follow BNS 2023, yet warrantless arrest would cover non-cognizable forest offences too. That conflicts with central law.',
      'സെക്ഷൻ 63.4 കേന്ദ്ര നിയമമായ BNS 2023-ന് വിരുദ്ധമാണ്. കോഗ്നിസബിൾ അല്ലാത്ത കുറ്റത്തിന് വാറന്റില്ലാതെ അറസ്റ്റ് അനുവദിക്കരുത്.',
      'Section 63.4 conflicts with BNS 2023. Do not allow warrantless arrest for forest offences that are not cognizable.',
      8
    ),
    (
      'C9_PRESUME',
      'Section 69(2)',
      'നിരപരാധിത്വം മറിച്ചിടൽ',
      'Reverse burden of proof',
      'വനോൽപ്പന്നം കയ്യിലുണ്ട് എന്ന് പറഞ്ഞ് അറസ്റ്റ് ചെയ്താൽ, അത് നിയമവിരുദ്ധമാണെന്നും കുറ്റം ചെയ്തുവെന്നും കരുതാം. തെളിയിക്കേണ്ടത് പ്രതിയാണ്. നിരപരാധിത്വം എന്ന അടിസ്ഥാന നിയമം മറിച്ചിടുന്നു.',
      'If someone is arrested for possessing forest produce, they would be presumed guilty unless they prove otherwise. That reverses the basic rule of innocence.',
      'സെക്ഷൻ 69.2 പിൻവലിക്കുക. കുറ്റം തെളിയിക്കേണ്ടത് പ്രോസിക്യൂഷന്റെ ഉത്തരവാദിത്വമാണ്. വനോൽപ്പന്നം കയ്യിലുണ്ട് എന്ന് പറഞ്ഞ് പ്രതിയെ കുറ്റക്കാരനായി കരുതരുത്.',
      'Withdraw section 69.2. The prosecution must prove guilt. Possession of alleged forest produce must not be treated as proof of crime.',
      9
    ),
    (
      'C10_CERTIFY',
      'Section 72(2)',
      'വനോൽപ്പന്ന സർട്ടിഫിക്കറ്റ്',
      'Forest produce certificate',
      'റേഞ്ച് ഫോറസ്റ്റ് ഓഫീസർ ഒരു ഉൽപ്പന്നം വനോൽപ്പന്നമാണെന്ന് സർട്ടിഫൈ ചെയ്താൽ അത് കേസിൽ ആധികാരിക രേഖയാകും. സ്വന്തം പറമ്പിലെ മരമോ തേനോ പോലും കേസാകാം.',
      'A Range Forest Officer certificate that something is forest produce would be treated as conclusive. Even timber or honey from a homestead could become a case.',
      'സെക്ഷൻ 72.2 റദ്ദാക്കുക. ഒരു ഉൽപ്പന്നം വനോൽപ്പന്നമാണോ എന്ന് റേഞ്ച് ഓഫീസർ സർട്ടിഫിക്കറ്റ് കൊണ്ട് തീരുമാനിക്കരുത്. ശാസ്ത്രീയ അന്വേഷണം വേണം.',
      'Repeal section 72.2. Whether something is forest produce must be proved by scientific inquiry, not a Range Officer certificate.',
      10
    ),
    (
      'C11_PENALTY',
      'Section 65',
      'തെറ്റായ അറസ്റ്റിനുള്ള ശിക്ഷ',
      'Penalty for wrongful arrest',
      'ജനങ്ങൾക്കുള്ള പിഴ അഞ്ചും പത്തും ഇരട്ടിയാക്കുമ്പോൾ, തെറ്റായ അറസ്റ്റിനുള്ള ഉദ്യോഗസ്ഥ ശിക്ഷ 200 രൂപയിൽ തന്നെ നിൽക്കുന്നു. ആറുമാസം തടവും മാറ്റിയിട്ടില്ല.',
      'Fines on the public would rise five to ten times, while the penalty on officers for wrongful arrest stays at two hundred rupees and up to six months in jail.',
      'തെറ്റായ അറസ്റ്റിനുള്ള സെക്ഷൻ 65 ശിക്ഷ 200 രൂപയിൽ നിർത്തരുത്. അധികാര ദുർവിനിയോഗത്തിന് അഞ്ച് വർഷം വരെ തടവും കുറഞ്ഞത് ഒരു ലക്ഷം രൂപ പിഴയും വേണം.',
      'Do not leave the section 65 penalty for wrongful arrest at two hundred rupees. Raise it to up to five years in prison and a fine of at least one lakh rupees.',
      11
    ),
    (
      'C12_WILDLIFE',
      'Missing clauses',
      'വന്യമൃഗ ആക്രമണം',
      'Wildlife attacks',
      'വന്യമൃഗങ്ങൾ വനം വിട്ട് ജീവഹാനിയും കൃഷിനാശവും ഉണ്ടാക്കുന്നതിനെ ലഘൂകരിക്കാനുള്ള വകുപ്പുകൾ ബില്ലിൽ ഇല്ല. മനുഷ്യജീവന് മുൻഗണന നൽകുന്ന വ്യവസ്ഥ വേണം.',
      'The Bill has no clauses to reduce wildlife attacks on people, livestock, or crops. The amendment should put human life first.',
      'വന്യമൃഗ ആക്രമണം തടയാനുള്ള വകുപ്പുകൾ ബില്ലിൽ ഇല്ല. മനുഷ്യജീവനും കൃഷിക്കും മുൻഗണന നൽകുന്ന വ്യവസ്ഥകൾ കൂട്ടിച്ചേർക്കുക. ഈ രൂപത്തിൽ ബിൽ പിൻവലിക്കുക.',
      'The Bill has no clauses to reduce wildlife attacks. Add provisions that put human life and farms first, or withdraw the Bill in this form.',
      12
    )
) as v(
  code, section_ref, title_ml, title_en,
  explain_ml, explain_en, email_ml, email_en, sort_order
)
where c.slug = 'kerala-forest-amendment-2024';

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
