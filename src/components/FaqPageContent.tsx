'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

const FAQ_ITEMS = [
  ['faq1q', 'faq1a'],
  ['faq2q', 'faq2a'],
  ['faq3q', 'faq3a'],
  ['faq4q', 'faq4a'],
  ['faq5q', 'faq5a'],
] as const

export function FaqPageContent() {
  const { lang } = useLang()

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'faqTitle')}</h1>
      <dl className="mt-8 space-y-8">
        {FAQ_ITEMS.map(([q, a]) => (
          <div key={q}>
            <dt className="text-lg font-semibold text-ink">{t(lang, q)}</dt>
            <dd className="mt-2 text-base leading-relaxed text-body">{t(lang, a)}</dd>
          </div>
        ))}
      </dl>
    </PageContainer>
  )
}
