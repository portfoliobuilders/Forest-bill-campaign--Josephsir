'use client'

import Link from 'next/link'

import { LiveCounter } from '@/components/LiveCounter'
import { NotifySignup } from '@/components/NotifySignup'
import { SiteFooter } from '@/components/SiteFooter'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t, tReplace } from '@/lib/i18n'
import type { Campaign } from '@/types/database'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function HomePage({
  mode,
  campaign,
  daysLeft,
  confirmedCount,
}: {
  mode: 'live' | 'preview' | 'compose' | 'dormant'
  campaign: Campaign | null
  daysLeft: number
  confirmedCount: number
}) {
  const { lang } = useLang()
  const isDemo = mode === 'preview' || mode === 'compose'

  if ((mode === 'dormant' && !campaign) || !campaign) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-10">
        <h1 className="text-2xl font-bold text-stone-900">{t(lang, 'siteName')}</h1>
        <h2 className="mt-6 text-xl font-bold text-stone-900">{t(lang, 'dormantTitle')}</h2>
        <p className="mt-3 text-base leading-relaxed text-stone-700">{t(lang, 'dormantBody')}</p>
        <Link
          href="/demo"
          className={cx(
            'mt-6 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white hover:bg-emerald-900',
            focusRing,
          )}
        >
          {t(lang, 'tryDemo')}
        </Link>
        <NotifySignup />
        <SiteFooter />
      </main>
    )
  }

  const title = lang === 'en' ? campaign.title_en : campaign.title_ml
  const stake = lang === 'en' ? campaign.summary_en : campaign.summary_ml
  const bullets = (lang === 'en' ? campaign.explainer_en : campaign.explainer_ml) ?? []
  const ctaLabel = isDemo ? t(lang, 'ctaPreview') : t(lang, 'ctaStart')
  const ctaHref = isDemo ? '/demo' : '/objection'

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-6">
      <section className="min-h-[calc(100dvh-7rem)]">
        <h1 className="text-2xl font-bold leading-snug text-stone-900">{title}</h1>
        <p className="mt-3 text-base leading-relaxed text-stone-800">{stake}</p>
        {isDemo ? (
          <p className="mt-3 text-base font-medium leading-relaxed text-amber-900">{t(lang, 'demoClosedNote')}</p>
        ) : (
          <p className="mt-3 text-base font-semibold text-emerald-900">
            {tReplace(lang, 'daysRemaining', { n: String(daysLeft) })}
          </p>
        )}
        <Link
          href={ctaHref}
          className={cx(
            'mt-6 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white hover:bg-emerald-900',
            focusRing,
          )}
        >
          {ctaLabel}
        </Link>
      </section>

      {bullets.length > 0 ? (
        <section className="pt-2">
          <h2 className="text-xl font-bold text-stone-900">{t(lang, 'whatIsChanging')}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-stone-800">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {mode === 'live' ? <LiveCounter count={confirmedCount} /> : null}

      <section className="pt-8">
        <h2 className="text-xl font-bold text-stone-900">{t(lang, 'howItWorks')}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-stone-800">
          <li>{t(lang, 'howStep1')}</li>
          <li>{t(lang, 'howStep2')}</li>
          <li>{t(lang, 'howStep3')}</li>
        </ol>
        <p className="mt-4 text-base font-medium leading-relaxed text-stone-900">{t(lang, 'howEmphasis')}</p>
      </section>

      {isDemo ? <NotifySignup /> : null}

      <SiteFooter />
    </main>
  )
}
