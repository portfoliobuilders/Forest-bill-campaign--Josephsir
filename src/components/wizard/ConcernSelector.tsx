'use client'

import { TextAreaField } from '@/components/ui/FormField'
import { IconInfo } from '@/components/ui/icons'
import { useLang } from '@/components/LanguageProvider'
import {
  campaignConcernConfig,
  customConcernCopy,
  isMultiSelect,
} from '@/lib/concern-selection'
import { cx } from '@/lib/cx'
import { MAX_CUSTOM_CHARS } from '@/lib/details-schema'
import { t, tReplace } from '@/lib/i18n'
import { btnGhost, focusRing } from '@/lib/ui'
import type { Campaign, ObjectionClause } from '@/types/database'

export function selectedCountLabel(lang: 'ml' | 'en', count: number): string {
  if (count === 1) return t(lang, 'concernsSelectedOne')
  return tReplace(lang, 'concernsSelectedCount', { n: String(count) })
}

export function ConcernSelector({
  campaign,
  clauses,
  selectedIds,
  customConcerns,
  customError,
  maxError,
  onSelect,
  onCustomChange,
  onAddCustom,
  onRemoveCustom,
}: {
  campaign: Campaign
  clauses: ObjectionClause[]
  selectedIds: string[]
  customConcerns: string[]
  customError?: string
  maxError?: boolean
  onSelect: (id: string) => void
  onCustomChange: (index: number, value: string) => void
  onAddCustom: () => void
  onRemoveCustom: (index: number) => void
}) {
  const { lang } = useLang()
  const config = campaignConcernConfig(campaign)
  const multi = isMultiSelect(config.mode)
  const customCopy = customConcernCopy(config, lang)
  const lastFilled = (customConcerns[customConcerns.length - 1] ?? '').trim().length > 0
  const canAddCustom = config.allowCustomConcern && lastFilled && customConcerns.length < 6
  const heading = multi ? t(lang, 'pickConcernsMultiple') : t(lang, 'pickConcerns')
  const lead = multi ? t(lang, 'concernsLeadMultiple') : t(lang, 'concernsLead')
  const maxHint =
    maxError && config.maxSelections != null
      ? tReplace(lang, 'maxClausesHint', { n: String(config.maxSelections) })
      : null

  return (
    <div className="overflow-x-hidden">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{heading}</h1>
      <p className="mt-2 text-base leading-relaxed text-body">{lead}</p>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {selectedCountLabel(lang, selectedIds.length)}
      </p>
      {maxHint ? (
        <p className="mt-2 text-sm text-amber-900" role="status">
          {maxHint}
        </p>
      ) : null}

      <fieldset className="mt-5">
        <legend className="sr-only">{heading}</legend>
        <ul className="space-y-3">
          {clauses.map((clause) => {
            const checked = selectedIds.includes(clause.id)
            const title = lang === 'en' ? clause.title_en : clause.title_ml
            const explain = lang === 'en' ? clause.explain_en : clause.explain_ml
            return (
              <li key={clause.id}>
                <div
                  className={cx(
                    'relative min-w-0 overflow-hidden rounded-[8px] border bg-raised transition-colors',
                    checked ? 'border-accent bg-accent-tint' : 'border-rule',
                  )}
                >
                  <label className={cx('flex min-w-0 cursor-pointer items-start gap-3 p-3', clause.full_url && 'pr-14')}>
                    <input
                      type={multi ? 'checkbox' : 'radio'}
                      name={multi ? undefined : 'predefinedConcern'}
                      checked={checked}
                      onChange={() => onSelect(clause.id)}
                      className={cx(
                        'mt-1 size-6 shrink-0 border-input-border accent-accent',
                        multi ? 'rounded-[4px]' : 'rounded-full',
                        focusRing,
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block break-words text-base font-bold text-ink">{title}</span>
                      <span className="mt-1 block break-words text-sm leading-relaxed text-body">{explain}</span>
                    </span>
                  </label>
                  {clause.full_url ? (
                    <a
                      href={clause.full_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx(
                        'absolute right-2 top-2 inline-flex size-11 shrink-0 items-center justify-center rounded-[5px] text-accent',
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
      </fieldset>

      {config.allowCustomConcern ? (
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
                      label={index === 0 ? customCopy.label : t(lang, 'addAnotherConcern')}
                      placeholder={index === 0 ? customCopy.placeholder : undefined}
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
      ) : null}
    </div>
  )
}
