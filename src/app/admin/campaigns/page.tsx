import { CampaignsBoard } from '@/components/admin/CampaignsBoard'
import { fetchCampaignBoard } from '@/app/admin/campaign-actions'
import { requireAdminSession } from '@/lib/admin/auth'
import { assertAdminEnv } from '@/lib/env'
import { ErrorState } from '@/components/admin/AdminPrimitives'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Campaigns — Admin', robots: { index: false, follow: false } }
}

export default async function CampaignsPage() {
  assertAdminEnv()
  await requireAdminSession()
  try {
    const rows = await fetchCampaignBoard()
    return <CampaignsBoard rows={rows} />
  } catch {
    return <ErrorState title="Unable to load campaigns." body="Check the database connection and try again." />
  }
}
