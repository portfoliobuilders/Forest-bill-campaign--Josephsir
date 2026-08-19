import 'server-only'

function missing(name: string): boolean {
  return !process.env[name]?.trim()
}

/**
 * Throws a useful server-side error when production-critical env is missing.
 * Never returns or logs secret values.
 */
export function assertAdminEnv(): void {
  const absent: string[] = []
  if (missing('NEXT_PUBLIC_SUPABASE_URL')) absent.push('NEXT_PUBLIC_SUPABASE_URL')
  if (missing('NEXT_PUBLIC_SUPABASE_ANON_KEY')) absent.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (missing('SUPABASE_SERVICE_ROLE_KEY')) absent.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing('ADMIN_EMAILS')) absent.push('ADMIN_EMAILS')
  if (missing('NEXT_PUBLIC_SITE_URL')) absent.push('NEXT_PUBLIC_SITE_URL')

  if (absent.length > 0) {
    throw new Error(`Admin cannot start: missing ${absent.join(', ')}`)
  }
}
