import { HomePage } from '@/components/HomePage'
import { daysRemaining, resolveCampaignState } from '@/lib/campaign'
import { loadComposeData } from '@/lib/campaigns'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function confirmedCount(slug: string): Promise<number> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('campaign_stats', { p_slug: slug })
    if (error || !data || !Array.isArray(data) || data.length === 0) return 0
    const row = data[0] as { confirmed?: number }
    return Number(row.confirmed ?? 0)
  } catch {
    return 0
  }
}

type Props = {
  searchParams: Promise<{ preview?: string }>
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams
  const state = await resolveCampaignState(params.preview)

  if (state.state === 'dormant') {
    const data = await loadComposeData()
    return <HomePage mode="compose" campaign={data.campaign} daysLeft={0} confirmedCount={0} />
  }

  const campaign = state.campaign
  const count = state.state === 'live' ? await confirmedCount(campaign.slug) : 0
  const daysLeft = state.state === 'live' ? daysRemaining(campaign.deadline_at) : 0

  return (
    <HomePage mode={state.state} campaign={campaign} daysLeft={daysLeft} confirmedCount={count} />
  )
}
