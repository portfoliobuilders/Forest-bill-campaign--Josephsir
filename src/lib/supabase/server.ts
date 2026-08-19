import 'server-only'

import { createClient } from '@supabase/supabase-js'

function requiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/** Service-role client. Server-only. Never import this from client code. */
export function createServiceClient() {
  return createClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
