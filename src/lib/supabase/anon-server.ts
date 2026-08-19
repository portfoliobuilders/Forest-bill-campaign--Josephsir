import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Anon key, server-only. Never use this to read submissions or preview_token. */
export function createAnonServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url?.trim() || !anon?.trim()) return null
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
