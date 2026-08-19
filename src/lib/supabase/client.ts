import { createBrowserClient } from '@supabase/ssr'

function requiredPublicEnv(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/** Browser client. Anon key only. Must never receive the service-role key. */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    requiredPublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}
