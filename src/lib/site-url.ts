import 'server-only'

import { headers } from 'next/headers'

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function originFromUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    if (!url.hostname) return null
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

/**
 * Origin used for magic-link redirects.
 * On Vercel, never send users to localhost even if NEXT_PUBLIC_SITE_URL is local.
 */
export async function resolvePublicOrigin(): Promise<string | null> {
  const headerStore = await headers()
  const forwardedHost = headerStore.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProto = headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const host = forwardedHost || headerStore.get('host')?.split(',')[0]?.trim()
  const proto = forwardedProto || 'https'
  const fromRequest = host ? originFromUrl(`${proto}://${host}`) : null
  const fromEnv = originFromUrl(process.env.NEXT_PUBLIC_SITE_URL)
  const fromVercel = process.env.VERCEL_URL ? originFromUrl(`https://${process.env.VERCEL_URL}`) : null

  const onVercel = process.env.VERCEL === '1'
  for (const candidate of [fromRequest, fromEnv, fromVercel]) {
    if (!candidate) continue
    const hostname = new URL(candidate).hostname
    if (onVercel && isLocalHost(hostname)) continue
    return candidate.replace(/\/$/, '')
  }

  return null
}
