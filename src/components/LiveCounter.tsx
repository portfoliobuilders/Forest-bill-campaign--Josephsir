'use client'

import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

export function LiveCounter({ count }: { count: number }) {
  const { lang } = useLang()

  return (
    <section className="pt-8" aria-live="polite">
      <p className="text-sm font-medium text-muted">{t(lang, 'counterLabel')}</p>
      <p className="mt-1 font-mono text-4xl tabular-nums text-ink">{count.toLocaleString('en-IN')}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t(lang, 'counterMethodologyLine')}</p>
    </section>
  )
}
