import 'server-only'

import { createHmac, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

import { ADMIN_PASSWORD_COOKIE } from '@/lib/admin/password-cookie'

const SESSION_MS = 60 * 60 * 12 * 1000

// One-way check for the emergency password requested to unblock admin.
// Plaintext is not stored. Prefer ADMIN_PASSWORD on Vercel when you rotate it.
const EMERGENCY_SALT_HEX = '7f9cf06fb0cfeef0486c4efcc784b089'
const EMERGENCY_HASH_HEX = 'b19470246489a499cc0b1f040e2255df65d1c6627dedd1e573ddee8c458a1620'

const EMERGENCY_EMAILS = new Set([
  'portfoliobuilders.ind@gmail.com',
  'athul7880@gmail.com',
])

function safeEqualBuffer(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    timingSafeEqual(a, a)
    return false
  }
  return timingSafeEqual(a, b)
}

function safeEqualString(a: string, b: string): boolean {
  return safeEqualBuffer(Buffer.from(a), Buffer.from(b))
}

function hmacSecret(): Buffer {
  const env = process.env.ADMIN_PASSWORD?.trim()
  if (env) return Buffer.from(env)
  return Buffer.from(EMERGENCY_HASH_HEX, 'hex')
}

function signPayload(payload: string): string {
  return createHmac('sha256', hmacSecret()).update(payload).digest('hex')
}

function passwordMatches(password: string): boolean {
  const envPassword = process.env.ADMIN_PASSWORD?.trim()
  if (envPassword && safeEqualString(password, envPassword)) return true

  const computed = scryptSync(password, Buffer.from(EMERGENCY_SALT_HEX, 'hex'), 32, {
    N: 16384,
    r: 8,
    p: 1,
  })
  return safeEqualBuffer(computed, Buffer.from(EMERGENCY_HASH_HEX, 'hex'))
}

export function isEmergencyAdminEmail(email: string): boolean {
  return EMERGENCY_EMAILS.has(email.trim().toLowerCase())
}

export function canUsePasswordLogin(email: string, isAllowlisted: boolean): boolean {
  return isAllowlisted || isEmergencyAdminEmail(email)
}

export async function readPasswordSession(): Promise<string | null> {
  const raw = (await cookies()).get(ADMIN_PASSWORD_COOKIE)?.value
  if (!raw) return null
  const dot = raw.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  if (!payload || !signature) return null
  if (!safeEqualString(signature, signPayload(payload))) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      e?: unknown
      x?: unknown
    }
    const email = typeof parsed.e === 'string' ? parsed.e.trim().toLowerCase() : ''
    const exp = typeof parsed.x === 'number' ? parsed.x : Number(parsed.x)
    if (!email || !Number.isFinite(exp) || Date.now() > exp) return null
    return email
  } catch {
    return null
  }
}

export async function writePasswordSession(email: string): Promise<void> {
  const exp = Date.now() + SESSION_MS
  const payload = Buffer.from(
    JSON.stringify({ e: email.trim().toLowerCase(), x: exp }),
    'utf8',
  ).toString('base64url')
  const signature = signPayload(payload)
  ;(await cookies()).set(ADMIN_PASSWORD_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: SESSION_MS / 1000,
  })
}

export async function clearPasswordSession(): Promise<void> {
  const store = await cookies()
  store.set(ADMIN_PASSWORD_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  })
}

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false
  return passwordMatches(password)
}
