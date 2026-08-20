'use client'

import { IconCheck } from '@/components/ui/icons'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

const STEPS = [
  { n: 1, key: 'stepCampaign' as const },
  { n: 2, key: 'stepConcern' as const },
  { n: 3, key: 'stepYourDetails' as const },
  { n: 4, key: 'stepReview' as const },
  { n: 5, key: 'stepEmail' as const },
]

export function CampaignProgress({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  const { lang } = useLang()

  return (
    <nav className="mb-8" aria-label={t(lang, STEPS[step - 1]?.key ?? 'stepCampaign')}>
      <ol className="flex items-start">
        {STEPS.map((item, index) => {
          const current = step === item.n
          const done = step > item.n
          const last = index === STEPS.length - 1
          return (
            <li key={item.key} className={cx('flex min-w-0', last ? 'flex-none' : 'flex-1')}>
              <div className="flex min-w-0 flex-col items-center text-center">
                <span
                  className={cx(
                    'inline-flex size-8 items-center justify-center rounded-full border text-sm font-semibold',
                    current && 'border-accent bg-accent text-white',
                    done && 'border-accent bg-accent text-white',
                    !current && !done && 'border-rule bg-raised text-muted',
                  )}
                  aria-current={current ? 'step' : undefined}
                >
                  {done ? <IconCheck className="size-3.5" /> : item.n}
                </span>
                <span
                  className={cx(
                    'mt-2 max-w-[4.2rem] text-[11px] leading-snug sm:max-w-none sm:text-sm',
                    current && 'font-semibold text-accent',
                    done && 'text-accent',
                    !current && !done && 'text-muted',
                  )}
                >
                  {t(lang, item.key)}
                </span>
              </div>
              {last ? null : (
                <div className={cx('mx-1 mt-4 h-px min-w-2 flex-1 sm:mx-2', done ? 'bg-accent' : 'bg-rule')} aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
