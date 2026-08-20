import { notFound } from 'next/navigation'

import { CampaignFlow, NoActiveCampaign } from '@/components/campaign/CampaignFlow'
import { aiServerConfigured } from '@/lib/ai/provider'
import { resolveCampaignState } from '@/lib/campaign'
import { loadObjectionData } from '@/lib/campaigns'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const query = await searchParams
  const state = await resolveCampaignState(query.preview, slug)
  if (state.state === 'dormant') {
    return { title: 'Janashabdam' }
  }
  const campaign = state.campaign
  return {
    title: campaign.og_title_ml || campaign.title_ml,
    description: campaign.og_description_ml || campaign.summary_ml,
    openGraph: {
      title: campaign.og_title_en || campaign.title_en,
      description: campaign.og_description_en || campaign.summary_en,
      images: campaign.social_image_url ? [{ url: campaign.social_image_url }] : undefined,
    },
  }
}

export default async function CampaignPage({ params, searchParams }: Props) {
  const { slug } = await params
  const query = await searchParams
  const state = await resolveCampaignState(query.preview, slug)
  if (state.state === 'dormant') {
    notFound()
  }
  const data = await loadObjectionData(state)
  if (!data) return <NoActiveCampaign />
  const view = state.state === 'live' || state.state === 'preview' || state.state === 'inactive' || state.state === 'expired' ? state.state : 'expired'
  return (
    <CampaignFlow
      campaign={data.campaign}
      clauses={data.clauses}
      formFields={data.formFields}
      districts={data.districts}
      mode={data.mode}
      view={view}
      aiConfigured={aiServerConfigured()}
    />
  )
}
