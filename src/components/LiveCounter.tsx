'use client'

import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

export function LiveCounter({ count }: { count: number }) {
  const { lang } = useLang()

  return (
    <section className="pt-8" aria-live="polite">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-600">{t(lang, 'counterLabel')}</p>
      <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-900">{count.toLocaleString('en-IN')}</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{t(lang, 'counterMethodologyLine')}</p>
    </section>
  )
}
