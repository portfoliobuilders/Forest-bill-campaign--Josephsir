'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { getClientIp, hashIp } from '@/lib/security'
import { createServiceClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/submission-types'

const emailSchema = z.email()

export async function signupNotify(formData: FormData): Promise<ActionResult<{ saved: true }>> {
  const parsed = emailSchema.safeParse(String(formData.get('email') ?? '').trim())
  if (!parsed.success) {
    return { ok: false, error: 'invalid_email' }
  }

  const headerStore = await headers()
  const ipHash = hashIp(getClientIp(headerStore))

  try {
    const supabase = createServiceClient()
    const { data: allowed, error: rateError } = await supabase.rpc('bump_rate_limit', {
      p_bucket: 'notify',
      p_identifier: ipHash,
      p_limit: 5,
    })
    if (rateError || allowed !== true) {
      return { ok: false, error: 'rate_limit' }
    }

    const { error } = await supabase.from('notify_signups').insert({ email: parsed.data })
    if (error && error.code !== '23505') {
      return { ok: false, error: 'notify_failed' }
    }
    return { ok: true, data: { saved: true } }
  } catch {
    return { ok: false, error: 'notify_failed' }
  }
}
