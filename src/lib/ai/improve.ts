import 'server-only'

import { createGeminiProvider } from '@/lib/ai/gemini'
import { aiApiKey, generateImprovedConcern, resolveAiProvider } from '@/lib/ai/provider'
import type { AiImproveResult } from '@/lib/ai/types'
import { parseFeatureSettings } from '@/lib/campaign-features'
import { getClientIp, hashIp } from '@/lib/security'
import { createServiceClientOrNull } from '@/lib/supabase/server'
import type { Campaign, ObjectionClause } from '@/types/database'
import { concernBody, concernTitle } from '@/lib/compose-concerns'

const MAX_CONCERN_CHARS = 2500

function monthKey(day: string): string {
  return day.slice(0, 7)
}

async function withinCampaignQuota(campaignId: string, daily: number, monthly: number): Promise<boolean> {
  const supabase = createServiceClientOrNull()
  if (!supabase) return true
  const today = new Date().toISOString().slice(0, 10)
  const month = monthKey(today)
  const { data: todayRow } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('campaign_id', campaignId)
    .eq('period_day', today)
    .maybeSingle()
  if ((todayRow?.count as number | undefined ?? 0) >= daily) return false
  const { data: monthRows } = await supabase
    .from('ai_usage')
    .select('count, period_day')
    .eq('campaign_id', campaignId)
    .gte('period_day', `${month}-01`)
  const monthTotal = (monthRows ?? []).reduce((sum, row) => sum + Number(row.count ?? 0), 0)
  return monthTotal < monthly
}

async function bumpCampaignQuota(campaignId: string): Promise<void> {
  const supabase = createServiceClientOrNull()
  if (!supabase) return
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('ai_usage')
    .select('id, count')
    .eq('campaign_id', campaignId)
    .eq('period_day', today)
    .maybeSingle()
  if (data?.id) {
    await supabase.from('ai_usage').update({ count: Number(data.count ?? 0) + 1 }).eq('id', data.id)
    return
  }
  await supabase.from('ai_usage').insert({ campaign_id: campaignId, period_day: today, count: 1 })
}

export async function improveCampaignConcern(args: {
  campaignId: string
  concernId: string
  language: 'ml' | 'en'
  ipHash?: string
  forceLive?: boolean
}): Promise<AiImproveResult> {
  const supabase = createServiceClientOrNull()
  if (!supabase) return { ok: false, error: 'unavailable' }

  const [{ data: campaignRow }, { data: clauseRow }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', args.campaignId).maybeSingle(),
    supabase.from('objection_clauses').select('*').eq('id', args.concernId).eq('campaign_id', args.campaignId).maybeSingle(),
  ])
  if (!campaignRow || !clauseRow) return { ok: false, error: 'invalid' }

  const campaign = campaignRow as Campaign
  const clause = clauseRow as ObjectionClause
  const features = parseFeatureSettings(campaign.feature_settings)
  const cached = args.language === 'en' ? clause.ai_body_en : clause.ai_body_ml
  const status = args.language === 'en' ? clause.ai_body_en_status : clause.ai_body_ml_status
  if (!args.forceLive && status === 'approved' && cached?.trim()) {
    return { ok: true, body: cached.trim(), cached: true }
  }

  if (!args.forceLive && !features.enable_ai_mail) {
    return { ok: false, error: 'disabled' }
  }

  let provider = resolveAiProvider(features.ai_provider, features.ai_model)
  if (!provider && args.forceLive) {
    const key = aiApiKey()
    if (key) provider = createGeminiProvider(key, features.ai_model)
  }
  if (!provider) return { ok: false, error: 'unavailable' }

  if (args.ipHash) {
    const { data: allowed, error } = await supabase.rpc('bump_rate_limit', {
      p_bucket: 'ai_mail',
      p_identifier: args.ipHash,
      p_limit: 8,
    })
    if (!error && allowed === false) return { ok: false, error: 'quota' }
  }

  if (!args.forceLive) {
    const okQuota = await withinCampaignQuota(args.campaignId, features.ai_daily_limit, features.ai_monthly_limit)
    if (!okQuota) return { ok: false, error: 'quota' }
  }

  const title = concernTitle(clause, args.language)
  const body = concernBody(clause, args.language).slice(0, MAX_CONCERN_CHARS)

  try {
    const improved = await generateImprovedConcern(provider, {
      language: args.language,
      campaignTitle: args.language === 'en' ? campaign.title_en : campaign.title_ml,
      concernTitle: title,
      concernBody: body,
    })
    if (!improved.trim()) return { ok: false, error: 'invalid' }
    if (!args.forceLive) await bumpCampaignQuota(args.campaignId)
    return { ok: true, body: improved.trim(), cached: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'quota') return { ok: false, error: 'quota' }
    if (message === 'timeout') return { ok: false, error: 'timeout' }
    return { ok: false, error: 'unavailable' }
  }
}

export async function hashRequestIp(headers: Headers): Promise<string> {
  return hashIp(getClientIp(headers))
}
