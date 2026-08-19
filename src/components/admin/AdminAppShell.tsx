import { AdminShellClient } from '@/components/admin/AdminShellClient'
import type { CampaignListItem } from '@/lib/admin/context'

export function AdminAppShell({
  email,
  campaigns,
  selectedId,
  children,
}: {
  email: string
  campaigns: CampaignListItem[]
  selectedId: string | null
  children: React.ReactNode
}) {
  return (
    <AdminShellClient email={email} campaigns={campaigns} selectedId={selectedId}>
      {children}
    </AdminShellClient>
  )
}
