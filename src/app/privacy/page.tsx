import { PrivacyPageContent } from '@/components/PrivacyPageContent'
import { resolveCampaignState } from '@/lib/campaign'

export async function generateMetadata() {
  return {
    title: 'സ്വകാര്യത — ജനശബ്ദം',
    description: 'DPDP Act 2023 privacy notice — what we collect, retention, and deletion rights.',
  }
}

export default async function PrivacyPage() {
  await resolveCampaignState()
  return <PrivacyPageContent />
}
