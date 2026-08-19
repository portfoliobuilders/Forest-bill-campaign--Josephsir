import { SentPage } from '@/components/SentPage'
import { resolveCampaignState } from '@/lib/campaign'

type Props = {
  searchParams: Promise<{ id?: string; preview?: string }>
}

export default async function SentRoute({ searchParams }: Props) {
  const params = await searchParams
  await resolveCampaignState(params.preview)
  const submissionId = params.id?.trim() || null
  return <SentPage submissionId={submissionId} />
}
