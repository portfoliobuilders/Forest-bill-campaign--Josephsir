'use server'

import { requireAdminSession } from '@/lib/admin/auth'
import { fetchSubmissionDetail, type SubmissionDetail } from '@/lib/admin/queries'

export async function fetchSubmissionDetailAction(id: string): Promise<SubmissionDetail | null> {
  try {
    await requireAdminSession()
  } catch {
    return null
  }
  return fetchSubmissionDetail(id)
}
