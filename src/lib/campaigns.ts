import 'server-only'

import { getDefaultCampaignSlug, publicCampaign, type CampaignState } from '@/lib/campaign'
import { demoCampaign, demoClauses, KERALA_DISTRICTS, type DistrictOption } from '@/lib/demo-data'
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
  const seen = new Map<string, DistrictOption>()
  for (const row of rows) {
    if (!seen.has(row.district)) {
      seen.set(row.district, {
        value: row.district,
        labelEn: row.name_en || row.district,
        labelMl: row.name_ml || row.district,
      })
    }
  }
  const ordered = KERALA_DISTRICTS.map((known) => seen.get(known.value)).filter((row): row is DistrictOption =>
    Boolean(row),
  )
  const extras = [...seen.values()].filter((row) => !KERALA_DISTRICTS.some((known) => known.value === row.value))
  return ordered.length > 0 ? [...ordered, ...extras] : KERALA_DISTRICTS
}

const bundledDemo: ObjectionPageData = {
  campaign: demoCampaign,
  clauses: demoClauses,
  districts: KERALA_DISTRICTS,
  mode: 'compose',
}

async function loadCampaignBundle(
  campaign: Campaign,
  mode: WizardMode,
): Promise<ObjectionPageData> {
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
    if (mode === 'live') {
      return { campaign, clauses, districts, mode }
    }
    return clauses.length > 0 ? { campaign, clauses, districts, mode } : bundledDemo
  }

  if (clauses.length === 0 && mode !== 'live') {
    return { ...bundledDemo, districts }
  }

  return { campaign, clauses, districts, mode }
}

/** Public walkthrough. Never live, never writes a submission. */
export async function loadComposeData(): Promise<ObjectionPageData> {
  try {
    const supabase = createServiceClient()
    const slug = getDefaultCampaignSlug()
    const bySlug = await supabase.from('campaigns').select('*').eq('slug', slug).maybeSingle()
    const fallback = bySlug.data
      ? null
      : await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
    const row = (bySlug.data ?? fallback?.data ?? null) as (Campaign & { preview_token?: string | null }) | null
    if (row) {
      return loadCampaignBundle(publicCampaign(row), 'compose')
    }
  } catch {
    return bundledDemo
  }

  return bundledDemo
}

export async function loadObjectionData(state: CampaignState): Promise<ObjectionPageData | null> {
  if (state.state === 'dormant') {
    return loadComposeData()
  }

  return loadCampaignBundle(state.campaign, state.state)
}

export function publicCampaignSlug(): string {
  return getDefaultCampaignSlug()
}
