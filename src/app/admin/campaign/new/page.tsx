import { NewCampaignWizard } from '@/app/admin/campaign/new/NewCampaignWizard'
import { requireAdminSession } from '@/lib/admin/auth'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function NewCampaignPage() {
  assertAdminEnv()
  await requireAdminSession()
  return <NewCampaignWizard />
}
