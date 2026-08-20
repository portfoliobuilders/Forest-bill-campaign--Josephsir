export function uniqueEmails(emails: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of emails) {
    const email = raw?.trim() ?? ''
    if (!email) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(email)
  }
  return out
}
