import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { runtimeEnv } from '@/lib/runtime-env'

/** Anon key, server-only. Never use this to read submissions or preview_token. */
export function createAnonServerClient(): SupabaseClient | null {
  const url = runtimeEnv('NEXT_PUBLIC_SUPABASE_URL') || runtimeEnv('SUPABASE_URL')
  const anon = runtimeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !anon) return null
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
