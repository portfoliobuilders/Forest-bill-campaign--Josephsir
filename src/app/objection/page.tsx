import { redirect } from 'next/navigation'

import { resolvePublicCampaign } from '@/lib/campaign'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ preview?: string }>
}

export default async function ObjectionRedirect({ searchParams }: Props) {
  const params = await searchParams
  const state = await resolvePublicCampaign(params.preview)
  if (state.state === 'dormant') redirect('/')
  const preview = params.preview ? `?preview=${encodeURIComponent(params.preview)}` : ''
  redirect(`/campaign/${state.campaign.slug}${preview}`)
}
