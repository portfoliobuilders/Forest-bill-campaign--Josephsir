import { EmptyState } from '@/components/admin/AdminPrimitives'
import { RequestsView } from '@/app/admin/requests/RequestsView'
import { requireAdminSession } from '@/lib/admin/auth'
import { fetchDeletionRequests, fetchNotifySignups } from '@/lib/admin/queries'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Data requests — Admin', robots: { index: false, follow: false } }
}

export default async function RequestsPage() {
  assertAdminEnv()
  await requireAdminSession()
  const [deletionRequests, notifySignups] = await Promise.all([fetchDeletionRequests(), fetchNotifySignups()])
  if (deletionRequests.length === 0 && notifySignups.length === 0) {
    return (
      <>
        <EmptyState title="No data requests yet." body="Deletion requests and notify signups will appear here." />
        <RequestsView deletionRequests={deletionRequests} notifySignups={notifySignups} />
      </>
    )
  }
  return <RequestsView deletionRequests={deletionRequests} notifySignups={notifySignups} />
}
