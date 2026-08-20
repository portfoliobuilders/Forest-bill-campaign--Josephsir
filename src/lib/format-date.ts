import type { Lang } from '@/lib/i18n'

const ZONE = 'Asia/Kolkata'

export function formatCampaignDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang === 'ml' ? 'ml-IN' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: ZONE,
  }).format(date)
}
