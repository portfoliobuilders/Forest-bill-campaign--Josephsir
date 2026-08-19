'use server'

import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.email(),
  reason: z.string().max(500).optional(),
})

export async function submitDeletionRequest(
  input: z.infer<typeof schema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('deletion_requests').insert({
    email: parsed.data.email.trim(),
    reason: parsed.data.reason?.trim() || null,
  })

  if (error) return { ok: false, error: 'submit_failed' }
  return { ok: true }
}
