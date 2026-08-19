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

const DEMO_CAMPAIGN_ID = '00000000-0000-4000-8000-000000000001'

export const demoCampaign: Campaign = {
  id: DEMO_CAMPAIGN_ID,
  slug: 'demo',
  title_ml: 'ജനശബ്ദം — മാതൃകാ കാമ്പെയ്ൻ',
  title_en: 'Janashabdam — Demo Campaign',
  summary_ml: 'ഇത് ഒരു മാതൃകയാണ്. തത്സമയ കൺസൾട്ടേഷൻ സ്ഥിരീകരിക്കുന്നതുവരെ സജീവമാക്കില്ല.',
  summary_en: 'This is a placeholder campaign. It stays inactive until a live consultation is verified.',
  recipient_email: 'consultation@example.gov.in',
  cc_emails: [],
  subject_ml: 'നിയമ കൂടിയാലോചനയോടുള്ള എന്റെ എതിർപ്പ്',
  subject_en: 'My objection to the legislative consultation',
  intro_ml: 'ബഹുമാനപ്പെട്ട സെക്രട്ടറി, ഞാൻ താഴെപ്പറയുന്ന കാര്യങ്ങളിൽ എതിർപ്പ് രേഖപ്പെടുത്തുന്നു.',
  intro_en: 'Respected Secretary, I record my objection on the points below.',
  source_url: 'https://example.gov.in/consultation/placeholder-primary-source',
  closing_ml: 'ദയവായി എന്റെ അഭിപ്രായം പരിഗണിക്കുക. നന്ദി.',
  closing_en: 'Please consider my views. Thank you.',
  opens_at: new Date().toISOString(),
  deadline_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: false,
  created_at: new Date().toISOString(),
}

export const demoClauses: ObjectionClause[] = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C1_NOTICE',
    section_ref: 'Notice period',
    title_ml: 'അറിയിപ്പ് കാലാവധി',
    title_en: 'Notice period',
    explain_ml:
      'ഹൈറേഞ്ചിലെ കർഷകർക്ക് വായിച്ച് മനസ്സിലാക്കാൻ മതിയായ സമയം വേണം. തിടുക്കത്തിലുള്ള കൂടിയാലോചന അർത്ഥമില്ല.',
    explain_en:
      'Highland farmers need enough time to read and understand the proposal. A rushed consultation is not a real one.',
    email_ml:
      'പൊതുജന അഭിപ്രായത്തിന് മതിയായ സമയം നൽകണം. ഹൈറേഞ്ചിലെ കർഷകർക്ക് വായിച്ച് മനസ്സിലാക്കാൻ കുറഞ്ഞത് അറുപത് ദിവസം വേണം.',
    email_en:
      'Give the public enough time to comment. Highland farmers need at least sixty days to read and understand this.',
    full_url: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C2_LAND',
    section_ref: 'Private land',
    title_ml: 'സ്വകാര്യ ഭൂമി',
    title_en: 'Private land',
    explain_ml:
      'കൃഷിയിടവും വീടും സംരക്ഷിക്കപ്പെടണം. കർഷകന്റെ ഭൂമി വനമായി കണക്കാക്കി അവകാശം നഷ്ടപ്പെടുത്തരുത്.',
    explain_en:
      'Farms and homes must stay protected. A farmer’s land should not be treated as forest in a way that strips rights.',
    email_ml:
      'സ്വകാര്യ ഭൂമിയിലെ കൃഷിയും വീടും സംരക്ഷിക്കപ്പെടണം. കർഷകന്റെ ഭൂമി വനമായി കണക്കാക്കി അവകാശം നഷ്ടപ്പെടുത്തരുത്.',
    email_en:
      'Farms and homes on private land must be protected. Do not treat a farmer’s land as forest to take away rights.',
    full_url: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000013',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C3_ARREST',
    section_ref: 'Arrest powers',
    title_ml: 'അറസ്റ്റ് അധികാരം',
    title_en: 'Arrest powers',
    explain_ml: 'സാധാരണ താമസക്കാരെ അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം വ്യക്തമായ പരിധിയോടെ മാത്രമേ ഉണ്ടാകാവൂ.',
    explain_en: 'Power to arrest ordinary residents should exist only with clear, written limits.',
    email_ml:
      'സാധാരണ താമസക്കാരെ അറസ്റ്റ് ചെയ്യാനുള്ള അധികാരം വ്യക്തമായ പരിധിയോടെ മാത്രമേ ഉണ്ടാകാവൂ. ദുരുപയോഗം തടയണം.',
    email_en: 'Power to arrest ordinary residents must exist only with clear limits. Misuse must be prevented.',
    full_url: null,
    sort_order: 3,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C4_PANCHAYAT',
    section_ref: 'Local bodies',
    title_ml: 'പഞ്ചായത്ത് അഭിപ്രായം',
    title_en: 'Panchayat voice',
    explain_ml: 'തദ്ദേശ സ്ഥാപനങ്ങൾ കേൾക്കണം. പഞ്ചായത്ത് തീരുമാനം മറികടക്കരുത്.',
    explain_en: 'Local bodies must be heard. Panchayat decisions should not be overridden in silence.',
    email_ml:
      'തദ്ദേശ സ്ഥാപനങ്ങളുടെ അഭിപ്രായം നിർബന്ധമായി കേൾക്കണം. പഞ്ചായത്ത് തലത്തിലുള്ള തീരുമാനം മറികടക്കരുത്.',
    email_en: 'Local bodies must be heard as a requirement. Do not override panchayat-level decisions in silence.',
    full_url: null,
    sort_order: 4,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000015',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C5_TRIBAL',
    section_ref: 'Forest rights',
    title_ml: 'ആദിവാസി അവകാശം',
    title_en: 'Adivasi rights',
    explain_ml: 'വനാവകാശ നിയമവും പരമ്പരാഗത വാസസ്ഥലവും ദുർബലമാക്കരുത്.',
    explain_en: 'The Forest Rights Act and traditional habitation must not be weakened.',
    email_ml: 'ആദിവാസി അവകാശങ്ങളും വനാവകാശ നിയമവും ദുർബലമാക്കരുത്. പരമ്പരാഗത വാസസ്ഥലം സംരക്ഷിക്കണം.',
    email_en: 'Adivasi rights and the Forest Rights Act must not be weakened. Traditional habitation must be protected.',
    full_url: null,
    sort_order: 5,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000016',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C6_APPEAL',
    section_ref: 'Appeals',
    title_ml: 'അപ്പീൽ വഴി',
    title_en: 'Appeal path',
    explain_ml: 'തീരുമാനത്തിനെതിരെ ലളിതമായ അപ്പീൽ വേണം. ദരിദ്രർക്ക് കോടതി ചെലവ് താങ്ങാനാവില്ല.',
    explain_en: 'There must be a simple appeal path. Poor families cannot bear court costs.',
    email_ml: 'തീരുമാനത്തിനെതിരെ ലളിതമായ അപ്പീൽ വഴി വേണം. ദരിദ്രർക്ക് കോടതി ചെലവ് താങ്ങാനാവില്ല.',
    email_en: 'There must be a simple appeal path against decisions. Poor families cannot bear court costs.',
    full_url: null,
    sort_order: 6,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000017',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C7_COMPENSATION',
    section_ref: 'Compensation',
    title_ml: 'നഷ്ടപരിഹാരം',
    title_en: 'Compensation',
    explain_ml: 'നഷ്ടപരിഹാരം നീതിയുക്തവും മുൻകൂട്ടി നൽകേണ്ടതുമാണ്. വാക്ക് മാത്രം മതിയാകില്ല.',
    explain_en: 'Compensation must be fair and paid in advance. A verbal promise is not enough.',
    email_ml: 'നഷ്ടപരിഹാരം നീതിയുക്തവും മുൻകൂട്ടി നൽകേണ്ടതുമാണ്. വാക്ക് മാത്രം മതിയാകില്ല.',
    email_en: 'Compensation must be fair and paid in advance. A verbal promise is not enough.',
    full_url: null,
    sort_order: 7,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000018',
    campaign_id: DEMO_CAMPAIGN_ID,
    code: 'C8_LANGUAGE',
    section_ref: 'Language',
    title_ml: 'മലയാളം അറിയിപ്പ്',
    title_en: 'Malayalam notice',
    explain_ml: 'എല്ലാ അറിയിപ്പുകളും മലയാളത്തിലും ഇംഗ്ലീഷിലും ലഭ്യമാകണം.',
    explain_en: 'Every notice must be available in Malayalam and English.',
    email_ml:
      'എല്ലാ അറിയിപ്പുകളും മലയാളത്തിലും ഇംഗ്ലീഷിലും ലഭ്യമാകണം. ഇംഗ്ലീഷ് മാത്രമുള്ള രേഖ പൊതുജനങ്ങളെ ഒഴിവാക്കുന്നു.',
    email_en: 'Every notice must be available in Malayalam and English. English-only documents exclude the public.',
    full_url: null,
    sort_order: 8,
    is_active: true,
  },
]
