import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/admin/auth'

/**
 * Session + ADMIN_EMAILS allowlist are checked here independently of middleware.
 * Next.js is 15.5.23 (>= 15.2.3), which patches CVE-2025-29927 middleware bypass.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return <>{children}</>
}
