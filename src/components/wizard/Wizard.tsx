'use client'

import { useReducer, useState } from 'react'

import { Progress } from '@/components/wizard/Progress'
import { MAX_SELECTED_CLAUSES, Step1_ClauseSelector } from '@/components/wizard/Step1_ClauseSelector'
import { emptyRouting, Step2_DetailsForm } from '@/components/wizard/Step2_DetailsForm'
import { Step3_Verify } from '@/components/wizard/Step3_Verify'
import { Step4_Preview } from '@/components/wizard/Step4_Preview'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import type { DistrictOption } from '@/lib/demo-data'
import {
  createDetailsSchema,
  fieldErrorsFromZod,
  type DetailsFields,
  type FieldErrors,
} from '@/lib/details-schema'
import { t } from '@/lib/i18n'
import { normalizeIndianPhone } from '@/lib/phone'
import type { WizardMode } from '@/lib/wizard-mode'
import type { Campaign, ObjectionClause, WizardRouting } from '@/types/database'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

type Step = 1 | 2 | 3 | 4

type WizardState = {
  step: Step
  selectedClauseIds: string[]
  details: DetailsFields
  routing: WizardRouting
  submissionId: string | null
  verified: boolean
}

type WizardAction =
  | { type: 'toggle_clause'; id: string }
  | { type: 'set_details'; details: Partial<DetailsFields> }
  | { type: 'set_routing'; routing: WizardRouting }
  | { type: 'submit_details'; details: DetailsFields }
  | { type: 'next' }
  | { type: 'set_verified'; submissionId: string }
  | { type: 'back' }

const emptyDetails: DetailsFields = {
  fullName: '',
  addressLine: '',
  panchayat: '',
  district: '',
  pincode: '',
  phone: '',
  email: '',
  customText: '',
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'toggle_clause': {
      const selected = state.selectedClauseIds.includes(action.id)
      if (selected) {
        return {
          ...state,
          selectedClauseIds: state.selectedClauseIds.filter((id) => id !== action.id),
        }
      }
      if (state.selectedClauseIds.length >= MAX_SELECTED_CLAUSES) {
        return state
      }
      return { ...state, selectedClauseIds: [...state.selectedClauseIds, action.id] }
    }
    case 'set_details':
      return { ...state, details: { ...state.details, ...action.details } }
    case 'set_routing':
      return { ...state, routing: action.routing }
    case 'submit_details':
      return {
        ...state,
        details: action.details,
        step: state.step < 4 ? ((state.step + 1) as Step) : state.step,
      }
    case 'next':
      return { ...state, step: state.step < 4 ? ((state.step + 1) as Step) : state.step }
    case 'set_verified':
      return { ...state, submissionId: action.submissionId, verified: true }
    case 'back':
      return { ...state, step: state.step > 1 ? ((state.step - 1) as Step) : state.step }
    default:
      return state
  }
}

export function Wizard({
  campaign,
  clauses,
  districts,
  mode,
  testerEmail,
}: {
  campaign: Campaign
  clauses: ObjectionClause[]
  districts: DistrictOption[]
  mode: WizardMode
  testerEmail: string | null
}) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    selectedClauseIds: [],
    details: emptyDetails,
    routing: emptyRouting,
    submissionId: null,
    verified: false,
  })
  const [detailsErrors, setDetailsErrors] = useState<FieldErrors>({})
  const [clauseError, setClauseError] = useState(false)

  const selectedClauses = clauses
    .filter((clause) => state.selectedClauseIds.includes(clause.id))
    .sort((a, b) => a.sort_order - b.sort_order)

  function goNextFromStep1() {
    if (state.selectedClauseIds.length < 1) {
      setClauseError(true)
      return
    }
    setClauseError(false)
    dispatch({ type: 'next' })
  }

  function goNextFromStep2() {
    const parsed = createDetailsSchema(
      lang,
      districts.map((d) => d.value),
    ).safeParse(state.details)
    if (!parsed.success) {
      setDetailsErrors(fieldErrorsFromZod(parsed.error))
      return
    }
    const phone = normalizeIndianPhone(parsed.data.phone) ?? parsed.data.phone
    setDetailsErrors({})
    dispatch({ type: 'submit_details', details: { ...parsed.data, phone } })
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-stone-900">
        {lang === 'en' ? campaign.title_en : campaign.title_ml}
      </h1>

      <Progress step={state.step} />

      {state.step === 1 ? (
        <Step1_ClauseSelector
          clauses={clauses}
          selectedIds={state.selectedClauseIds}
          onToggle={(id) => {
            setClauseError(false)
            dispatch({ type: 'toggle_clause', id })
          }}
        />
      ) : null}

      {state.step === 2 ? (
        <Step2_DetailsForm
          details={state.details}
          districts={districts}
          errors={detailsErrors}
          routing={state.routing}
          allowSample={mode !== 'live'}
          onChange={(patch) => {
            setDetailsErrors((current) => {
              const next = { ...current }
              for (const key of Object.keys(patch) as Array<keyof DetailsFields>) {
                delete next[key]
              }
              return next
            })
            dispatch({ type: 'set_details', details: patch })
          }}
          onRoutingChange={(routing) => dispatch({ type: 'set_routing', routing })}
        />
      ) : null}

      {state.step === 3 ? (
        <Step3_Verify
          campaignSlug={campaign.slug}
          clauseCodes={selectedClauses.map((c) => c.code)}
          details={state.details}
          routing={state.routing}
          mode={mode}
          initialSubmissionId={state.submissionId}
          initiallyVerified={state.verified}
          onVerified={(id) => dispatch({ type: 'set_verified', submissionId: id })}
          onContinue={() => dispatch({ type: 'next' })}
        />
      ) : null}

      {state.step === 4 ? (
        <Step4_Preview
          campaign={campaign}
          clauses={selectedClauses}
          details={state.details}
          routing={state.routing}
          submissionId={state.submissionId}
          mode={mode}
          testerEmail={testerEmail}
        />
      ) : null}

      {state.step === 1 && clauseError ? (
        <p className="mt-3 text-sm text-red-700">{t(lang, 'minClausesHint')}</p>
      ) : null}

      <div className="mt-6 flex gap-3">
        {state.step > 1 ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'back' })}
            className={cx(
              'inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-md border border-stone-400 bg-white px-4 text-base font-semibold text-stone-900 transition-colors duration-150 hover:bg-stone-100',
              focusRing,
            )}
          >
            {t(lang, 'back')}
          </button>
        ) : null}

        {state.step === 1 ? (
          <button
            type="button"
            onClick={goNextFromStep1}
            className={cx(
              'inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-md bg-emerald-800 px-4 text-base font-semibold text-white transition-colors duration-150 hover:bg-emerald-900',
              focusRing,
            )}
          >
            {t(lang, 'continue')}
          </button>
        ) : null}

        {state.step === 2 ? (
          <button
            type="button"
            onClick={goNextFromStep2}
            className={cx(
              'inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-md bg-emerald-800 px-4 text-base font-semibold text-white transition-colors duration-150 hover:bg-emerald-900',
              focusRing,
            )}
          >
            {t(lang, 'continue')}
          </button>
        ) : null}
      </div>
    </main>
  )
}
