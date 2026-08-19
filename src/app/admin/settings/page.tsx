import { SettingsForm } from '@/app/admin/settings/SettingsForm'
import { requireAdminSession } from '@/lib/admin/auth'
import { fetchSiteSettings } from '@/lib/admin/queries'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Settings — Admin', robots: { index: false, follow: false } }
}

export default async function SettingsPage() {
  assertAdminEnv()
  await requireAdminSession()
  const settings = await fetchSiteSettings()
  return <SettingsForm settings={settings} />
}
