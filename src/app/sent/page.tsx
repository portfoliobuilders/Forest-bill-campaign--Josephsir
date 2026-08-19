import { SentPage } from '@/components/SentPage'
import { resolveCampaignState } from '@/lib/campaign'

type Props = {
  searchParams: Promise<{ id?: string }>
}

export default async function SentRoute({ searchParams }: Props) {
  await resolveCampaignState()
  const params = await searchParams
  const submissionId = params.id?.trim() || null
  return <SentPage submissionId={submissionId} />
}
