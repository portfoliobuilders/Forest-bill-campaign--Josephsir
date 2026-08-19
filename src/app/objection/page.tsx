import { Wizard } from '@/components/wizard/Wizard'
import { NoLiveConsultation } from '@/components/NoLiveConsultation'
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

  if (!data || data.clauses.length === 0) {
    return <NoLiveConsultation />
  }

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
