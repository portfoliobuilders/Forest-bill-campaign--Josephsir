import 'server-only'

import { createHash } from 'crypto'

type HeaderLike = { get(name: string): string | null }

export function getClientIp(headers: HeaderLike): string {
  const forwarded = headers.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  return forwarded.split(',')[0]?.trim() || 'unknown'
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? ''
  return createHash('sha256').update(`${ip}${salt}`).digest('hex')
}

export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || !token.trim()) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
