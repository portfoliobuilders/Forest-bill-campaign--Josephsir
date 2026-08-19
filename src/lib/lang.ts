import { defaultLang, type Lang } from '@/lib/i18n'

export const LANG_COOKIE = 'lang'

export function parseLang(value: string | undefined | null): Lang {
  return value === 'en' || value === 'ml' ? value : defaultLang
}

export function persistLangCookie(lang: Lang): void {
  document.cookie = `${LANG_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`
}
