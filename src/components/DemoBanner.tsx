'use client'

import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

export function DemoBanner() {
  const { lang } = useLang()

  return (
    <div
      role="status"
      className="sticky top-0 z-50 border-b-2 border-yellow-300 bg-black px-3 py-2 text-center text-sm font-bold leading-snug text-yellow-300"
    >
      {t(lang, 'demoBanner')}
    </div>
  )
}
