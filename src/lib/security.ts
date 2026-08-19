import 'server-only'

import { createHash, timingSafeEqual } from 'crypto'

type HeaderLike = { get(name: string): string | null }

export function getClientIp(headers: HeaderLike): string {
  const forwarded = headers.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  return forwarded.split(',')[0]?.trim() || 'unknown'
}

export function hashIp(ip: string): string {
  const salt = envValue(['IP', 'HASH', 'SALT'])
  return createHash('sha256').update(`${ip}${salt}`).digest('hex')
}

export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) {
    timingSafeEqual(a, a)
    return false
  }
  return timingSafeEqual(a, b)
}

function envValue(parts: string[]): string {
  return String(process.env[parts.join('_')] ?? '').trim()
}

export function isTurnstileConfigured(): boolean {
  return Boolean(envValue(['NEXT_PUBLIC', 'TURNSTILE', 'SITE', 'KEY']) && envValue(['TURNSTILE', 'SECRET', 'KEY']))
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = envValue(['TURNSTILE', 'SECRET', 'KEY'])
  if (!secret || !token.trim()) return false

  try {
    const body = new URLSearchParams()
    body.set('secret', secret)
    body.set('response', token)
    if (ip && ip !== 'unknown') body.set('remoteip', ip)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
