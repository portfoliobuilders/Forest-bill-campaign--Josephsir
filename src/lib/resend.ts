import 'server-only'

import { Resend } from 'resend'

const PLACEHOLDER_API_KEY = 're_xxxxxxxxx'

export const HELLO_WORLD_TO = 'portfoliobuilders.ind@gmail.com'

/**
 * Resend test sender. Replace with a verified domain via RESEND_FROM_EMAIL
 * once the domain is added at https://resend.com/domains.
 */
export const RESEND_TEST_FROM = 'onboarding@resend.dev'

export function getResendApiKey(): string | null {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey || apiKey === PLACEHOLDER_API_KEY) return null
  return apiKey
}

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || RESEND_TEST_FROM
}

export function getResend(): Resend | null {
  const apiKey = getResendApiKey()
  if (!apiKey) return null
  return new Resend(apiKey)
}
