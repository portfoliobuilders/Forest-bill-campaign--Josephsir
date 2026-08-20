import 'server-only'

import { cookies } from 'next/headers'

import { requireAdminSession } from '@/lib/admin/auth'
import { statusFromLegacy } from '@/lib/campaign-status'
import { getDefaultCampaignSlug, publicCampaign } from '@/lib/campaign'
import { createServiceClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types/database'

export const ADMIN_CAMPAIGN_COOKIE = 'janashabdam_admin_campaign'

export type CampaignListItem = {
  id: string
  slug: string
  title_ml: string
  title_en: string
  publish_status: string
  status: string
  is_active: boolean
}

export async function listAdminCampaigns(): Promise<CampaignListItem[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, slug, title_ml, title_en, publish_status, status, is_active, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    title_ml: row.title_ml as string,
    title_en: row.title_en as string,
    publish_status: row.publish_status as string,
    status: statusFromLegacy(row),
    is_active: Boolean(row.is_active),
  }))
}

export async function resolveAdminCampaign(): Promise<{
  campaign: Campaign | null
  campaigns: CampaignListItem[]
}> {
  const campaigns = await listAdminCampaigns()
  const store = await cookies()
  const cookieId = store.get(ADMIN_CAMPAIGN_COOKIE)?.value
  let id = cookieId && campaigns.some((item) => item.id === cookieId) ? cookieId : null
  if (!id) {
    const slug = getDefaultCampaignSlug()
    id = campaigns.find((item) => item.slug === slug)?.id ?? campaigns.find((item) => item.is_active)?.id ?? campaigns[0]?.id ?? null
  }
  if (!id) return { campaign: null, campaigns }

  const supabase = createServiceClient()
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle()
  if (error || !data) return { campaign: null, campaigns }
  return { campaign: publicCampaign(data as Campaign), campaigns }
}

export async function requireAdminCampaign(): Promise<{
  email: string
  campaign: Campaign | null
  campaigns: CampaignListItem[]
}> {
  const session = await requireAdminSession()
  const resolved = await resolveAdminCampaign()
  return { email: session.email, ...resolved }
}
