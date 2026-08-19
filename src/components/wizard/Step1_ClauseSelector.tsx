'use client'

import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import type { ObjectionClause } from '@/types/database'

export const MAX_SELECTED_CLAUSES = 6

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function Step1_ClauseSelector({
  clauses,
  selectedIds,
  onToggle,
}: {
  clauses: ObjectionClause[]
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  const { lang } = useLang()
  const atMax = selectedIds.length >= MAX_SELECTED_CLAUSES

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">{t(lang, 'pickConcerns')}</h2>
      <p className="mt-1 text-base text-stone-700">
        {selectedIds.length} {t(lang, 'selected')}
      </p>
      {atMax ? <p className="mt-2 text-sm text-amber-800">{t(lang, 'maxClausesHint')}</p> : null}

      <ul className="mt-4 space-y-3">
        {clauses.map((clause) => {
          const checked = selectedIds.includes(clause.id)
          const disabled = atMax && !checked
          const title = lang === 'en' ? clause.title_en : clause.title_ml
          const explain = lang === 'en' ? clause.explain_en : clause.explain_ml
          return (
            <li key={clause.id}>
              <label
                className={cx(
                  'flex cursor-pointer gap-3 rounded-md border border-stone-300 bg-white p-3 transition-colors duration-150',
                  checked && 'border-emerald-800 bg-emerald-50',
                  disabled && 'cursor-not-allowed opacity-50',
                  !disabled && 'hover:border-emerald-700',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(clause.id)}
                  className={cx('mt-1 size-6 shrink-0 accent-emerald-800', focusRing)}
                />
                <span className="min-w-0">
                  <span className="block font-bold text-stone-900">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-stone-700">{explain}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
