import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'
import { EmptyState } from '@/components/admin/AdminPrimitives'
import { requireAdminCampaign } from '@/lib/admin/context'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdminEnv } from '@/lib/env'
import type { ObjectionClause } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Email template — Admin', robots: { index: false, follow: false } }
}

export default async function EmailTemplatePage() {
  assertAdminEnv()
  const { campaign, email } = await requireAdminCampaign()
  if (!campaign) return <EmptyState title="No campaign selected." body="Create a campaign first." />

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('objection_clauses')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('is_active', true)
    .order('sort_order')

  return <EmailTemplateEditor campaign={campaign} clauses={(data ?? []) as ObjectionClause[]} adminEmail={email} />
}
