import { AboutPageContent } from '@/components/AboutPageContent'
import { getDefaultCampaignSlug, resolveCampaignState } from '@/lib/campaign'
import { createServiceClient } from '@/lib/supabase/server'

export async function generateMetadata() {
  return {
    title: 'ഇതിനെക്കുറിച്ച് — ജനശബ്ദം',
    description: 'Janashabdam helps people compose a personal objection from their own email address.',
  }
}

export default async function AboutPage() {
  const state = await resolveCampaignState()
  let sourceUrl: string | null = null
  let campaignTitle: string | null = null

  if (state.state !== 'dormant') {
    sourceUrl = state.campaign.source_url
    campaignTitle = state.campaign.title_ml
  } else {
    try {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('campaigns')
        .select('source_url, title_ml')
        .eq('slug', getDefaultCampaignSlug())
        .maybeSingle()
      sourceUrl = (data?.source_url as string | undefined) ?? null
      campaignTitle = (data?.title_ml as string | undefined) ?? null
    } catch {
      sourceUrl = null
      campaignTitle = null
    }
  }

  return <AboutPageContent sourceUrl={sourceUrl} campaignTitle={campaignTitle} />
}
