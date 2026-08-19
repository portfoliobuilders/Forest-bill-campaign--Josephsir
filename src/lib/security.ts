import 'server-only'

import { createHash } from 'crypto'

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

function envValue(parts: string[]): string {
  return String(process.env[parts.join('_')] ?? '').trim()
}
