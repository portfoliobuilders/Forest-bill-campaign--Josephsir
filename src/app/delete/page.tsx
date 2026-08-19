import { DeletePageContent } from '@/components/DeletePageContent'
import { resolveCampaignState } from '@/lib/campaign'

export async function generateMetadata() {
  return {
    title: 'വിവരം മായ്ക്കുക — ജനശബ്ദം',
    description: 'Request deletion of your data under the DPDP Act 2023.',
    robots: { index: false, follow: true },
  }
}

export default async function DeletePage() {
  await resolveCampaignState()
  return <DeletePageContent />
}
