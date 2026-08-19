/** Middleware-safe path helpers. Do not import server-only modules here. */

export function canonicalizeAdminPathname(pathname: string): string | null {
  const parts = pathname.split('/')
  if (parts.length < 2) return null
  if (parts[1] && parts[1].toLowerCase() === 'admin' && parts[1] !== 'admin') {
    parts[1] = 'admin'
    return parts.join('/')
  }
  return null
}

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function isAdminPublicPath(pathname: string): boolean {
  return pathname === '/admin/login' || pathname.startsWith('/admin/auth/')
}
