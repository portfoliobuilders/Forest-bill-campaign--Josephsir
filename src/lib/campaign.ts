import 'server-only'

import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

import { PREVIEW_COOKIE } from '@/lib/preview-cookie'
import { createServiceClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types/database'

export const DEFAULT_CAMPAIGN_SLUG = 'kerala-forest-amendment-2024'

export type CampaignState =
  | { state: 'live'; campaign: Campaign }
  | { state: 'preview'; campaign: Campaign }
  | { state: 'compose'; campaign: Campaign }
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

function inConsultationWindow(campaign: Campaign, now: Date): boolean {
  const t = now.getTime()
  return t >= new Date(campaign.opens_at).getTime() && t <= new Date(campaign.deadline_at).getTime()
}

export function publicCampaign(row: Campaign & { preview_token?: string | null }): Campaign {
  const campaign = { ...row }
  delete (campaign as { preview_token?: string | null }).preview_token
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

export async function getCampaignState(
  slug: string,
  previewToken: string | null | undefined,
): Promise<CampaignState> {
  try {
    const supabase = createServiceClient()
    const bySlug = await supabase.from('campaigns').select('*').eq('slug', slug).maybeSingle()
    const fallback = bySlug.data
      ? null
      : await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
    const row = (bySlug.data ?? fallback?.data ?? null) as CampaignRow | null
    const now = new Date()

    if (row) {
      const campaign = publicCampaign(row)
      if (row.is_active && inConsultationWindow(campaign, now)) {
        return { state: 'live', campaign }
      }
      if (!row.is_active && tokensMatch(row.preview_token, previewToken)) {
        return { state: 'preview', campaign }
      }
      return { state: 'compose', campaign }
    }

    if (previewToken) {
      const { data: candidates } = await supabase.from('campaigns').select('*').not('preview_token', 'is', null)
      for (const candidate of (candidates ?? []) as CampaignRow[]) {
        if (!candidate.is_active && tokensMatch(candidate.preview_token, previewToken)) {
          return { state: 'preview', campaign: publicCampaign(candidate) }
        }
      }
    }

    return { state: 'dormant' }
  } catch {
    return { state: 'dormant' }
  }
}

export async function resolveCampaignState(searchPreview?: string | null): Promise<CampaignState> {
  const token = await readPreviewToken(searchPreview)
  return getCampaignState(defaultSlug(), token)
}
