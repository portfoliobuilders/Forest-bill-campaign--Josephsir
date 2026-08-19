import { redirect } from 'next/navigation'

import { AdminForbidden } from '@/components/admin/AdminForbidden'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { getAdminAccess } from '@/lib/admin/auth'

export async function generateMetadata() {
  return { title: 'Admin — ജനശബ്ദം', robots: { index: false, follow: false } }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const access = await getAdminAccess()
  if (access.status === 'authorized') {
    redirect('/admin')
  }
  if (access.status === 'forbidden') {
    return <AdminForbidden email={access.email} />
  }

  const params = await searchParams
  return <AdminLoginForm errorCode={params.error ?? null} />
}
