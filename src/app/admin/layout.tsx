import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { AdminForbidden } from '@/components/admin/AdminForbidden'
import { getAdminAccess } from '@/lib/admin/auth'
import { isAdminPublicPath } from '@/lib/admin/paths'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Authoritative admin authorization. Middleware is only a convenience layer.
 * Login and auth-callback stay reachable; missing session is a redirect, not a 404.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers()
  const pathname = headerStore.get('x-pathname') ?? ''
  const publicPath = headerStore.get('x-admin-public') === '1' || isAdminPublicPath(pathname)

  const access = await getAdminAccess()

  if (publicPath) {
    if (pathname === '/admin/login' && access.status === 'authorized') {
      redirect('/admin')
    }
    return <div className="min-h-dvh bg-stone-100">{children}</div>
  }

  if (access.status === 'unauthenticated') {
    redirect('/admin/login')
  }

  if (access.status === 'forbidden') {
    return (
      <div className="min-h-dvh bg-stone-100">
        <AdminForbidden email={access.email} />
      </div>
    )
  }

  return <div className="min-h-dvh bg-stone-100">{children}</div>
}
