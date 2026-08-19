import { EmptyState } from '@/components/admin/AdminPrimitives'
import { SubmissionRecord } from '@/components/admin/SubmissionRecord'
import { requireAdminSession } from '@/lib/admin/auth'
import { fetchSubmissionDetail } from '@/lib/admin/queries'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  assertAdminEnv()
  await requireAdminSession()
  const { id } = await params
  const detail = await fetchSubmissionDetail(id)
  if (!detail) return <EmptyState title="Submission not found." body="It may have been removed." />
  return <SubmissionRecord detail={detail} />
}
