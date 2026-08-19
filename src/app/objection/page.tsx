import { Wizard } from '@/components/wizard/Wizard'
import { resolveCampaignState } from '@/lib/campaign'
import { loadObjectionData } from '@/lib/campaigns'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ preview?: string }>
}

export default async function ObjectionPage({ searchParams }: Props) {
  const params = await searchParams
  const state = await resolveCampaignState(params.preview)
  const data = await loadObjectionData(state)

  return (
    <Wizard
      campaign={data.campaign}
      clauses={data.clauses}
      districts={data.districts}
      mode={data.mode}
      testerEmail={null}
    />
  )
}
