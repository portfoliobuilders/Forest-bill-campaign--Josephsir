export const CAMPAIGN_SOURCES_BUCKET = 'campaign-sources'
export const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024

export const ALLOWED_SOURCE_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
] as const

export type AllowedSourceMime = (typeof ALLOWED_SOURCE_MIME)[number]

const MIME_BY_EXT: Record<string, AllowedSourceMime> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

export function isAllowedSourceMime(value: string | null | undefined): value is AllowedSourceMime {
  return ALLOWED_SOURCE_MIME.includes(value as AllowedSourceMime)
}

export function isSourceImageMime(value: string | null | undefined): boolean {
  return value === 'image/png' || value === 'image/jpeg' || value === 'image/webp'
}

export function mimeFromFileName(name: string): AllowedSourceMime | null {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXT[ext] ?? null
}

export function sanitizeSourceFileName(name: string): string {
  const trimmed = name.trim().split(/[/\\]/).pop() || 'clipping'
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return safe.slice(0, 80) || 'clipping'
}

export function parseOptionalHttpUrl(value: string): { ok: true; url: string | null } | { ok: false; error: string } {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true, url: null }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'Source URL must be a valid http(s) link.' }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Source URL must start with http:// or https://.' }
  }
  return { ok: true, url: parsed.toString() }
}

export function parsePublicationDate(value: string): { ok: true; date: string | null } | { ok: false; error: string } {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true, date: null }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, error: 'Publication date must be YYYY-MM-DD.' }
  }
  const [year, month, day] = trimmed.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { ok: false, error: 'Publication date is not a real calendar day.' }
  }
  return { ok: true, date: trimmed }
}

export function publicationDateForDisplay(value: string | null | undefined): string | null {
  if (!value) return null
  const day = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? `${day}T12:00:00+05:30` : value
}
