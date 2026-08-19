'use client'

import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const

export function Progress({ step }: { step: 1 | 2 | 3 | 4 }) {
  const { lang } = useLang()
  const currentName = t(lang, STEP_KEYS[step - 1])

  return (
    <div className="mb-6">
      <ol className="flex gap-2" aria-label={currentName}>
        {STEP_KEYS.map((key, index) => {
          const n = (index + 1) as 1 | 2 | 3 | 4
          const current = n === step
          const done = n < step
          return (
            <li key={key} className="min-w-0 flex-1">
              <div
                className={cx(
                  'flex min-h-[44px] items-center justify-center rounded-md border px-1 text-sm font-medium transition-colors duration-150',
                  current && 'border-emerald-800 bg-emerald-800 text-white',
                  done && 'border-emerald-700 bg-emerald-50 text-emerald-900',
                  !current && !done && 'border-stone-300 bg-white text-stone-600',
                )}
                aria-current={current ? 'step' : undefined}
              >
                <span className="sr-only">{n}. </span>
                <span className="truncate">{t(lang, key)}</span>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-lg font-bold text-stone-900">
        {step}/4 — {currentName}
      </p>
    </div>
  )
}
