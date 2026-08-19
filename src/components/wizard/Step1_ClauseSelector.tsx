'use client'

import { IconInfo } from '@/components/ui/icons'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'
import type { ObjectionClause } from '@/types/database'

export const MAX_SELECTED_CLAUSES = 6

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
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'pickConcerns')}</h1>
      <p className="mt-2 text-base leading-relaxed text-body">{t(lang, 'concernsLead')}</p>
      <p className="mt-2 text-sm text-muted">
        {selectedIds.length} {t(lang, 'selected')}
      </p>
      {atMax ? <p className="mt-2 text-sm text-amber-900">{t(lang, 'maxClausesHint')}</p> : null}

      <ul className="mt-5 space-y-3">
        {clauses.map((clause) => {
          const checked = selectedIds.includes(clause.id)
          const disabled = atMax && !checked
          const title = lang === 'en' ? clause.title_en : clause.title_ml
          const explain = lang === 'en' ? clause.explain_en : clause.explain_ml
          return (
            <li key={clause.id}>
              <div
                className={cx(
                  'flex items-start gap-3 rounded-[8px] border bg-raised p-3 transition-colors',
                  checked ? 'border-accent bg-accent-tint' : 'border-rule',
                  disabled && 'opacity-50',
                )}
              >
                <label className={cx('flex min-w-0 flex-1 cursor-pointer gap-3', disabled && 'cursor-not-allowed')}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(clause.id)}
                    className={cx(
                      'mt-1 size-6 shrink-0 rounded-[4px] border-input-border accent-accent',
                      focusRing,
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-ink">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-body">{explain}</span>
                  </span>
                </label>
                {clause.full_url ? (
                  <a
                    href={clause.full_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cx(
                      'inline-flex size-11 shrink-0 items-center justify-center rounded-[5px] text-accent',
                      focusRing,
                    )}
                    aria-label={t(lang, 'concernMoreInfo')}
                  >
                    <IconInfo />
                  </a>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
