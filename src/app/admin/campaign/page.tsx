import { redirect } from 'next/navigation'

import { fetchCampaignBoard } from '@/app/admin/campaign-actions'

export default async function AdminCampaignRedirectPage() {
  const board = await fetchCampaignBoard()
  const preferred =
    board.find((c) => c.status === 'active') ?? board.find((c) => c.status === 'draft') ?? board[0]

  if (preferred) {
    redirect(`/admin/campaigns/${preferred.id}`)
  }

  redirect('/admin/campaigns')
}
