'use client'

import { useReducer } from 'react'

import { prepareDemoLetter } from '@/app/actions/submission'
import { PageContainer } from '@/components/ui/PageContainer'
import { IconChevronRight } from '@/components/ui/icons'
import { Progress } from '@/components/wizard/Progress'
import {
  flattenCustomConcerns,
  MAX_SELECTED_CLAUSES,
  selectedConcernCount,
  Step1_ClauseSelector,
} from '@/components/wizard/Step1_ClauseSelector'
import { emptyRouting, Step2_DetailsForm } from '@/components/wizard/Step2_DetailsForm'
import { Step3_Preview, type CanonicalLetter } from '@/components/wizard/Step3_Preview'
import { useLang } from '@/components/LanguageProvider'
import { clausesForLetter, composeEmail, type LetterMode } from '@/lib/compose'
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

type Step = 1 | 2 | 3

type WizardState = {
  step: Step
  letterMode: LetterMode
  selectedClauseIds: string[]
  customConcerns: string[]
  details: DetailsFields
  routing: WizardRouting
  submissionId: string | null
  detailsErrors: FieldErrors
  clauseError: boolean
  canonicalLetter: CanonicalLetter | null
}

type WizardAction =
  | { type: 'toggle_clause'; id: string }
  | { type: 'set_letter_mode'; mode: LetterMode }
  | { type: 'set_details'; details: Partial<DetailsFields> }
  | { type: 'set_custom_concern'; index: number; text: string }
  | { type: 'add_custom_concern' }
  | { type: 'remove_custom_concern'; index: number }
  | { type: 'set_routing'; routing: WizardRouting }
  | {
      type: 'submit_details'
      details: DetailsFields
      nextStep: Step
      letter?: CanonicalLetter | null
      submissionId?: string | null
    }
  | { type: 'details_invalid'; errors: FieldErrors }
  | { type: 'next' }
  | { type: 'clause_error' }
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

function withCustomConcerns(state: WizardState, customConcerns: string[]): WizardState {
  const detailsErrors = { ...state.detailsErrors }
  delete detailsErrors.customText
  return {
    ...state,
    clauseError: false,
    customConcerns,
    detailsErrors,
  }
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'set_letter_mode':
      return { ...state, letterMode: action.mode, clauseError: false }
    case 'toggle_clause': {
      const selected = state.selectedClauseIds.includes(action.id)
      if (selected) {
        return {
          ...state,
          clauseError: false,
          selectedClauseIds: state.selectedClauseIds.filter((id) => id !== action.id),
        }
      }
      if (selectedConcernCount(state.selectedClauseIds, state.customConcerns) >= MAX_SELECTED_CLAUSES) {
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
      return {
        ...state,
        details: { ...state.details, ...action.details },
        detailsErrors,
      }
    }
    case 'set_custom_concern': {
      const next = [...state.customConcerns]
      const text = action.text.slice(0, 300)
      const wasEmpty = (next[action.index] ?? '').trim().length === 0
      if (
        wasEmpty &&
        text.trim().length > 0 &&
        selectedConcernCount(state.selectedClauseIds, state.customConcerns) >= MAX_SELECTED_CLAUSES
      ) {
        return state
      }
      next[action.index] = text
      return withCustomConcerns(state, next)
    }
    case 'add_custom_concern': {
      if (selectedConcernCount(state.selectedClauseIds, state.customConcerns) >= MAX_SELECTED_CLAUSES) {
        return state
      }
      if (state.customConcerns.length >= MAX_SELECTED_CLAUSES) {
        return state
      }
      return { ...state, customConcerns: [...state.customConcerns, ''] }
    }
    case 'remove_custom_concern': {
      const next = state.customConcerns.filter((_, index) => index !== action.index)
      return withCustomConcerns(state, next.length > 0 ? next : [''])
    }
    case 'set_routing':
      return { ...state, routing: action.routing }
    case 'submit_details':
      return {
        ...state,
        details: action.details,
        detailsErrors: {},
        step: action.nextStep,
        canonicalLetter: action.letter === undefined ? state.canonicalLetter : action.letter,
        submissionId: action.submissionId === undefined ? state.submissionId : action.submissionId,
      }
    case 'details_invalid':
      return { ...state, detailsErrors: action.errors }
    case 'clause_error':
      return { ...state, clauseError: true }
    case 'next':
      return { ...state, step: state.step < 3 ? ((state.step + 1) as Step) : state.step }
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
    letterMode: 'selected',
    selectedClauseIds: [],
    customConcerns: [''],
    details: emptyDetails,
    routing: emptyRouting,
    submissionId: null,
    detailsErrors: {},
    clauseError: false,
    canonicalLetter: null,
  })

  const extraConcerns = flattenCustomConcerns(state.customConcerns)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  const selectedClauses = clausesForLetter(clauses, state.selectedClauseIds, state.letterMode)

  function goNextFromStep1() {
    if (state.letterMode === 'selected' && selectedConcernCount(state.selectedClauseIds, state.customConcerns) < 1) {
      dispatch({ type: 'clause_error' })
      return
    }
    dispatch({ type: 'next' })
  }

  async function goNextFromStep2() {
    const parsed = createDetailsSchema(
      lang,
      districts.map((d) => d.value),
    ).safeParse(state.details)
    if (!parsed.success) {
      dispatch({ type: 'details_invalid', errors: fieldErrorsFromZod(parsed.error) })
      return
    }
    const phone = normalizeIndianPhone(parsed.data.phone) ?? parsed.data.phone
    const details = { ...parsed.data, phone }

    try {
      const prepared = await prepareDemoLetter({
        campaignSlug: campaign.slug,
        fullName: details.fullName,
        email: details.email,
        phone,
        address: details.addressLine,
        panchayat: details.panchayat,
        district: details.district,
        pincode: details.pincode,
        language: lang,
        customText: details.customText,
        extraConcerns,
        clauseCodes: selectedClauses.map((clause) => clause.code),
        letterMode: state.letterMode,
        constituencyId: state.routing.constituencyId,
        ccRepIds: state.routing.ccRepresentativeIds,
      })
      if (prepared.ok) {
        dispatch({
          type: 'submit_details',
          details,
          nextStep: 3,
          letter: { subject: prepared.data.subject, body: prepared.data.body },
          submissionId: prepared.data.id,
        })
        return
      }
    } catch {
      // Bundled demo still works if the database is unreachable.
    }

    const local = composeEmail({
      campaign,
      clauses: selectedClauses,
      details: {
        fullName: details.fullName,
        addressLine: details.addressLine,
        panchayat: details.panchayat,
        district: details.district,
        pincode: details.pincode,
        phone,
        email: details.email,
        customText: details.customText,
        extraConcerns,
      },
      lang,
    })
    dispatch({
      type: 'submit_details',
      details,
      nextStep: 3,
      letter: { subject: local.subject, body: local.body },
      submissionId: null,
    })
  }

  return (
    <PageContainer>
      {mode !== 'live' ? (
        <p className="mb-4 font-mono text-xs leading-relaxed text-muted sm:text-sm">
          <a
            href={campaign.source_url || FOREST_BILL_SOURCE_URL}
            className={`font-medium text-accent underline ${focusRing}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(lang, 'gazetteBill')}
          </a>
          {' · '}
          <a
            href={campaign.reference_url || FOREST_BILL_VOLUNTEER_URL}
            className={`font-medium text-accent underline ${focusRing}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(lang, 'volunteerLetter')}
          </a>
        </p>
      ) : null}

      <Progress step={state.step} />

      {state.step === 1 ? (
        <Step1_ClauseSelector
          clauses={clauses}
          selectedIds={state.selectedClauseIds}
          customConcerns={state.customConcerns}
          customError={state.detailsErrors.customText}
          letterMode={state.letterMode}
          onLetterMode={(letterMode) => dispatch({ type: 'set_letter_mode', mode: letterMode })}
          onToggle={(id) => dispatch({ type: 'toggle_clause', id })}
          onCustomChange={(index, text) => dispatch({ type: 'set_custom_concern', index, text })}
          onAddCustom={() => dispatch({ type: 'add_custom_concern' })}
          onRemoveCustom={(index) => dispatch({ type: 'remove_custom_concern', index })}
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

      {state.step === 3 ? (
        <Step3_Preview
          campaign={campaign}
          clauses={selectedClauses}
          details={state.details}
          routing={state.routing}
          submissionId={state.submissionId}
          mode={mode}
          testerEmail={testerEmail}
          canonicalLetter={state.canonicalLetter}
          extraConcerns={extraConcerns}
          onEditDetails={() => dispatch({ type: 'goto', step: 2 })}
          onEditObjections={() => dispatch({ type: 'goto', step: 1 })}
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
          <button
            type="button"
            onClick={() => dispatch({ type: 'back' })}
            className={cx(btnGhost, 'w-full sm:w-auto')}
          >
            {t(lang, 'back')}
          </button>
          <button type="button" onClick={() => void goNextFromStep2()} className={cx(btnPrimary, 'w-full sm:flex-1')}>
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
