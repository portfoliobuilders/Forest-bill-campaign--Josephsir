import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import { CampaignFlow, NoActiveCampaign } from '@/components/campaign/CampaignFlow'
import { resolveCampaignState, resolvePublicCampaign } from '@/lib/campaign'
import { loadObjectionData } from '@/lib/campaigns'
import { parseLang } from '@/lib/lang'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const query = await searchParams
  const state = await resolveCampaignState(query.preview, slug)
  const lang = parseLang((await cookies()).get('lang')?.value)
  if (state.state === 'dormant') {
    return { title: lang === 'en' ? 'Janashabdam' : 'ജനശബ്ദം' }
  }
  const campaign = state.campaign
  const title = lang === 'en' ? campaign.og_title_en || campaign.title_en : campaign.og_title_ml || campaign.title_ml
  const description =
    lang === 'en' ? campaign.og_description_en || campaign.summary_en : campaign.og_description_ml || campaign.summary_ml
  return {
    title,
    description,
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
  const preview = query.preview ? `?preview=${encodeURIComponent(query.preview)}` : ''
  const state = await resolveCampaignState(query.preview, slug)
  if (state.state === 'dormant') {
    const active = await resolvePublicCampaign(query.preview)
    if (active.state !== 'dormant' && active.campaign.slug !== slug) {
      redirect(`/campaign/${active.campaign.slug}${preview}`)
    }
    return <NoActiveCampaign />
  }
  const data = await loadObjectionData(state)
  if (!data) return <NoActiveCampaign />
  const view =
    state.state === 'live' || state.state === 'preview' || state.state === 'inactive' || state.state === 'expired'
      ? state.state
      : 'expired'
  return (
    <CampaignFlow
      campaign={data.campaign}
      clauses={data.clauses}
      formFields={data.formFields}
      districts={data.districts}
      mode={data.mode}
      view={view}
    />
  )
}
