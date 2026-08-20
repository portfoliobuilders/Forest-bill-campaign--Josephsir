import { redirect } from 'next/navigation'

import { createEmptyCampaign } from '@/app/admin/campaign-actions'
import { requireAdminSession } from '@/lib/admin/auth'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function NewCampaignPage() {
  assertAdminEnv()
  await requireAdminSession()
  const result = await createEmptyCampaign()
  if (result.ok && result.id) redirect(`/admin/campaigns/${result.id}`)
  redirect('/admin/campaigns')
}
