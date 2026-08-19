import 'server-only'

import { getDefaultCampaignSlug, publicCampaign, type CampaignState } from '@/lib/campaign'
import { KERALA_DISTRICTS, type DistrictOption } from '@/lib/demo-data'
import { createServiceClient } from '@/lib/supabase/server'
import type { WizardMode } from '@/lib/wizard-mode'
import type { Campaign, Constituency, ObjectionClause } from '@/types/database'

export type { WizardMode }

export type ObjectionPageData = {
  campaign: Campaign
  clauses: ObjectionClause[]
  districts: DistrictOption[]
  mode: WizardMode
}

function uniqueDistricts(rows: Pick<Constituency, 'district' | 'name_ml' | 'name_en'>[]): DistrictOption[] {
  const seen = new Set(rows.map((row) => row.district))
  const ordered = KERALA_DISTRICTS.filter((known) => seen.has(known.value))
  const extras = [...seen]
    .filter((district) => !KERALA_DISTRICTS.some((known) => known.value === district))
    .map((district) => {
      const row = rows.find((r) => r.district === district)
      return {
        value: district,
        labelEn: row?.name_en || district,
        labelMl: row?.name_ml || district,
      }
    })
  return ordered.length > 0 ? [...ordered, ...extras] : KERALA_DISTRICTS
}

export async function loadObjectionData(state: CampaignState): Promise<ObjectionPageData | null> {
  if (state.state === 'dormant') return null

  const campaign = publicCampaign(state.campaign)
  let clauses: ObjectionClause[] = []
  let districts = KERALA_DISTRICTS

  try {
    const supabase = createServiceClient()
    const [{ data: clauseRows }, { data: constituencyRows }] = await Promise.all([
      supabase
        .from('objection_clauses')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.from('constituencies').select('district, name_ml, name_en').eq('is_active', true).order('district'),
    ])

    clauses = (clauseRows ?? []) as ObjectionClause[]
    if (constituencyRows && constituencyRows.length > 0) {
      districts = uniqueDistricts(constituencyRows as Pick<Constituency, 'district' | 'name_ml' | 'name_en'>[])
    }
  } catch {
    return {
      campaign,
      clauses,
      districts,
      mode: state.state,
    }
  }

  return {
    campaign,
    clauses,
    districts,
    mode: state.state,
  }
}

export function publicCampaignSlug(): string {
  return getDefaultCampaignSlug()
}
