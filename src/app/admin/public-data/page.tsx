import { AdminCard, AdminPageHeader, EmptyState } from '@/components/admin/AdminPrimitives'
import { requireAdminCampaign } from '@/lib/admin/context'
import { publicCampaignSlug } from '@/lib/campaigns'
import { createClient } from '@supabase/supabase-js'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function generateMetadata() {
  return { title: 'Public data — Admin', robots: { index: false, follow: false } }
}

export default async function PublicDataAdminPage() {
  assertAdminEnv()
  const { campaign } = await requireAdminCampaign()
  if (!campaign) return <EmptyState title="No campaign selected." body="Create a campaign first." />

  const slug = campaign.slug || publicCampaignSlug()
  const supabase = publicClient()
  let stats = { confirmed: 0, opened: 0, districts: 0 }
  if (supabase) {
    const { data } = await supabase.rpc('campaign_stats', { p_slug: slug })
    if (data?.[0]) {
      const row = data[0] as { confirmed: number; opened: number; districts: number }
      stats = { confirmed: Number(row.confirmed), opened: Number(row.opened), districts: Number(row.districts) }
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Public data"
        description="What /data shows. Email, phone, address, pincode, comments, and IP hashes are never published."
      />
      <AdminCard title="Public aggregates">
        <ul className="space-y-2 text-sm">
          <li>Confirmed participation: {stats.confirmed.toLocaleString('en-IN')}</li>
          <li>Email opened (public): {stats.opened.toLocaleString('en-IN')}</li>
          <li>District reach: {stats.districts.toLocaleString('en-IN')}</li>
        </ul>
        <p className="mt-3 text-sm text-stone-600">
          Review the live page at <a href="/data" className="underline">/data</a>. Admin CRM remains private.
        </p>
      </AdminCard>
    </div>
  )
}
