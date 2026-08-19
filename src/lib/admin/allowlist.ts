export function getAdminEmails(raw = process.env.ADMIN_EMAILS ?? ''): string[] {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | undefined | null, raw = process.env.ADMIN_EMAILS ?? ''): boolean {
  if (!email) return false
  const allowlist = getAdminEmails(raw)
  if (allowlist.length === 0) return false
  return allowlist.includes(email.trim().toLowerCase())
}
