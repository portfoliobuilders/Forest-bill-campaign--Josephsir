import { NextResponse } from 'next/server'
import { z } from 'zod'

import { improveCampaignConcern, hashRequestIp } from '@/lib/ai/improve'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  campaign_id: z.uuid(),
  concern_id: z.uuid(),
  language: z.enum(['ml', 'en']),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const ipHash = await hashRequestIp(request.headers)
  const result = await improveCampaignConcern({
    campaignId: parsed.data.campaign_id,
    concernId: parsed.data.concern_id,
    language: parsed.data.language,
    ipHash,
  })

  if (!result.ok) {
    const status = result.error === 'quota' ? 429 : result.error === 'invalid' ? 400 : 503
    return NextResponse.json(result, { status })
  }

  return NextResponse.json(result)
}
