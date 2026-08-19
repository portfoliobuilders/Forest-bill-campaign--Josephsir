import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { runtimeEnv } from '@/lib/runtime-env'

function requiredEnv(name: string): string {
  const value =
    runtimeEnv(name) || (name === 'NEXT_PUBLIC_SUPABASE_URL' ? runtimeEnv('SUPABASE_URL') : '')
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function serviceClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/** Service-role client if both URL and key are present. Server-only. */
export function createServiceClientOrNull() {
  const url = runtimeEnv('NEXT_PUBLIC_SUPABASE_URL') || runtimeEnv('SUPABASE_URL')
  const key = runtimeEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  return serviceClient(url, key)
}

/** Service-role client. Server-only. Never import this from client code. */
export function createServiceClient() {
  return serviceClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'))
}
