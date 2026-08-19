'use client'

import { IconCheck } from '@/components/ui/icons'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const

export function Progress({ step, omitVerify = false }: { step: 1 | 2 | 3 | 4; omitVerify?: boolean }) {
  const { lang } = useLang()
  const keys = omitVerify ? (['step1', 'step2', 'step4'] as const) : STEP_KEYS
  const currentName = t(lang, keys[Math.min(step, keys.length) - 1] ?? 'step1')

  return (
    <nav className="mb-8" aria-label={currentName}>
      <ol className="flex items-start">
        {keys.map((key, index) => {
          const n = (index + 1) as 1 | 2 | 3 | 4
          const current = omitVerify ? (step === 1 && index === 0) || (step === 2 && index === 1) || (step === 4 && index === 2) : n === step
          const done = omitVerify ? (step === 2 && index === 0) || (step === 4 && index < 2) : n < step
          const last = index === keys.length - 1
          return (
            <li key={key} className={cx('flex min-w-0', last ? 'flex-none' : 'flex-1')}>
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
                  {done ? <IconCheck className="size-3.5" /> : n}
                </span>
                <span
                  className={cx(
                    'mt-2 max-w-[4.8rem] text-xs leading-snug sm:max-w-none sm:text-sm',
                    current && 'font-semibold text-accent',
                    done && 'text-accent',
                    !current && !done && 'text-muted',
                  )}
                >
                  {t(lang, key)}
                </span>
              </div>
              {last ? null : (
                <div
                  className={cx('mx-1 mt-4 h-px min-w-3 flex-1 sm:mx-3', done ? 'bg-accent' : 'bg-rule')}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
