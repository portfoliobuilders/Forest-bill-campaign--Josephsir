'use client'

import Link from 'next/link'

import { NotifySignup } from '@/components/NotifySignup'
import { IconClock, IconList, IconPencil, IconPeople, IconPerson, IconPlane } from '@/components/ui/icons'
import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { demoCampaign } from '@/lib/demo-data'
import { formatCampaignDate } from '@/lib/format-date'
import { t, tReplace } from '@/lib/i18n'
import { btnPrimary } from '@/lib/ui'
import type { Campaign } from '@/types/database'

const howSteps = [
  { key: 'howStep1' as const, Icon: IconList },
  { key: 'howStep2' as const, Icon: IconPerson },
  { key: 'howStep3' as const, Icon: IconPlane },
]

export function HomePage({
  mode,
  campaign,
  daysLeft,
  confirmedCount,
}: {
  mode: 'live' | 'preview' | 'dormant'
  campaign: Campaign | null
  daysLeft: number
  confirmedCount: number
}) {
  const { lang } = useLang()

  const shown = campaign ?? demoCampaign
  const isLive = mode === 'live'
  const isClosed = !isLive || !shown.deadline_at || new Date(shown.deadline_at).getTime() < Date.now()
  const title = lang === 'en' ? shown.title_en : shown.title_ml
  const stake = lang === 'en' ? shown.homepage_intro_en || shown.summary_en : shown.homepage_intro_ml || shown.summary_ml
  const bullets = (lang === 'en' ? shown.explainer_en : shown.explainer_ml) ?? []
  const deadlineDate = formatCampaignDate(shown.deadline_at, lang)
  const gazetteDate = formatCampaignDate(shown.opens_at, lang)
  const ctaHref = '/objection'

  return (
    <PageContainer width="wide">
      <section className="max-w-3xl pt-2 sm:pt-6">
        <p className="font-mono text-xs text-muted sm:text-sm">
          {t(lang, 'gazetteBill')}
          <span aria-hidden="true"> · </span>
          {gazetteDate}
        </p>
        <h1 className="font-display mt-3 text-[1.85rem] text-ink sm:text-4xl md:text-[2.75rem]">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-body sm:text-lg">{stake}</p>
        {mode !== 'live' ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-body">{t(lang, 'demoClosedNote')}</p>
        ) : null}

        <Link href={ctaHref} className={cx(btnPrimary, 'mt-8 w-full sm:w-auto')}>
          <IconPencil className="size-4 shrink-0" />
          {t(lang, 'ctaStart')}
        </Link>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{t(lang, 'trustLine')}</p>
      </section>

      <div className="mt-10 grid border-t border-rule md:grid-cols-2">
        <section className="border-b border-rule py-8 md:border-r md:pr-10">
          <div className="flex items-start gap-3">
            <IconClock className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <p className="text-sm text-body">
                {isClosed ? t(lang, 'publicCommentsClosedOn') : t(lang, 'publicCommentsCloseOn')}
              </p>
              <p className="mt-1 font-mono text-2xl text-ink sm:text-3xl">{deadlineDate}</p>
              {isLive && !isClosed ? (
                <p className="mt-2 text-sm font-semibold text-accent">
                  {tReplace(lang, 'daysRemaining', { n: String(daysLeft) })}
                </p>
              ) : !isLive ? (
                <p className="mt-2 text-sm text-body">{t(lang, 'campaignInactive')}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="border-b border-rule py-8 md:pl-10" aria-live="polite">
          <div className="flex items-start gap-3">
            <IconPeople className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <p className="text-sm text-body">{t(lang, 'objectionsPrepared')}</p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-ink sm:text-3xl">
                {confirmedCount.toLocaleString('en-IN')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(lang, 'counterMethodologyLine')}</p>
              {mode !== 'live' ? (
                <p className="mt-1 text-sm leading-relaxed text-muted">{t(lang, 'demoCountNote')}</p>
              ) : null}
            </div>
          </div>
        </section>

        {bullets.length > 0 ? (
          <section className="border-b border-rule py-8 md:border-r md:border-b-0 md:pr-10">
            <h2 className="font-display text-xl text-ink sm:text-2xl">{t(lang, 'whatIsChanging')}</h2>
            <ol className="mt-5 space-y-4">
              {bullets.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="w-8 shrink-0 font-mono text-sm font-medium text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base leading-relaxed text-body">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className={cx('py-8 md:pl-10', bullets.length === 0 && 'md:col-span-2 md:pl-0')}>
          <h2 className="font-display text-xl text-ink sm:text-2xl">{t(lang, 'howItWorks')}</h2>
          <ol className="mt-5 space-y-5">
            {howSteps.map((step, index) => (
              <li key={step.key} className="flex gap-3">
                <span className="w-8 shrink-0 font-mono text-sm font-medium text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex min-w-0 items-start gap-2 text-base leading-relaxed text-body">
                  <step.Icon className="mt-1 size-4 shrink-0 text-accent" />
                  {t(lang, step.key)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-base leading-relaxed text-ink">{t(lang, 'howEmphasis')}</p>
        </section>
      </div>

      {mode === 'dormant' ? (
        <section className="mt-8 max-w-xl border-t border-rule pt-8">
          <NotifySignup />
        </section>
      ) : null}
    </PageContainer>
  )
}
