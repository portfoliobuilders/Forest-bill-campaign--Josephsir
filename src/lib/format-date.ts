import type { Lang } from '@/lib/i18n'

const ZONE = 'Asia/Kolkata'

export function formatCampaignDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'ml' ? 'ml-IN' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: ZONE,
  }).format(new Date(iso))
}
