import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export async function generateMetadata() {
  return { title: 'Admin — ജനശബ്ദം', robots: { index: false, follow: false } }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return <AdminLoginForm errorCode={params.error ?? null} />
}
