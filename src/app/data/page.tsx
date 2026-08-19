import { resolveCampaignState } from '@/lib/campaign'
import { publicCampaignSlug } from '@/lib/campaigns'
import { DataPageContent } from '@/components/DataPageContent'
import { createServiceClientOrNull } from '@/lib/supabase/server'

export async function generateMetadata() {
  return {
    title: 'പൊതു വിവരം — ജനശബ്ദം',
    description: 'സ്ഥിരീകരിച്ച എതിർപ്പുകളുടെ എണ്ണവും ജില്ലാ/നിയോജകമണ്ഡല വിഭജനവും',
  }
}

export default async function DataPage() {
  await resolveCampaignState()
  const slug = publicCampaignSlug()
  const supabase = createServiceClientOrNull()

  let stats = { confirmed: 0, opened: 0, districts: 0 }
  let clauses: { code: string; title_ml: string; title_en: string; cnt: number }[] = []
  let districtRows: { district: string; cnt: number }[] = []
  let constituencyRows: { name_ml: string; name_en: string; district: string; cnt: number }[] = []
  let supporters: { display_name: string; district: string }[] = []

  if (supabase) {
    const [statsRes, clauseRes, districtRes, constituencyRes, supportersRes] = await Promise.all([
      supabase.rpc('campaign_stats', { p_slug: slug }),
      supabase.rpc('clause_breakdown', { p_slug: slug }),
      supabase.rpc('district_breakdown', { p_slug: slug }),
      supabase.rpc('constituency_breakdown', { p_slug: slug }),
      supabase.rpc('public_supporters', { p_slug: slug }),
    ])

    if (statsRes.data?.[0]) {
      const row = statsRes.data[0] as { confirmed: number; opened: number; districts: number }
      stats = { confirmed: Number(row.confirmed), opened: Number(row.opened), districts: Number(row.districts) }
    }
    clauses = (clauseRes.data ?? []).map((r: { code: string; title_ml: string; title_en: string; cnt: number }) => ({
      code: r.code,
      title_ml: r.title_ml,
      title_en: r.title_en,
      cnt: Number(r.cnt),
    }))
    districtRows = (districtRes.data ?? []).map((r: { district: string; cnt: number }) => ({
      district: r.district,
      cnt: Number(r.cnt),
    }))
    constituencyRows = (constituencyRes.data ?? []).map(
      (r: { name_ml: string; name_en: string; district: string; cnt: number }) => ({
        name_ml: r.name_ml,
        name_en: r.name_en,
        district: r.district,
        cnt: Number(r.cnt),
      }),
    )
    type PublicName = { display_name: string; district: string }
    supporters = (supportersRes.data ?? [])
      .map((row: { display_name?: unknown; district?: unknown }): PublicName => ({
        display_name: typeof row.display_name === 'string' ? row.display_name : '',
        district: typeof row.district === 'string' ? row.district : '',
      }))
      .filter((row: PublicName) => row.display_name.length > 0 && row.district.length > 0)
  }

  const maxClause = Math.max(1, ...clauses.map((c) => c.cnt))

  return (
    <DataPageContent
      stats={stats}
      clauses={clauses}
      maxClause={maxClause}
      districtRows={districtRows}
      constituencyRows={constituencyRows}
      supporters={supporters}
    />
  )
}
