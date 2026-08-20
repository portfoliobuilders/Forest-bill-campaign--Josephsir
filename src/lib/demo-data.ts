import type { DetailsFields } from '@/lib/details-schema'
import type { Lang } from '@/lib/i18n'
import type { Campaign, ObjectionClause } from '@/types/database'

export type DistrictOption = {
  value: string
  labelMl: string
  labelEn: string
}

export const KERALA_DISTRICTS: DistrictOption[] = [
  { value: 'Thiruvananthapuram', labelEn: 'Thiruvananthapuram', labelMl: 'തിരുവനന്തപുരം' },
  { value: 'Kollam', labelEn: 'Kollam', labelMl: 'കൊല്ലം' },
  { value: 'Pathanamthitta', labelEn: 'Pathanamthitta', labelMl: 'പത്തനംതിട്ട' },
  { value: 'Alappuzha', labelEn: 'Alappuzha', labelMl: 'ആലപ്പുഴ' },
  { value: 'Kottayam', labelEn: 'Kottayam', labelMl: 'കോട്ടയം' },
  { value: 'Idukki', labelEn: 'Idukki', labelMl: 'ഇടുക്കി' },
  { value: 'Ernakulam', labelEn: 'Ernakulam', labelMl: 'എറണാകുളം' },
  { value: 'Thrissur', labelEn: 'Thrissur', labelMl: 'തൃശൂർ' },
  { value: 'Palakkad', labelEn: 'Palakkad', labelMl: 'പാലക്കാട്' },
  { value: 'Malappuram', labelEn: 'Malappuram', labelMl: 'മലപ്പുറം' },
  { value: 'Kozhikode', labelEn: 'Kozhikode', labelMl: 'കോഴിക്കോട്' },
  { value: 'Wayanad', labelEn: 'Wayanad', labelMl: 'വയനാട്' },
  { value: 'Kannur', labelEn: 'Kannur', labelMl: 'കണ്ണൂർ' },
  { value: 'Kasaragod', labelEn: 'Kasaragod', labelMl: 'കാസർഗോഡ്' },
]

const FOREST_BILL_CAMPAIGN_ID = '00000000-0000-4000-8000-000000000001'

/** Kerala Gazette Extraordinary No. 3488, 1 November 2024 — Bill No. 228. */
export const FOREST_BILL_SOURCE_URL =
  'https://prsindia.org/files/bills_acts/bills_states/kerala/2024/Bills228of2024KL.pdf'

/** Volunteer letter page this model is based on. Not a primary source. */
export const FOREST_BILL_VOLUNTEER_URL = 'http://malayali.com/ForestBill2024/FAB.html'

export const demoCampaign: Campaign = {
  id: FOREST_BILL_CAMPAIGN_ID,
  slug: 'kerala-forest-amendment-2024',
  title_ml: 'കേരള ഫോറസ്റ്റ് (ഭേദഗതി) ബിൽ 2024',
  title_en: 'Kerala Forest (Amendment) Bill, 2024',
  summary_ml:
    '2024 നവംബർ 1-ലെ ഗസറ്റ് ബിൽ 228. പൊതുജന അഭിപ്രായത്തിന് 2024 ഡിസംബർ 31 വരെ സമയമുണ്ടായിരുന്നു. ആ കൂടിയാലോചന അവസാനിച്ചു; കാബിനറ്റ് ബിൽ പിൻവലിച്ചു. നിങ്ങളുടെ സ്വന്തം ഇമെയിലിൽ നിന്ന് ലിസ്റ്റ് ചെയ്ത ഓഫീസുകളിലേക്ക് എതിർപ്പ് അയയ്ക്കാം.',
  summary_en:
    'Gazette Bill 228 of 1 November 2024. Public comments closed on 31 December 2024. The Cabinet later dropped the Bill. You can still send a personal objection from your own email to the listed offices.',
  recipient_email: 'esz-mef@nic.in',
  recipient_emails: ['esz-mef@nic.in', 'prlsecy.forest@kerala.gov.in'],
  cc_emails: ['emailkifa@gmail.com'],
  bcc_emails: [],
  reply_to_email: null,
  subject_ml: 'No_to_Kerala_Forest(Amendment)_Bill_2024',
  subject_en: 'No_to_Kerala_Forest(Amendment)_Bill_2024',
  intro_ml:
    'കേരള ഫോറസ്റ്റ് നിയമ ഭേദഗതി 2024-നോട് ഞാൻ താഴെപ്പറയുന്ന ആശങ്കകളിൽ എതിർപ്പ് രേഖപ്പെടുത്തുന്നു.',
  intro_en:
    'I record my objection to the Kerala Forest (Amendment) Bill, 2024, on the points below.',
  homepage_intro_ml:
    '2024 നവംബർ 1-ലെ ഗസറ്റ് ബിൽ 228. പൊതുജന അഭിപ്രായത്തിന് 2024 ഡിസംബർ 31 വരെ സമയമുണ്ടായിരുന്നു. ആ കൂടിയാലോചന അവസാനിച്ചു; കാബിനറ്റ് ബിൽ പിൻവലിച്ചു. നിങ്ങളുടെ സ്വന്തം ഇമെയിലിൽ നിന്ന് ലിസ്റ്റ് ചെയ്ത ഓഫീസുകളിലേക്ക് എതിർപ്പ് അയയ്ക്കാം.',
  homepage_intro_en:
    'Gazette Bill 228 of 1 November 2024. Public comments closed on 31 December 2024. The Cabinet later dropped the Bill. You can still send a personal objection from your own email to the listed offices.',
  source_url: FOREST_BILL_SOURCE_URL,
  reference_url: FOREST_BILL_VOLUNTEER_URL,
  closing_ml: 'ദയവായി ഈ ആശങ്കകൾ പരിഗണിച്ച് ബിൽ പിൻവലിക്കുക. നന്ദി.',
  closing_en: 'Please consider these concerns and withdraw the Bill. Thank you.',
  body_template_ml: `Sir,

{{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

ആദരപൂർവ്വം,

പേര്: {{full_name}}
വിലാസം: {{address}}
പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി: {{panchayat}}
ജില്ല: {{district}}
പിൻകോഡ്: {{pincode}}
ഫോൺ: {{phone}}
ഇമെയിൽ: {{email}}`,
  body_template_en: `Sir,

{{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

Regards,

Name: {{full_name}}
Address: {{address}}
Panchayat / Municipality: {{panchayat}}
District: {{district}}
PIN: {{pincode}}
Phone: {{phone}}
Email: {{email}}`,
  opens_at: '2024-11-01T00:00:00+05:30',
  deadline_at: '2024-12-31T23:59:59+05:30',
  is_active: true,
  status: 'active',
  publish_status: 'live',
  allow_multiple_concerns: true,
  og_title_en: '',
  og_title_ml: '',
  og_description_en: '',
  og_description_ml: '',
  social_image_url: null,
  explainer_ml: [
    'വാച്ചർമാരെ ഫോറസ്റ്റ് ഓഫീസറാക്കി നിയമാധികാരം നൽകും.',
    'വീടിനടുത്തുള്ള പുഴകളെ വനപുഴയായി കാണാം.',
    'സംശയം മാത്രം മതി, വനത്തിന് പുറത്ത് വീട് പരിശോധിക്കാം.',
    'താഴെത്തട്ടിലുള്ള ഉദ്യോഗസ്ഥർക്ക് വാഹനം തടയാനുള്ള അധികാരം കൂടും.',
    'വാറന്റില്ലാതെ അറസ്റ്റ് വനത്തിന് പുറത്തും നടക്കാം.',
    'അറസ്റ്റ് ചെയ്ത ആളെ ഫോറസ്റ്റ് സ്റ്റേഷനിൽ നിർത്താം.',
  ],
  explainer_en: [
    'Watchers would be treated as Forest Officers with legal powers.',
    'Rivers near homes could be labelled forest rivers.',
    'Homes outside the forest could be searched on mere suspicion.',
    'Junior staff would get wider power to stop vehicles.',
    'Warrantless arrest could happen anywhere, not only in forest.',
    'Arrested people could be held at a forest station.',
  ],
  concern_selection_mode: 'single',
  max_concern_selections: null,
  allow_custom_concern: true,
  custom_concern_label_en: null,
  custom_concern_label_ml: null,
  custom_concern_placeholder_en: null,
  custom_concern_placeholder_ml: null,
  created_at: '2024-11-01T00:00:00+05:30',
}

export const demoClauses: ObjectionClause[] = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C1_OFFICER',
    section_ref: 'Section 2',
    title_ml: 'ഫോറസ്റ്റ് ഓഫീസർ നിർവചനം',
    title_en: 'Forest Officer definition',
    explain_ml:
      'സെക്ഷൻ 2-ൽ വാച്ചർ, ട്രൈബൽ വാച്ചർ എന്നിവരെയും ഫോറസ്റ്റ് ഓഫീസറായി കണക്കാക്കുന്നു. അവരിൽ പലരും PSC വഴിയല്ല. വന നിയമത്തിലെ അധികാരങ്ങൾ അവർക്ക് കിട്ടും.',
    explain_en:
      'Section 2 would treat Watchers and Tribal Watchers as Forest Officers. Many are not PSC recruits. Forest Act powers would then sit with them.',
    email_ml:
      'വാച്ചർ, ട്രൈബൽ വാച്ചർ എന്നിവരെ ഫോറസ്റ്റ് ഓഫീസർ നിർവചനത്തിൽ നിന്ന് ഒഴിവാക്കുക. PSC വഴി സ്ഥിര നിയമനവും പരിശീലനവും നേടിയവർക്ക് മാത്രമേ ആ പദവി നൽകാവൂ.',
    email_en:
      'Remove Watchers and Tribal Watchers from the Forest Officer definition. Only trained, regularly appointed PSC staff should hold that status.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C2_RIVER',
    section_ref: 'River definition',
    title_ml: 'പുഴയുടെ നിർവചനം',
    title_en: 'Definition of river',
    explain_ml:
      'വനത്തിലേക്ക് ഒഴുകിയെത്തുന്ന പുഴകളും വനപുഴയായി കാണുന്നു. കേരളത്തിൽ പുഴകൾ ജനവാസ കേന്ദ്രങ്ങളിലൂടെയും ഒഴുകുന്നു. ഇത് വനം വകുപ്പ് അധികാരം വീടുകളിലേക്ക് വ്യാപിപ്പിക്കും.',
    explain_en:
      'Rivers that flow into forest would be treated as forest rivers. In Kerala many rivers pass through settlements. That would extend Forest Department power into homes.',
    email_ml:
      'പുഴ എന്നത് പൂർണമായും വനത്തിലൂടെ ഒഴുകുന്ന ഭാഗത്തേക്ക് മാത്രം ചുരുക്കുക. വനാതിർത്തിയിലെ പുഴകളിൽ അധികാരം പഞ്ചായത്തിനായിരിക്കണം.',
    email_en:
      'Limit "river" to stretches that flow wholly through forest. Panchayats must keep authority over rivers along the forest boundary.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000013',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C3_SEARCH',
    section_ref: 'Section 52',
    title_ml: 'വീട്ടിലേക്കുള്ള പരിശോധന',
    title_en: 'House search powers',
    explain_ml:
      'ബീറ്റ് ഫോറസ്റ്റ് ഓഫീസർക്ക് വെറും സംശയത്തിൽ വീട്ടിൽ കയറി പരിശോധിക്കാനുള്ള അധികാരം നൽകുന്നു. വനത്തിന് പുറത്തുള്ള വീടുകളിൽ ഇത് ദുരുപയോഗത്തിന് വഴി തുറക്കും.',
    explain_en:
      'Beat Forest Officers would be able to enter and search homes on mere suspicion. Outside the forest, that invites abuse.',
    email_ml:
      'വനത്തിന് പുറത്തുള്ള വീട് പരിശോധിക്കാൻ വെറും സംശയം മതിയാകരുത്. DFO അല്ലെങ്കിൽ ACF റാങ്കിലുള്ള വാറന്റ് വേണം. പരിശോധന ഫോറസ്റ്റ് ഉദ്യോഗസ്ഥർക്ക് മാത്രം.',
    email_en:
      'Do not allow house searches outside the forest on mere suspicion. Require a warrant from DFO or ACF rank. Only Forest Officers should take part.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 3,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C4_VEHICLE',
    section_ref: 'Section 52',
    title_ml: 'വാഹന പരിശോധന',
    title_en: 'Vehicle checks',
    explain_ml: 'വാഹനം തടഞ്ഞ് പരിശോധിക്കാൻ താഴെത്തട്ടിലുള്ള ഉദ്യോഗസ്ഥർക്ക് അനിയന്ത്രിത അധികാരം നൽകുന്നു.',
    explain_en: 'Junior staff would get unchecked power to stop and search vehicles.',
    email_ml:
      'വാഹന പരിശോധന ഫോറസ്റ്റ് ഓഫീസറുടെയോ എസ്.ഐ. റാങ്കിൽ കുറയാത്ത പോലീസുകാരന്റെയോ സന്നിധ്യത്തിൽ മാത്രം നടത്തുക.',
    email_en:
      'Vehicle checks must take place only in the presence of a Forest Officer or a police officer of at least SI rank.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 4,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000015',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C5_ARREST',
    section_ref: 'Section 63',
    title_ml: 'വാറന്റില്ലാത്ത അറസ്റ്റ്',
    title_en: 'Arrest without warrant',
    explain_ml:
      'വനത്തിനുള്ളിൽ മാത്രമല്ല, എവിടെ വെച്ചും വാറന്റില്ലാതെ അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം ബീറ്റ് ഫോറസ്റ്റ് ഓഫീസർ മുതൽ നൽകുന്നു. ഫോറസ്റ്റ് ഉദ്യോഗസ്ഥർ രേഖപ്പെടുത്തുന്ന കുറ്റസമ്മതം കോടതിയിൽ തെളിവാകാം.',
    explain_en:
      'Warrantless arrest would apply anywhere, not only inside the forest, from Beat Forest Officer rank up. Confessions recorded by forest staff can be used as evidence.',
    email_ml:
      'വനത്തിന് പുറത്ത് വാറന്റില്ലാതെ അറസ്റ്റ് ചെയ്യരുത്. അങ്ങനെ അറസ്റ്റ് വേണമെങ്കിൽ DFO അല്ലെങ്കിൽ ACF റാങ്കിലുള്ള വാറന്റ് വേണം.',
    email_en:
      'Do not allow warrantless arrests outside the forest. Any such arrest must rest on a warrant from DFO or ACF rank.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 5,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000016',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C6_OBSTRUCT',
    section_ref: 'Section 63(2)',
    title_ml: 'കൃത്യനിർവഹണം തടസ്സപ്പെടുത്തൽ',
    title_en: 'Obstructing official duty',
    explain_ml:
      'ഔദ്യോഗിക കൃത്യം തടഞ്ഞു എന്ന് പറഞ്ഞ് ആരെയും അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം സെക്ഷൻ ഫോറസ്റ്റ് ഓഫീസർക്ക് നൽകുന്നു. ഇത് ഇപ്പോൾ പോലീസിന് മാത്രമുള്ള അധികാരമാണ്.',
    explain_en:
      'Section Forest Officers would be able to arrest anyone for allegedly obstructing official work. That power currently belongs to the police.',
    email_ml:
      'സെക്ഷൻ 63.2 റദ്ദാക്കുക. ഔദ്യോഗിക കൃത്യം തടഞ്ഞു എന്ന് പറഞ്ഞ് ആരെയും അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം ഫോറസ്റ്റ് ഉദ്യോഗസ്ഥർക്ക് നൽകരുത്. അത് പോലീസിന് മാത്രം.',
    email_en:
      'Drop section 63.2. Forest staff must not get police-style power to arrest anyone for allegedly obstructing official duty.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 6,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000017',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C7_LOCKUP',
    section_ref: 'Section 63(3)',
    title_ml: 'ഫോറസ്റ്റ് സ്റ്റേഷൻ ഹാജർ',
    title_en: 'Forest station custody',
    explain_ml:
      'അറസ്റ്റ് ചെയ്ത ആളെ പോലീസ് സ്റ്റേഷനോ ഫോറസ്റ്റ് സ്റ്റേഷനോ ആക്കാം എന്ന് പറയുന്നു. ഫോറസ്റ്റ് സ്റ്റേഷനിൽ ലോക്കപ്പ് മർദ്ദനത്തിന് വഴി തുറക്കും.',
    explain_en:
      'Arrested people could be taken to a forest station instead of a police station. That opens the door to lock-up abuse.',
    email_ml:
      'അറസ്റ്റ് ചെയ്ത ആളെ ഫോറസ്റ്റ് സ്റ്റേഷനിലേക്ക് കൊണ്ടുപോകരുത്. ഉടൻ അടുത്ത പോലീസ് സ്റ്റേഷനിൽ ഹാജരാക്കണം എന്ന നിലവിലെ വ്യവസ്ഥ പുനഃസ്ഥാപിക്കുക.',
    email_en:
      'Do not take arrested people to a forest station. Restore the rule that they must be produced at the nearest police station at once.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 7,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000018',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C8_BNSS',
    section_ref: 'Section 63(4)',
    title_ml: 'കേന്ദ്ര നിയമവുമായുള്ള വൈരുദ്ധ്യം',
    title_en: 'Conflict with central law',
    explain_ml:
      'അറസ്റ്റ് BNS 2023 പ്രകാരമാകണമെന്ന് പറയുന്നു. എന്നാൽ കോഗ്നിസബിൾ അല്ലാത്ത കുറ്റത്തിനും വാറന്റില്ലാതെ അറസ്റ്റ് അനുവദിക്കുന്നു. അത് കേന്ദ്ര നിയമത്തിന് വിരുദ്ധമാണ്.',
    explain_en:
      'Arrests are said to follow BNS 2023, yet warrantless arrest would cover non-cognizable forest offences too. That conflicts with central law.',
    email_ml:
      'സെക്ഷൻ 63.4 കേന്ദ്ര നിയമമായ BNS 2023-ന് വിരുദ്ധമാണ്. കോഗ്നിസബിൾ അല്ലാത്ത കുറ്റത്തിന് വാറന്റില്ലാതെ അറസ്റ്റ് അനുവദിക്കരുത്.',
    email_en:
      'Section 63.4 conflicts with BNS 2023. Do not allow warrantless arrest for forest offences that are not cognizable.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 8,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000019',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C9_PRESUME',
    section_ref: 'Section 69(2)',
    title_ml: 'നിരപരാധിത്വം മറിച്ചിടൽ',
    title_en: 'Reverse burden of proof',
    explain_ml:
      'വനോൽപ്പന്നം കയ്യിലുണ്ട് എന്ന് പറഞ്ഞ് അറസ്റ്റ് ചെയ്താൽ, അത് നിയമവിരുദ്ധമാണെന്നും കുറ്റം ചെയ്തുവെന്നും കരുതാം. തെളിയിക്കേണ്ടത് പ്രതിയാണ്. നിരപരാധിത്വം എന്ന അടിസ്ഥാന നിയമം മറിച്ചിടുന്നു.',
    explain_en:
      'If someone is arrested for possessing forest produce, they would be presumed guilty unless they prove otherwise. That reverses the basic rule of innocence.',
    email_ml:
      'സെക്ഷൻ 69.2 പിൻവലിക്കുക. കുറ്റം തെളിയിക്കേണ്ടത് പ്രോസിക്യൂഷന്റെ ഉത്തരവാദിത്വമാണ്. വനോൽപ്പന്നം കയ്യിലുണ്ട് എന്ന് പറഞ്ഞ് പ്രതിയെ കുറ്റക്കാരനായി കരുതരുത്.',
    email_en:
      'Withdraw section 69.2. The prosecution must prove guilt. Possession of alleged forest produce must not be treated as proof of crime.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 9,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000001a',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C10_CERTIFY',
    section_ref: 'Section 72(2)',
    title_ml: 'വനോൽപ്പന്ന സർട്ടിഫിക്കറ്റ്',
    title_en: 'Forest produce certificate',
    explain_ml:
      'റേഞ്ച് ഫോറസ്റ്റ് ഓഫീസർ ഒരു ഉൽപ്പന്നം വനോൽപ്പന്നമാണെന്ന് സർട്ടിഫൈ ചെയ്താൽ അത് കേസിൽ ആധികാരിക രേഖയാകും. സ്വന്തം പറമ്പിലെ മരമോ തേനോ പോലും കേസാകാം.',
    explain_en:
      'A Range Forest Officer certificate that something is forest produce would be treated as conclusive. Even timber or honey from a homestead could become a case.',
    email_ml:
      'സെക്ഷൻ 72.2 റദ്ദാക്കുക. ഒരു ഉൽപ്പന്നം വനോൽപ്പന്നമാണോ എന്ന് റേഞ്ച് ഓഫീസർ സർട്ടിഫിക്കറ്റ് കൊണ്ട് തീരുമാനിക്കരുത്. ശാസ്ത്രീയ അന്വേഷണം വേണം.',
    email_en:
      'Repeal section 72.2. Whether something is forest produce must be proved by scientific inquiry, not a Range Officer certificate.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 10,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000001b',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C11_PENALTY',
    section_ref: 'Section 65',
    title_ml: 'തെറ്റായ അറസ്റ്റിനുള്ള ശിക്ഷ',
    title_en: 'Penalty for wrongful arrest',
    explain_ml:
      'ജനങ്ങൾക്കുള്ള പിഴ അഞ്ചും പത്തും ഇരട്ടിയാക്കുമ്പോൾ, തെറ്റായ അറസ്റ്റിനുള്ള ഉദ്യോഗസ്ഥ ശിക്ഷ 200 രൂപയിൽ തന്നെ നിൽക്കുന്നു. ആറുമാസം തടവും മാറ്റിയിട്ടില്ല.',
    explain_en:
      'Fines on the public would rise five to ten times, while the penalty on officers for wrongful arrest stays at two hundred rupees and up to six months in jail.',
    email_ml:
      'തെറ്റായ അറസ്റ്റിനുള്ള സെക്ഷൻ 65 ശിക്ഷ 200 രൂപയിൽ നിർത്തരുത്. അധികാര ദുർവിനിയോഗത്തിന് അഞ്ച് വർഷം വരെ തടവും കുറഞ്ഞത് ഒരു ലക്ഷം രൂപ പിഴയും വേണം.',
    email_en:
      'Do not leave the section 65 penalty for wrongful arrest at two hundred rupees. Raise it to up to five years in prison and a fine of at least one lakh rupees.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 11,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000001c',
    campaign_id: FOREST_BILL_CAMPAIGN_ID,
    code: 'C12_WILDLIFE',
    section_ref: 'Missing clauses',
    title_ml: 'വന്യമൃഗ ആക്രമണം',
    title_en: 'Wildlife attacks',
    explain_ml:
      'വന്യമൃഗങ്ങൾ വനം വിട്ട് ജീവഹാനിയും കൃഷിനാശവും ഉണ്ടാക്കുന്നതിനെ ലഘൂകരിക്കാനുള്ള വകുപ്പുകൾ ബില്ലിൽ ഇല്ല. മനുഷ്യജീവന് മുൻഗണന നൽകുന്ന വ്യവസ്ഥ വേണം.',
    explain_en:
      'The Bill has no clauses to reduce wildlife attacks on people, livestock, or crops. The amendment should put human life first.',
    email_ml:
      'വന്യമൃഗ ആക്രമണം തടയാനുള്ള വകുപ്പുകൾ ബില്ലിൽ ഇല്ല. മനുഷ്യജീവനും കൃഷിക്കും മുൻഗണന നൽകുന്ന വ്യവസ്ഥകൾ കൂട്ടിച്ചേർക്കുക. ഈ രൂപത്തിൽ ബിൽ പിൻവലിക്കുക.',
    email_en:
      'The Bill has no clauses to reduce wildlife attacks. Add provisions that put human life and farms first, or withdraw the Bill in this form.',
    full_text_ml: '',
    full_text_en: '',
    full_url: null,
    sort_order: 12,
    is_active: true,
  },
]

/** Clearly fake details so a stakeholder can walk the form without typing. */
export function sampleDemoDetails(lang: Lang): DetailsFields {
  if (lang === 'en') {
    return {
      fullName: 'Demo farmer',
      addressLine: 'Example house, Ward 7',
      panchayat: 'Example panchayat',
      village: '',
      district: 'Idukki',
      pincode: '685531',
      phone: '9876543210',
      email: 'demo@example.com',
      customText:
        'Wildlife came onto our cardamom plot last year. A search on mere suspicion would frighten the whole ward.',
    }
  }

  return {
    fullName: 'മാതൃകാ കർഷകൻ',
    addressLine: 'മാതൃകാ വീട്, വാർഡ് 7',
    panchayat: 'മാതൃകാ പഞ്ചായത്ത്',
    village: '',
    district: 'Idukki',
    pincode: '685531',
    phone: '9876543210',
    email: 'demo@example.com',
    customText: 'കഴിഞ്ഞ വർഷം ഞങ്ങളുടെ ഏലത്തോട്ടത്തിലേക്ക് വന്യമൃഗം വന്നു. സംശയം മാത്രം മതിയെങ്കിൽ വാർഡ് മുഴുവൻ ഭയക്കും.',
  }
}
