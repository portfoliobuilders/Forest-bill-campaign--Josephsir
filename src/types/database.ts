export type SendMethod = 'gmail_web' | 'mailto' | 'copy' | 'server' | 'print'

export type SubmissionStatus =
  | 'draft'
  | 'verified'
  | 'handoff_opened'
  | 'confirmed_sent'
  | 'server_sent'
  | 'failed'

export type RepLevel = 'mla' | 'mp_lok_sabha' | 'mp_rajya_sabha' | 'minister' | 'local_body'

export type Campaign = {
  id: string
  slug: string
  title_ml: string
  title_en: string
  summary_ml: string
  summary_en: string
  recipient_email: string
  cc_emails: string[]
  subject_ml: string
  subject_en: string
  intro_ml: string
  intro_en: string
  source_url: string
  closing_ml: string
  closing_en: string
  opens_at: string
  deadline_at: string
  is_active: boolean
  explainer_ml: string[]
  explainer_en: string[]
  created_at: string
}

export type ObjectionClause = {
  id: string
  campaign_id: string
  code: string
  section_ref: string | null
  title_ml: string
  title_en: string
  explain_ml: string
  explain_en: string
  email_ml: string
  email_en: string
  full_url: string | null
  sort_order: number
  is_active: boolean
}

export type Submission = {
  id: string
  campaign_id: string
  full_name: string
  email: string
  email_normalized: string
  phone_e164: string | null
  address_line: string
  panchayat: string | null
  district: string
  pincode: string | null
  language: string
  custom_text: string | null
  generated_subject: string
  generated_body: string
  send_method: SendMethod | null
  status: SubmissionStatus
  show_name_public: boolean
  custom_text_public: boolean
  verified_at: string | null
  handoff_at: string | null
  confirmed_at: string | null
  ip_hash: string | null
  user_agent: string | null
  consent_version: string
  consent_at: string
  created_at: string
  constituency_id: string | null
  cc_representative_ids: string[]
  is_test: boolean
}

export type Constituency = {
  id: string
  code: string
  name_en: string
  name_ml: string
  district: string
  level: RepLevel
  is_active: boolean
}

export type Representative = {
  id: string
  constituency_id: string | null
  name_en: string
  name_ml: string
  level: RepLevel
  party: string | null
  front: string | null
  official_email: string | null
  office_phone: string | null
  portfolio: string | null
  term_start: string
  term_end: string | null
  source_url: string
  verified_at: string
  is_current: boolean
}

export type ConstituencyConfidence = 'exact' | 'probable' | 'district'

export type ConstituencyCandidate = {
  constituency: Constituency
  confidence: ConstituencyConfidence
}

export type ConstituencyMatch = ConstituencyCandidate & {
  representative: Representative | null
}

export type WizardRouting = {
  constituencyId: string | null
  ccMla: boolean
  ccRepresentativeIds: string[]
  constituency: Constituency | null
  representative: Representative | null
}
