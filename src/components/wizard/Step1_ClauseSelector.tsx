'use client'

import { TextAreaField } from '@/components/ui/FormField'
import { IconInfo } from '@/components/ui/icons'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import type { LetterMode } from '@/lib/compose'
import { MAX_CUSTOM_CHARS } from '@/lib/details-schema'
import { t } from '@/lib/i18n'
import { btnGhost, focusRing } from '@/lib/ui'
import type { ObjectionClause } from '@/types/database'

export const MAX_SELECTED_CLAUSES = 6

export function customConcernCount(customConcerns: string[]): number {
  return customConcerns.filter((text) => text.trim().length > 0).length
}

export function selectedConcernCount(selectedIds: string[], customConcerns: string[]): number {
  return selectedIds.length + customConcernCount(customConcerns)
}

export function flattenCustomConcerns(customConcerns: string[]): string {
  return customConcerns
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

export function Step1_ClauseSelector({
  clauses,
  selectedIds,
  customConcerns,
  customError,
  letterMode,
  onLetterMode,
  onToggle,
  onCustomChange,
  onAddCustom,
  onRemoveCustom,
}: {
  clauses: ObjectionClause[]
  selectedIds: string[]
  customConcerns: string[]
  customError?: string
  letterMode: LetterMode
  onLetterMode: (mode: LetterMode) => void
  onToggle: (id: string) => void
  onCustomChange: (index: number, value: string) => void
  onAddCustom: () => void
  onRemoveCustom: (index: number) => void
}) {
  const { lang } = useLang()
  const selectedCount = selectedConcernCount(selectedIds, customConcerns)
  const fullMode = letterMode === 'full'
  const atMax = !fullMode && selectedCount >= MAX_SELECTED_CLAUSES
  const lastFilled = (customConcerns[customConcerns.length - 1] ?? '').trim().length > 0
  const canAddCustom = !fullMode && selectedCount < MAX_SELECTED_CLAUSES && lastFilled

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'pickConcerns')}</h1>
      <p className="mt-2 text-base leading-relaxed text-body">{t(lang, 'concernsLead')}</p>

      <fieldset className="mt-5 space-y-3">
        <legend className="sr-only">{t(lang, 'pickConcerns')}</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-rule bg-raised p-3">
          <input
            type="radio"
            name="letterMode"
            checked={!fullMode}
            onChange={() => onLetterMode('selected')}
            className={cx('mt-1 size-6 shrink-0 accent-accent', focusRing)}
          />
          <span>
            <span className="block text-base font-bold text-ink">{t(lang, 'letterModeSelected')}</span>
            <span className="mt-1 block text-sm leading-relaxed text-body">{t(lang, 'letterModeSelectedHint')}</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-rule bg-raised p-3">
          <input
            type="radio"
            name="letterMode"
            checked={fullMode}
            onChange={() => onLetterMode('full')}
            className={cx('mt-1 size-6 shrink-0 accent-accent', focusRing)}
          />
          <span>
            <span className="block text-base font-bold text-ink">{t(lang, 'letterModeFull')}</span>
            <span className="mt-1 block text-sm leading-relaxed text-body">{t(lang, 'letterModeFullHint')}</span>
          </span>
        </label>
      </fieldset>

      <p className="mt-4 text-sm text-muted">
        {fullMode ? `${clauses.length} ${t(lang, 'selected')}` : `${selectedCount} ${t(lang, 'selected')}`}
      </p>
      {atMax ? <p className="mt-2 text-sm text-amber-900">{t(lang, 'maxClausesHint')}</p> : null}

      <ul className="mt-5 space-y-3">
        {clauses.map((clause) => {
          const checked = fullMode || selectedIds.includes(clause.id)
          const disabled = fullMode || (atMax && !checked)
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
                    onChange={() => {
                      if (!fullMode) onToggle(clause.id)
                    }}
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

      {fullMode ? null : (
        <>
          <ul className="mt-5 space-y-3">
            {customConcerns.map((text, index) => {
              const filled = text.trim().length > 0
              return (
                <li key={`custom-${index}`}>
                  <div
                    className={cx(
                      'rounded-[8px] border bg-raised p-3',
                      filled ? 'border-accent bg-accent-tint' : 'border-dashed border-accent',
                    )}
                  >
                    <TextAreaField
                      id={`customConcern-${index}`}
                      name={`customConcern-${index}`}
                      label={index === 0 ? t(lang, 'addCustomConcern') : t(lang, 'addAnotherConcern')}
                      value={text}
                      maxLength={MAX_CUSTOM_CHARS}
                      rows={4}
                      onChange={(event) => onCustomChange(index, event.target.value)}
                      hint={`${text.length}/${MAX_CUSTOM_CHARS} ${t(lang, 'charsUsed')}${index === 0 ? ` — ${t(lang, 'customConcernHint')}` : ''}`}
                      error={index === 0 ? customError : undefined}
                    />
                    {customConcerns.length > 1 ? (
                      <button type="button" onClick={() => onRemoveCustom(index)} className={cx(btnGhost, 'mt-3')}>
                        {t(lang, 'removeCustomConcern')}
                      </button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
          {canAddCustom ? (
            <button type="button" onClick={onAddCustom} className={cx(btnGhost, 'mt-3 w-full sm:w-auto')}>
              {t(lang, 'addAnotherConcern')}
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
