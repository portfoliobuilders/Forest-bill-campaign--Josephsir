import { NoLiveConsultation } from '@/components/NoLiveConsultation'
import { Wizard } from '@/components/wizard/Wizard'
import { loadObjectionData } from '@/lib/campaigns'

export const dynamic = 'force-dynamic'

export default async function ObjectionPage() {
  const data = await loadObjectionData()

  if (!data) {
    return <NoLiveConsultation />
  }

  return (
    <Wizard campaign={data.campaign} clauses={data.clauses} districts={data.districts} isLive={data.isLive} />
  )
}
