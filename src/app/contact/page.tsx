import { ContactPageContent } from '@/components/ContactPageContent'
import { resolveCampaignState } from '@/lib/campaign'

export async function generateMetadata() {
  return {
    title: 'ബന്ധപ്പെടുക — ജനശബ്ദം',
    description: 'Privacy and grievance contact for Janashabdam.',
  }
}

export default async function ContactPage() {
  await resolveCampaignState()
  return <ContactPageContent />
}
