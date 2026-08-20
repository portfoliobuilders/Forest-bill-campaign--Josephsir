import { AboutPageContent } from '@/components/AboutPageContent'
import { resolveCampaignState } from '@/lib/campaign'

export async function generateMetadata() {
  return {
    title: 'ഇതിനെക്കുറിച്ച് — ജനശബ്ദം',
    description: 'Janashabdam helps people compose a personal objection from their own email address.',
  }
}

export default async function AboutPage() {
  const state = await resolveCampaignState()
  const sourceUrl = state.state === 'dormant' ? null : state.campaign.source_url
  const campaignTitle = state.state === 'dormant' ? null : state.campaign.title_ml

  return <AboutPageContent sourceUrl={sourceUrl} campaignTitle={campaignTitle} />
}
