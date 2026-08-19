import { HomePage } from '@/components/HomePage'
import { daysRemaining, resolveCampaignState } from '@/lib/campaign'
import { publicCampaignSlug } from '@/lib/campaigns'
import { publicPreparedCount } from '@/lib/public-stats'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ preview?: string }>
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams
  const state = await resolveCampaignState(params.preview)
  const campaign = state.state === 'dormant' ? null : state.campaign
  const slug = campaign?.slug ?? publicCampaignSlug()
  const count = await publicPreparedCount(slug)
  const daysLeft = campaign ? daysRemaining(campaign.deadline_at) : 0

  return <HomePage mode={state.state} campaign={campaign} daysLeft={daysLeft} confirmedCount={count} />
}
