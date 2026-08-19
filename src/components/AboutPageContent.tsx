'use client'

import Link from 'next/link'

import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'

export function AboutPageContent({
  sourceUrl,
  campaignTitle,
}: {
  sourceUrl: string | null
  campaignTitle: string | null
}) {
  const { lang } = useLang()

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'aboutTitle')}</h1>
      <p className="mt-4 text-base leading-relaxed text-body">{t(lang, 'aboutBody')}</p>
      <p className="mt-4 text-base leading-relaxed text-body">{t(lang, 'aboutWho')}</p>
      <p className="mt-4 text-base leading-relaxed text-body">{t(lang, 'aboutCount')}</p>

      <section className="mt-8 rounded-[8px] border border-rule bg-raised p-4">
        <h2 className="text-base font-semibold text-ink">{t(lang, 'aboutSource')}</h2>
        {sourceUrl ? (
          <p className="mt-2 text-base leading-relaxed">
            {campaignTitle ? <span className="block font-medium">{campaignTitle}</span> : null}
            <a
              href={sourceUrl}
              className={`mt-1 inline-block break-all text-accent underline ${focusRing}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {sourceUrl}
            </a>
          </p>
        ) : (
          <p className="mt-2 text-base text-body">{t(lang, 'aboutSourceMissing')}</p>
        )}
      </section>

      <p className="mt-8 text-sm text-muted">{t(lang, 'notOfficial')}</p>
      <p className="mt-4">
        <Link href="/faq" className={`text-sm font-medium text-accent underline ${focusRing}`}>
          {t(lang, 'footerFaq')}
        </Link>
      </p>
    </PageContainer>
  )
}
