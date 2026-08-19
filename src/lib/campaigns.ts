import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { demoCampaign, demoClauses, KERALA_DISTRICTS, type DistrictOption } from '@/lib/demo-data'
import type { Campaign, Constituency, ObjectionClause } from '@/types/database'

export type ObjectionPageData = {
  campaign: Campaign
  clauses: ObjectionClause[]
  districts: DistrictOption[]
  isLive: boolean
}

function publicServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
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

export async function loadObjectionData(): Promise<ObjectionPageData | null> {
  try {
    const supabase = publicServerClient()

    if (supabase) {
      const [{ data: campaign }, { data: constituencyRows }] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*')
          .eq('is_active', true)
          .order('deadline_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase.from('constituencies').select('district, name_ml, name_en').eq('is_active', true).order('district'),
      ])

      const districts =
        constituencyRows && constituencyRows.length > 0
          ? uniqueDistricts(constituencyRows as Pick<Constituency, 'district' | 'name_ml' | 'name_en'>[])
          : KERALA_DISTRICTS

      if (campaign) {
        const { data: clauses } = await supabase
          .from('objection_clauses')
          .select('*')
          .eq('campaign_id', (campaign as Campaign).id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        return {
          campaign: campaign as Campaign,
          clauses: (clauses ?? []) as ObjectionClause[],
          districts,
          isLive: true,
        }
      }
    }
  } catch {
    // Missing env, network, or schema — fall through to empty / demo.
  }

  if (process.env.NODE_ENV !== 'production') {
    return {
      campaign: demoCampaign,
      clauses: demoClauses,
      districts: KERALA_DISTRICTS,
      isLive: false,
    }
  }

  return null
}
