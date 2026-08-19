'use client'

import { useReducer } from 'react'

import { PageContainer } from '@/components/ui/PageContainer'
import { IconChevronRight } from '@/components/ui/icons'
import { Progress } from '@/components/wizard/Progress'
import { MAX_SELECTED_CLAUSES, Step1_ClauseSelector } from '@/components/wizard/Step1_ClauseSelector'
import { emptyRouting, Step2_DetailsForm } from '@/components/wizard/Step2_DetailsForm'
import { Step3_Verify } from '@/components/wizard/Step3_Verify'
import { Step4_Preview } from '@/components/wizard/Step4_Preview'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { FOREST_BILL_SOURCE_URL, FOREST_BILL_VOLUNTEER_URL, type DistrictOption } from '@/lib/demo-data'
import {
  createDetailsSchema,
  fieldErrorsFromZod,
  type DetailsFields,
  type FieldErrors,
} from '@/lib/details-schema'
import { t } from '@/lib/i18n'
import { normalizeIndianPhone } from '@/lib/phone'
import { btnGhost, btnPrimary, focusRing } from '@/lib/ui'
import type { WizardMode } from '@/lib/wizard-mode'
import type { Campaign, ObjectionClause, WizardRouting } from '@/types/database'

type Step = 1 | 2 | 3 | 4

type WizardState = {
  step: Step
  selectedClauseIds: string[]
  details: DetailsFields
  routing: WizardRouting
  submissionId: string | null
  verified: boolean
  detailsErrors: FieldErrors
  clauseError: boolean
}

type WizardAction =
  | { type: 'toggle_clause'; id: string }
  | { type: 'set_details'; details: Partial<DetailsFields> }
  | { type: 'set_routing'; routing: WizardRouting }
  | { type: 'submit_details'; details: DetailsFields }
  | { type: 'details_invalid'; errors: FieldErrors }
  | { type: 'next' }
  | { type: 'clause_error' }
  | { type: 'set_verified'; submissionId: string }
  | { type: 'goto'; step: Step }
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
          clauseError: false,
          selectedClauseIds: state.selectedClauseIds.filter((id) => id !== action.id),
        }
      }
      if (state.selectedClauseIds.length >= MAX_SELECTED_CLAUSES) {
        return state
      }
      return {
        ...state,
        clauseError: false,
        selectedClauseIds: [...state.selectedClauseIds, action.id],
      }
    }
    case 'set_details': {
      const detailsErrors = { ...state.detailsErrors }
      for (const key of Object.keys(action.details) as Array<keyof DetailsFields>) {
        delete detailsErrors[key]
      }
      return { ...state, details: { ...state.details, ...action.details }, detailsErrors }
    }
    case 'set_routing':
      return { ...state, routing: action.routing }
    case 'submit_details':
      return {
        ...state,
        details: action.details,
        detailsErrors: {},
        step: state.step < 4 ? ((state.step + 1) as Step) : state.step,
      }
    case 'details_invalid':
      return { ...state, detailsErrors: action.errors }
    case 'clause_error':
      return { ...state, clauseError: true }
    case 'next':
      return { ...state, step: state.step < 4 ? ((state.step + 1) as Step) : state.step }
    case 'set_verified':
      return { ...state, submissionId: action.submissionId, verified: true }
    case 'goto':
      return { ...state, step: action.step }
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
    detailsErrors: {},
    clauseError: false,
  })

  const selectedClauses = clauses
    .filter((clause) => state.selectedClauseIds.includes(clause.id))
    .sort((a, b) => a.sort_order - b.sort_order)

  function goNextFromStep1() {
    if (state.selectedClauseIds.length < 1) {
      dispatch({ type: 'clause_error' })
      return
    }
    dispatch({ type: 'next' })
  }

  function goNextFromStep2() {
    const parsed = createDetailsSchema(
      lang,
      districts.map((d) => d.value),
    ).safeParse(state.details)
    if (!parsed.success) {
      dispatch({ type: 'details_invalid', errors: fieldErrorsFromZod(parsed.error) })
      return
    }
    const phone = normalizeIndianPhone(parsed.data.phone) ?? parsed.data.phone
    dispatch({ type: 'submit_details', details: { ...parsed.data, phone } })
  }

  const showStep4 = state.step === 4 && state.verified && Boolean(state.submissionId)
  const showStep3 = state.step === 3 || (state.step === 4 && !showStep4)

  return (
    <PageContainer>
      {mode !== 'live' ? (
        <p className="mb-4 font-mono text-xs leading-relaxed text-muted sm:text-sm">
          <a
            href={FOREST_BILL_SOURCE_URL}
            className={`font-medium text-accent underline ${focusRing}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(lang, 'gazetteBill')}
          </a>
          {' · '}
          <a
            href={FOREST_BILL_VOLUNTEER_URL}
            className={`font-medium text-accent underline ${focusRing}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(lang, 'volunteerLetter')}
          </a>
        </p>
      ) : null}

      <Progress step={showStep4 ? 4 : showStep3 ? 3 : state.step} />

      {state.step === 1 ? (
        <Step1_ClauseSelector
          clauses={clauses}
          selectedIds={state.selectedClauseIds}
          onToggle={(id) => dispatch({ type: 'toggle_clause', id })}
        />
      ) : null}

      {state.step === 2 ? (
        <Step2_DetailsForm
          details={state.details}
          districts={districts}
          errors={state.detailsErrors}
          routing={state.routing}
          allowSample={mode !== 'live'}
          onChange={(patch) => dispatch({ type: 'set_details', details: patch })}
          onRoutingChange={(routing) => dispatch({ type: 'set_routing', routing })}
        />
      ) : null}

      {showStep3 ? (
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

      {showStep4 ? (
        <Step4_Preview
          campaign={campaign}
          clauses={selectedClauses}
          details={state.details}
          routing={state.routing}
          submissionId={state.submissionId}
          mode={mode}
          testerEmail={testerEmail}
          onEditDetails={() => dispatch({ type: 'goto', step: 2 })}
        />
      ) : null}

      {state.step === 1 && state.clauseError ? (
        <p className="mt-3 text-sm text-red-800" role="alert" aria-live="assertive">
          {t(lang, 'minClausesHint')}
        </p>
      ) : null}

      {state.step === 1 ? (
        <div className="mt-6">
          <button type="button" onClick={goNextFromStep1} className={cx(btnPrimary, 'w-full')}>
            {t(lang, 'continueToDetails')}
            <IconChevronRight className="size-4 shrink-0" />
          </button>
        </div>
      ) : null}

      {state.step === 2 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => dispatch({ type: 'back' })} className={cx(btnGhost, 'w-full sm:w-auto')}>
            {t(lang, 'back')}
          </button>
          <button type="button" onClick={goNextFromStep2} className={cx(btnPrimary, 'w-full sm:flex-1')}>
            {t(lang, 'continueToLetter')}
            <IconChevronRight className="size-4 shrink-0" />
          </button>
        </div>
      ) : null}

      {state.step > 2 ? (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={() => dispatch({ type: 'back' })} className={btnGhost}>
            {t(lang, 'back')}
          </button>
        </div>
      ) : null}
    </PageContainer>
  )
}
