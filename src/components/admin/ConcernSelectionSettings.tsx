'use client'

import { adminInput, adminLabel } from '@/components/admin/admin-ui'
import type { ConcernSelectionMode } from '@/lib/concern-selection'

export type ConcernSelectionDraft = {
  concern_selection_mode: ConcernSelectionMode
  max_concern_selections: number | null
  allow_custom_concern: boolean
  custom_concern_label_en: string
  custom_concern_label_ml: string
  custom_concern_placeholder_en: string
  custom_concern_placeholder_ml: string
}

const MAX_OPTIONS = [2, 3, 4, 5, 6] as const

export function ConcernSelectionSettings({
  value,
  onChange,
}: {
  value: ConcernSelectionDraft
  onChange: (patch: Partial<ConcernSelectionDraft>) => void
}) {
  const multiple = value.concern_selection_mode === 'multiple'

  return (
    <section className="space-y-4 rounded-md border border-stone-200 bg-white p-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Concern Selection Settings</h2>
        <p className="mt-1 text-sm text-stone-600">
          Controls how people pick predefined concerns. The optional free-text box is separate.
        </p>
      </div>

      <fieldset>
        <legend className={adminLabel}>Selection Type</legend>
        <div className="mt-2 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-stone-200 p-3">
            <input
              type="radio"
              name="concern_selection_mode"
              checked={value.concern_selection_mode === 'single'}
              onChange={() => onChange({ concern_selection_mode: 'single', max_concern_selections: null })}
              className="mt-1 size-4 accent-emerald-800"
            />
            <span>
              <span className="block text-sm font-medium text-stone-900">Single concern only</span>
              <span className="mt-1 block text-sm text-stone-600">
                Users can select only one predefined concern. Selecting another concern will replace the previous
                selection.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-stone-200 p-3">
            <input
              type="radio"
              name="concern_selection_mode"
              checked={value.concern_selection_mode === 'multiple'}
              onChange={() => onChange({ concern_selection_mode: 'multiple' })}
              className="mt-1 size-4 accent-emerald-800"
            />
            <span>
              <span className="block text-sm font-medium text-stone-900">Allow multiple concerns</span>
              <span className="mt-1 block text-sm text-stone-600">
                Users can select more than one predefined concern for this campaign.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {multiple ? (
        <label className={adminLabel}>
          Maximum concerns a user can select
          <select
            className={adminInput}
            value={value.max_concern_selections ?? ''}
            onChange={(event) => {
              const raw = event.target.value
              onChange({ max_concern_selections: raw ? Number(raw) : null })
            }}
          >
            <option value="">Unlimited</option>
            {MAX_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm">
        <span>
          <span className="block font-medium text-stone-900">Allow users to add their own concern</span>
          <span className="mt-1 block text-stone-600">
            Shows the free-text box below the predefined concerns. This is separate from predefined selection.
          </span>
        </span>
        <input
          type="checkbox"
          checked={value.allow_custom_concern}
          onChange={(event) => onChange({ allow_custom_concern: event.target.checked })}
          className="size-5 accent-emerald-800"
        />
      </label>

      {value.allow_custom_concern ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <label className={adminLabel}>
            Custom concern label — English
            <input
              className={adminInput}
              value={value.custom_concern_label_en}
              placeholder="Add your own concern"
              onChange={(event) => onChange({ custom_concern_label_en: event.target.value })}
            />
          </label>
          <label className={adminLabel}>
            Custom concern label — Malayalam
            <input
              className={adminInput}
              value={value.custom_concern_label_ml}
              placeholder="നിങ്ങളുടെ സ്വന്തം ആശങ്ക ചേർക്കുക"
              onChange={(event) => onChange({ custom_concern_label_ml: event.target.value })}
            />
          </label>
          <label className={adminLabel}>
            Custom concern placeholder — English
            <textarea
              className={`${adminInput} min-h-20 py-2`}
              value={value.custom_concern_placeholder_en}
              placeholder="If you have an additional concern that is not covered above, you can write it here."
              onChange={(event) => onChange({ custom_concern_placeholder_en: event.target.value })}
            />
          </label>
          <label className={adminLabel}>
            Custom concern placeholder — Malayalam
            <textarea
              className={`${adminInput} min-h-20 py-2`}
              value={value.custom_concern_placeholder_ml}
              placeholder="മുകളിൽ ഉൾപ്പെടുത്തിയിട്ടില്ലാത്ത മറ്റൊരു ആശങ്ക നിങ്ങൾക്കുണ്ടെങ്കിൽ ഇവിടെ എഴുതാം."
              onChange={(event) => onChange({ custom_concern_placeholder_ml: event.target.value })}
            />
          </label>
        </div>
      ) : null}
    </section>
  )
}

export function draftFromCampaign(campaign: {
  concern_selection_mode: ConcernSelectionMode
  max_concern_selections: number | null
  allow_custom_concern: boolean
  custom_concern_label_en: string | null
  custom_concern_label_ml: string | null
  custom_concern_placeholder_en: string | null
  custom_concern_placeholder_ml: string | null
}): ConcernSelectionDraft {
  return {
    concern_selection_mode: campaign.concern_selection_mode === 'multiple' ? 'multiple' : 'single',
    max_concern_selections: campaign.max_concern_selections,
    allow_custom_concern: campaign.allow_custom_concern !== false,
    custom_concern_label_en: campaign.custom_concern_label_en ?? '',
    custom_concern_label_ml: campaign.custom_concern_label_ml ?? '',
    custom_concern_placeholder_en: campaign.custom_concern_placeholder_en ?? '',
    custom_concern_placeholder_ml: campaign.custom_concern_placeholder_ml ?? '',
  }
}
