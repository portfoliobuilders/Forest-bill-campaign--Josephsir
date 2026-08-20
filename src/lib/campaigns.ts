import 'server-only'

import { publicCampaign, type CampaignState } from '@/lib/campaign'
import { KERALA_DISTRICTS, type DistrictOption } from '@/lib/demo-data'
import { normalizeFormFields } from '@/lib/form-fields'
import { applyRecipientsToCampaign } from '@/lib/recipients'
import { createServiceClient } from '@/lib/supabase/server'
import type {
  Campaign,
  CampaignFormField,
  CampaignRecipient,
  CampaignSource,
  Constituency,
  ObjectionClause,
} from '@/types/database'
import type { WizardMode } from '@/lib/wizard-mode'

export type { WizardMode }

export type CampaignExperience = {
  campaign: Campaign
  clauses: ObjectionClause[]
  formFields: CampaignFormField[]
  recipients: CampaignRecipient[]
  sources: CampaignSource[]
  districts: DistrictOption[]
  mode: WizardMode
}

function uniqueDistricts(rows: Pick<Constituency, 'district' | 'name_ml' | 'name_en'>[]): DistrictOption[] {
  const seen = new Set(rows.map((row) => row.district))
  const ordered = KERALA_DISTRICTS.filter((known) => seen.has(known.value))
  const extras = [...seen]
    .filter((district) => !KERALA_DISTRICTS.some((known) => known.value === district))
    .map((district) => {
      const row = rows.find((item) => item.district === district)
      return {
        value: district,
        labelEn: row?.name_en || district,
        labelMl: row?.name_ml || district,
      }
    })
  return ordered.length > 0 ? [...ordered, ...extras] : KERALA_DISTRICTS
}

export function withCampaignClauses(campaign: Campaign, clauses: ObjectionClause[]): ObjectionClause[] {
  return clauses.map((clause) => ({
    ...clause,
    campaign_id: clause.campaign_id || campaign.id,
    full_text_ml: clause.full_text_ml ?? '',
    full_text_en: clause.full_text_en ?? '',
    email_subject_ml: clause.email_subject_ml ?? '',
    email_subject_en: clause.email_subject_en ?? '',
    email_body_ml: clause.email_body_ml ?? '',
    email_body_en: clause.email_body_en ?? '',
    ai_body_en: clause.ai_body_en ?? '',
    ai_body_ml: clause.ai_body_ml ?? '',
    ai_body_en_status: clause.ai_body_en_status ?? 'none',
    ai_body_ml_status: clause.ai_body_ml_status ?? 'none',
  }))
}

export async function loadCampaignBundle(campaign: Campaign): Promise<{
  campaign: Campaign
  clauses: ObjectionClause[]
  formFields: CampaignFormField[]
  recipients: CampaignRecipient[]
  sources: CampaignSource[]
  districts: DistrictOption[]
}> {
  let clauses: ObjectionClause[] = []
  let formFields: CampaignFormField[] = []
  let recipients: CampaignRecipient[] = []
  let sources: CampaignSource[] = []
  let districts = KERALA_DISTRICTS

  try {
    const supabase = createServiceClient()
    const [{ data: clauseRows }, { data: fieldRows }, { data: recipientRows }, { data: constituencyRows }, sourceResult] =
      await Promise.all([
        supabase
          .from('objection_clauses')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('campaign_form_fields')
          .select('*')
          .eq('campaign_id', campaign.id)
          .order('display_order', { ascending: true }),
        supabase
          .from('campaign_recipients')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase.from('constituencies').select('district, name_ml, name_en').eq('is_active', true).order('district'),
        supabase
          .from('campaign_sources')
          .select(
            'id, campaign_id, publication_name, publication_date, title_ml, title_en, description_ml, description_en, source_url, file_url, file_mime, file_name, is_public, sort_order, created_at',
          )
          .eq('campaign_id', campaign.id)
          .eq('is_public', true)
          .order('sort_order', { ascending: true }),
      ])

    clauses = withCampaignClauses(campaign, (clauseRows ?? []) as ObjectionClause[])
    formFields = normalizeFormFields((fieldRows ?? []) as CampaignFormField[])
    recipients = (recipientRows ?? []) as CampaignRecipient[]
    if (!sourceResult.error) {
      sources = (sourceResult.data ?? []) as CampaignSource[]
    }
    if (constituencyRows && constituencyRows.length > 0) {
      districts = uniqueDistricts(constituencyRows as Pick<Constituency, 'district' | 'name_ml' | 'name_en'>[])
    }
  } catch {
    formFields = normalizeFormFields([])
  }

  return {
    campaign: applyRecipientsToCampaign(publicCampaign(campaign), recipients),
    clauses,
    formFields,
    recipients,
    sources,
    districts,
  }
}

export async function loadObjectionData(state: CampaignState): Promise<CampaignExperience | null> {
  if (state.state === 'dormant') return null
  const bundle = await loadCampaignBundle(state.campaign)
  const mode: WizardMode = state.state === 'preview' ? 'preview' : state.state === 'live' ? 'live' : 'demo'
  return { ...bundle, mode }
}

export function publicCampaignSlug(): string {
  return ''
}
