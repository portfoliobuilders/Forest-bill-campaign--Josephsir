import { FaqPageContent } from '@/components/FaqPageContent'
import { resolveCampaignState } from '@/lib/campaign'

export async function generateMetadata() {
  return {
    title: 'ചോദ്യങ്ങൾ — ജനശബ്ദം',
    description: 'How Janashabdam works, how the count is produced, and how to delete your data.',
  }
}

export default async function FaqPage() {
  await resolveCampaignState()
  return <FaqPageContent />
}
