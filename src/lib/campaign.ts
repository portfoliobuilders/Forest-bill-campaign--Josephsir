import 'server-only'

import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

import { defaultBodyTemplate } from '@/lib/email-template'
import { PREVIEW_COOKIE } from '@/lib/preview-cookie'
import { runtimeEnv } from '@/lib/runtime-env'
import { createServiceClient } from '@/lib/supabase/server'
import type { Campaign, PublishStatus } from '@/types/database'

export const DEFAULT_CAMPAIGN_SLUG = 'kerala-forest-amendment-2024'

export type CampaignState =
  | { state: 'live'; campaign: Campaign }
  | { state: 'preview'; campaign: Campaign }
  | { state: 'dormant' }

type CampaignRow = Campaign & { preview_token: string | null }

function defaultSlug(): string {
  return process.env.CAMPAIGN_SLUG?.trim() || DEFAULT_CAMPAIGN_SLUG
}

function tokensMatch(stored: string | null | undefined, provided: string | null | undefined): boolean {
  if (!stored || !provided) return false
  const a = Buffer.from(stored)
  const b = Buffer.from(provided)
  if (a.length !== b.length) {
    timingSafeEqual(a, a)
    return false
  }
  return timingSafeEqual(a, b)
}

export function publicCampaign(row: Campaign & { preview_token?: string | null }): Campaign {
  const campaign = { ...row }
  delete (campaign as { preview_token?: string | null }).preview_token
  delete (campaign as { updated_by?: string | null }).updated_by
  if (!Array.isArray(campaign.recipient_emails) || campaign.recipient_emails.length === 0) {
    campaign.recipient_emails = campaign.recipient_email ? [campaign.recipient_email] : []
  }
  if (!Array.isArray(campaign.cc_emails)) {
    campaign.cc_emails = []
  }
  campaign.homepage_intro_ml = campaign.homepage_intro_ml || campaign.summary_ml
  campaign.homepage_intro_en = campaign.homepage_intro_en || campaign.summary_en
  campaign.body_template_ml = campaign.body_template_ml || defaultBodyTemplate('ml')
  campaign.body_template_en = campaign.body_template_en || defaultBodyTemplate('en')
  campaign.reference_url = campaign.reference_url ?? null
  campaign.explainer_ml = Array.isArray(campaign.explainer_ml) ? campaign.explainer_ml : []
  campaign.explainer_en = Array.isArray(campaign.explainer_en) ? campaign.explainer_en : []
  const status = campaign.publish_status as PublishStatus | undefined
  campaign.publish_status = status ?? (campaign.is_active ? 'live' : 'draft')
  return campaign
}

export function getDefaultCampaignSlug(): string {
  return defaultSlug()
}

export async function readPreviewToken(searchParam?: string | null): Promise<string | null> {
  const fromQuery = searchParam?.trim() || null
  if (fromQuery) return fromQuery
  const store = await cookies()
  return store.get(PREVIEW_COOKIE)?.value?.trim() || null
}

export function daysRemaining(deadlineAt: string, now = new Date()): number {
  const ms = new Date(deadlineAt).getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

async function getCampaignStateFromService(
  slug: string,
  previewToken: string | null | undefined,
): Promise<CampaignState> {
  const supabase = createServiceClient()
  const bySlug = await supabase.from('campaigns').select('*').eq('slug', slug).maybeSingle()
  if (bySlug.error) throw bySlug.error
  const fallback = bySlug.data
    ? null
    : await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (fallback?.error) throw fallback.error
  const row = (bySlug.data ?? fallback?.data ?? null) as CampaignRow | null

  if (row) {
    const campaign = publicCampaign(row)
    if (row.is_active) {
      return { state: 'live', campaign }
    }
    if (tokensMatch(row.preview_token, previewToken)) {
      return { state: 'preview', campaign }
    }
  }

  if (previewToken) {
    const { data: candidates, error } = await supabase.from('campaigns').select('*').not('preview_token', 'is', null)
    if (error) throw error
    for (const candidate of (candidates ?? []) as CampaignRow[]) {
      if (!candidate.is_active && tokensMatch(candidate.preview_token, previewToken)) {
        return { state: 'preview', campaign: publicCampaign(candidate) }
      }
    }
  }

  return { state: 'dormant' }
}

export async function getCampaignState(
  slug: string,
  previewToken: string | null | undefined,
): Promise<CampaignState> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    try {
      const fromService = await getCampaignStateFromService(slug, previewToken)
      if (fromService.state !== 'dormant') return fromService
    } catch {
      // Fall through to the anon RPC so a missing/broken service query cannot hide a live campaign.
    }
  }
}

export async function resolveCampaignState(searchPreview?: string | null): Promise<CampaignState> {
  const token = await readPreviewToken(searchPreview)
  return getCampaignState(defaultSlug(), token)
}
