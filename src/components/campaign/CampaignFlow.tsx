'use client'

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { prepareDemoLetter, markHandoff } from '@/app/actions/submission'
import { CampaignProgress } from '@/components/campaign/CampaignProgress'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useLang } from '@/components/LanguageProvider'
import { IconChevronRight, IconCopy, IconEnvelope, IconGmail } from '@/components/ui/icons'
import { PageContainer } from '@/components/ui/PageContainer'
import {
  androidSendIntent,
  composeEmail,
  concernBody,
  concernShort,
  concernTitle,
  formatCompleteEmailCopy,
  formatUnsentEml,
  gmailComposeUrl,
  gmailUrlTooLong,
  mailtoUrl,
  mailtoUrlTooLong,
  resolveMailTargets,
  type MailComposeParams,
} from '@/lib/compose'
import {
  campaignConcernConfig,
  customConcernCopy,
} from '@/lib/concern-selection'
import { cx } from '@/lib/cx'
import {
  createDetailsSchema,
  emptyDetails,
  fieldErrorsFromZod,
  MAX_CUSTOM_CHARS,
  type DetailsFields,
  type FieldErrors,
} from '@/lib/details-schema'
import { fieldByKey, isFieldEnabled, isFieldRequired } from '@/lib/form-fields'
import { formatCampaignDate } from '@/lib/format-date'
import { t, tReplace, type Lang } from '@/lib/i18n'
import { normalizeIndianPhone } from '@/lib/phone'
import { btnGhost, btnPrimary, btnSecondary, focusRing, inputClass, labelClass } from '@/lib/ui'
import type { WizardMode } from '@/lib/wizard-mode'
import { isDryRun } from '@/lib/wizard-mode'
import type { Campaign, CampaignFormField, ObjectionClause } from '@/types/database'
import type { DistrictOption } from '@/lib/demo-data'

type Step = 1 | 2 | 3 | 4 | 5
type CanonicalLetter = { subject: string; body: string }

type FlowState = {
  step: Step
  selectedIds: string[]
  details: DetailsFields
  detailsErrors: FieldErrors
  concernError: boolean
  expandedId: string | null
  letter: CanonicalLetter | null
  submissionId: string | null
}

type Action =
  | { type: 'select'; id: string; multiple: boolean }
  | { type: 'toggle_expand'; id: string }
  | { type: 'set_details'; details: Partial<DetailsFields> }
  | { type: 'details_invalid'; errors: FieldErrors }
  | { type: 'goto'; step: Step }
  | { type: 'concern_error' }
  | {
      type: 'ready_review'
      details: DetailsFields
      letter: CanonicalLetter
      submissionId: string | null
    }

function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case 'select': {
      if (action.multiple) {
        const on = state.selectedIds.includes(action.id)
        return {
          ...state,
          concernError: false,
          selectedIds: on ? state.selectedIds.filter((id) => id !== action.id) : [...state.selectedIds, action.id],
        }
      }
      return { ...state, concernError: false, selectedIds: [action.id] }
    }
    case 'toggle_expand':
      return { ...state, expandedId: state.expandedId === action.id ? null : action.id }
    case 'set_details': {
      const detailsErrors = { ...state.detailsErrors }
      for (const key of Object.keys(action.details) as Array<keyof DetailsFields>) delete detailsErrors[key]
      return { ...state, details: { ...state.details, ...action.details }, detailsErrors }
    }
    case 'details_invalid':
      return { ...state, detailsErrors: action.errors }
    case 'goto':
      return { ...state, step: action.step }
    case 'concern_error':
      return { ...state, concernError: true }
    case 'ready_review':
      return {
        ...state,
        details: action.details,
        detailsErrors: {},
        letter: action.letter,
        submissionId: action.submissionId,
        step: 4,
      }
    default:
      return state
  }
}

function pick(lang: Lang, ml: string, en: string) {
  return lang === 'en' ? en : ml
}

function statusLabel(lang: Lang, mode: WizardMode | 'inactive' | 'expired') {
  if (mode === 'live') return t(lang, 'statusActive')
  if (mode === 'expired' || mode === 'demo') return t(lang, 'statusExpired')
  if (mode === 'inactive') return t(lang, 'statusInactive')
  return t(lang, 'statusDraft')
}

export function CampaignFlow({
  campaign,
  clauses,
  formFields,
  districts,
  mode,
  view,
}: {
  campaign: Campaign
  clauses: ObjectionClause[]
  formFields: CampaignFormField[]
  districts: DistrictOption[]
  mode: WizardMode
  view: 'live' | 'preview' | 'inactive' | 'expired'
}) {
  const { lang } = useLang()
  const actionable = view === 'live' || view === 'preview'
  const config = campaignConcernConfig(campaign)
  const multiple = config.mode === 'multiple'
  const customCopy = customConcernCopy(config, lang)
  const [state, dispatch] = useReducer(reducer, {
    step: 1 as Step,
    selectedIds: [],
    details: emptyDetails(),
    detailsErrors: {},
    concernError: false,
    expandedId: null,
    letter: null,
    submissionId: null,
  })

  const selected = clauses.filter((clause) => state.selectedIds.includes(clause.id))
  const title = pick(lang, campaign.title_ml, campaign.title_en)
  const description = pick(lang, campaign.homepage_intro_ml || campaign.summary_ml, campaign.homepage_intro_en || campaign.summary_en)
  const deadline = formatCampaignDate(campaign.deadline_at, lang)
  const daysLeft = campaign.deadline_at
    ? Math.max(0, Math.ceil((new Date(campaign.deadline_at).getTime() - Date.now()) / 86_400_000))
    : null

  function goConcern() {
    if (!actionable) return
    dispatch({ type: 'goto', step: 2 })
  }

  function goDetails() {
    if (state.selectedIds.length < 1) {
      dispatch({ type: 'concern_error' })
      return
    }
    dispatch({ type: 'goto', step: 3 })
  }

  async function goReview() {
    const parsed = createDetailsSchema(
      lang,
      districts.map((d) => d.value),
      formFields,
    ).safeParse(state.details)
    if (!parsed.success) {
      dispatch({ type: 'details_invalid', errors: fieldErrorsFromZod(parsed.error) })
      return
    }
    const phone = parsed.data.phone.trim() ? (normalizeIndianPhone(parsed.data.phone) ?? parsed.data.phone) : ''
    const details = { ...parsed.data, phone }
    let letter = composeEmail({
      campaign,
      clauses: selected,
      details: {
        fullName: details.fullName,
        addressLine: details.addressLine,
        panchayat: details.panchayat,
        village: details.village,
        district: details.district,
        pincode: details.pincode,
        phone,
        email: details.email,
        customText: details.customText,
        extraConcerns: config.allowCustomConcern && details.customText.trim() ? [details.customText] : [],
      },
      lang,
    })
    let submissionId: string | null = null
    try {
      const prepared = await prepareDemoLetter({
        campaignSlug: campaign.slug,
        fullName: details.fullName,
        email: details.email,
        phone,
        address: details.addressLine,
        panchayat: details.panchayat,
        village: details.village,
        district: details.district,
        pincode: details.pincode,
        language: lang,
        customText: details.customText,
        extraConcerns: config.allowCustomConcern && details.customText.trim() ? [details.customText] : [],
        clauseCodes: selected.map((clause) => clause.code),
        letterMode: 'selected',
        constituencyId: null,
        ccRepIds: [],
      })
      if (prepared.ok) {
        letter = { subject: prepared.data.subject, body: prepared.data.body, charCount: letter.charCount, error: null }
        submissionId = prepared.data.id
      }
    } catch {
      // Letter still works offline.
    }
    dispatch({
      type: 'ready_review',
      details,
      letter: { subject: letter.subject, body: letter.body },
      submissionId,
    })
  }

  return (
    <PageContainer>
      {state.step > 1 && actionable ? <CampaignProgress step={state.step} /> : null}

      {state.step === 1 ? (
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {t(lang, 'campaignStatus')}: {statusLabel(lang, view === 'live' ? 'live' : view === 'preview' ? 'preview' : view)}
            </p>
          </div>
          <h1 className="font-display mt-4 text-[1.85rem] text-ink sm:text-4xl">{title}</h1>
          <div className="mt-5 max-w-3xl space-y-4 text-base leading-relaxed text-body sm:text-lg">
            {description.split(/\n{2,}/).map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
          {deadline ? (
            <p className="mt-6 font-mono text-sm text-muted">
              {view === 'expired' ? t(lang, 'publicCommentsClosedOn') : t(lang, 'publicCommentsCloseOn')}{' '}
              <span className="text-ink">{deadline}</span>
              {view === 'live' && daysLeft !== null ? (
                <span className="ml-2 font-semibold text-accent">
                  {tReplace(lang, 'daysRemaining', { n: String(daysLeft) })}
                </span>
              ) : null}
            </p>
          ) : null}

          {view === 'inactive' ? (
            <p className="mt-8 rounded-[8px] border border-rule bg-raised px-4 py-4 text-base text-ink">
              {t(lang, 'campaignInactivePublic')}
            </p>
          ) : null}
          {view === 'expired' ? (
            <p className="mt-8 rounded-[8px] border border-rule bg-raised px-4 py-4 text-base text-ink">
              {t(lang, 'campaignExpiredThanks')}
            </p>
          ) : null}

          {actionable ? (
            <button type="button" className={cx(btnPrimary, 'mt-8 w-full sm:w-auto')} onClick={goConcern}>
              {t(lang, 'selectYourConcern')}
              <IconChevronRight className="size-4 shrink-0" />
            </button>
          ) : null}
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">{t(lang, 'trustLine')}</p>
        </section>
      ) : null}

      {state.step === 2 ? (
        <section>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'selectYourConcern')}</h1>
          <p className="mt-2 text-base text-body">{t(lang, 'minClausesHint')}</p>
          <ul className="mt-6 space-y-3">
            {clauses.map((clause, index) => {
              const on = state.selectedIds.includes(clause.id)
              const expanded = state.expandedId === clause.id
              const short = concernShort(clause, lang)
              const full = concernBody(clause, lang)
              const needsMore = full.length > short.length + 8
              return (
                <li key={clause.id}>
                  <label
                    className={cx(
                      'flex cursor-pointer gap-3 rounded-[10px] border p-4',
                      on ? 'border-accent bg-accent-tint' : 'border-rule bg-raised',
                    )}
                  >
                    <input
                      type={multiple ? 'checkbox' : 'radio'}
                      name="concern"
                      className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]"
                      checked={on}
                      onChange={() => dispatch({ type: 'select', id: clause.id, multiple })}
                    />
                    <span className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-accent">{String(index + 1).padStart(2, '0')}</span>
                      <span className="mt-1 block text-base font-semibold leading-snug text-ink sm:text-lg">
                        {concernTitle(clause, lang)}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-body sm:text-base">
                        {expanded ? full : short}
                      </span>
                      {needsMore ? (
                        <button
                          type="button"
                          className={cx('mt-2 text-sm font-semibold text-accent', focusRing)}
                          onClick={(event) => {
                            event.preventDefault()
                            dispatch({ type: 'toggle_expand', id: clause.id })
                          }}
                        >
                          {expanded ? t(lang, 'readLess') : t(lang, 'readMore')}
                        </button>
                      ) : null}
                    </span>
                  </label>
              </li>
            )
          })}
          </ul>
          {config.allowCustomConcern ? (
            <div className="mt-6 rounded-[10px] border border-dashed border-accent bg-raised p-4">
              <label className={labelClass}>
                {customCopy.label}
                <span className="font-normal text-muted"> ({t(lang, 'optional')})</span>
                <textarea
                  className={`${inputClass} min-h-28 py-2`}
                  maxLength={MAX_CUSTOM_CHARS}
                  placeholder={customCopy.placeholder}
                  value={state.details.customText}
                  onChange={(event) => dispatch({ type: 'set_details', details: { customText: event.target.value } })}
                />
                <span className="mt-1 block text-sm font-normal text-muted">
                  {state.details.customText.length}/{MAX_CUSTOM_CHARS} {t(lang, 'charsUsed')}
                </span>
              </label>
            </div>
          ) : null}
          {state.concernError ? (
            <p className="mt-3 text-sm text-red-800" role="alert">
              {t(lang, 'minClausesHint')}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" className={cx(btnGhost, 'w-full sm:w-auto')} onClick={() => dispatch({ type: 'goto', step: 1 })}>
              {t(lang, 'back')}
            </button>
            <button type="button" className={cx(btnPrimary, 'w-full sm:flex-1')} onClick={goDetails}>
              {t(lang, 'continue')}
              <IconChevronRight className="size-4 shrink-0" />
            </button>
          </div>
        </section>
      ) : null}

      {state.step === 3 ? (
        <section>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'yourDetails')}</h1>
          <p className="mt-2 text-base leading-relaxed text-body">{t(lang, 'privacyDetails')}</p>
          <div className="mt-6 grid gap-4">
            <Field
              lang={lang}
              fields={formFields}
              fieldKey="name"
              value={state.details.fullName}
              error={state.detailsErrors.fullName}
              onChange={(value) => dispatch({ type: 'set_details', details: { fullName: value } })}
            />
            <PinField
              lang={lang}
              fields={formFields}
              value={state.details.pincode}
              error={state.detailsErrors.pincode}
              onChange={(pincode) => dispatch({ type: 'set_details', details: { pincode } })}
              onLocation={(patch) => dispatch({ type: 'set_details', details: patch })}
            />
            <Field
              lang={lang}
              fields={formFields}
              fieldKey="email"
              type="email"
              value={state.details.email}
              error={state.detailsErrors.email}
              onChange={(value) => dispatch({ type: 'set_details', details: { email: value } })}
              autoComplete="email"
            />
            <Field
              lang={lang}
              fields={formFields}
              fieldKey="phone"
              type="tel"
              value={state.details.phone}
              error={state.detailsErrors.phone}
              onChange={(value) => dispatch({ type: 'set_details', details: { phone: value } })}
              hint={t(lang, 'phoneHint')}
            />
            {isFieldEnabled(formFields, 'district') ? (
              <label className={labelClass}>
                {fieldByKey(formFields, 'district')?.[lang === 'en' ? 'label_en' : 'label_ml'] || t(lang, 'district')}
                {!isFieldRequired(formFields, 'district') ? <span className="font-normal text-muted"> ({t(lang, 'optional')})</span> : null}
                <select
                  className={inputClass}
                  value={state.details.district}
                  onChange={(event) => dispatch({ type: 'set_details', details: { district: event.target.value } })}
                >
                  <option value="">{t(lang, 'selectDistrict')}</option>
                  {districts.map((district) => (
                    <option key={district.value} value={district.value}>
                      {lang === 'en' ? district.labelEn : district.labelMl}
                    </option>
                  ))}
                </select>
                {state.detailsErrors.district ? <p className="mt-1 text-sm font-normal text-red-800">{state.detailsErrors.district}</p> : null}
              </label>
            ) : null}
            <Field
              lang={lang}
              fields={formFields}
              fieldKey="local_body"
              value={state.details.panchayat}
              error={state.detailsErrors.panchayat}
              onChange={(value) => dispatch({ type: 'set_details', details: { panchayat: value } })}
            />
            <Field
              lang={lang}
              fields={formFields}
              fieldKey="village"
              value={state.details.village}
              error={state.detailsErrors.village}
              onChange={(value) => dispatch({ type: 'set_details', details: { village: value } })}
            />
            <Field
              lang={lang}
              fields={formFields}
              fieldKey="address"
              value={state.details.addressLine}
              error={state.detailsErrors.addressLine}
              onChange={(value) => dispatch({ type: 'set_details', details: { addressLine: value } })}
              multiline
            />
            {isFieldEnabled(formFields, 'custom_message') && !config.allowCustomConcern ? (
              <label className={labelClass}>
                {fieldByKey(formFields, 'custom_message')?.[lang === 'en' ? 'label_en' : 'label_ml'] || t(lang, 'customText')}
                <span className="font-normal text-muted"> ({t(lang, 'optional')})</span>
                <textarea
                  className={`${inputClass} min-h-28 py-2`}
                  maxLength={MAX_CUSTOM_CHARS}
                  value={state.details.customText}
                  onChange={(event) => dispatch({ type: 'set_details', details: { customText: event.target.value } })}
                />
                {state.detailsErrors.customText ? (
                  <p className="mt-1 text-sm font-normal text-red-800">{state.detailsErrors.customText}</p>
                ) : null}
              </label>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{t(lang, 'consentNotice')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" className={cx(btnGhost, 'w-full sm:w-auto')} onClick={() => dispatch({ type: 'goto', step: 2 })}>
              {t(lang, 'back')}
            </button>
            <button type="button" className={cx(btnPrimary, 'w-full sm:flex-1')} onClick={() => void goReview()}>
              {t(lang, 'continue')}
              <IconChevronRight className="size-4 shrink-0" />
            </button>
          </div>
        </section>
      ) : null}

      {state.step === 4 && state.letter ? (
        <ReviewStep
          campaign={campaign}
          selected={selected}
          details={state.details}
          letter={state.letter}
          mode={mode}
          onBack={() => dispatch({ type: 'goto', step: 3 })}
          onContinue={() => dispatch({ type: 'goto', step: 5 })}
        />
      ) : null}

      {state.step === 5 && state.letter ? (
        <EmailStep
          campaign={campaign}
          details={state.details}
          letter={state.letter}
          mode={mode}
          submissionId={state.submissionId}
          onBack={() => dispatch({ type: 'goto', step: 4 })}
        />
      ) : null}
    </PageContainer>
  )
}

const PINCODE_RE = /^[1-9][0-9]{5}$/

function PinField({
  lang,
  fields,
  value,
  error,
  onChange,
  onLocation,
}: {
  lang: Lang
  fields: CampaignFormField[]
  value: string
  error?: string
  onChange: (value: string) => void
  onLocation: (patch: Partial<DetailsFields>) => void
}) {
  const [hint, setHint] = useState('')
  const onLocationRef = useRef(onLocation)
  onLocationRef.current = onLocation

  useEffect(() => {
    const pin = value.trim()
    if (!PINCODE_RE.test(pin)) {
      setHint('')
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void fetch(`/api/constituency?pincode=${encodeURIComponent(pin)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            setHint('')
            return
          }
          const body = (await response.json()) as {
            candidates?: Array<{ constituency?: { district?: string; name_en?: string; name_ml?: string } }>
          }
          const districts = [
            ...new Set(
              (body.candidates ?? [])
                .map((row) => row.constituency?.district?.trim())
                .filter((district): district is string => Boolean(district)),
            ),
          ]
          if (districts.length === 1) {
            onLocationRef.current({ district: districts[0] })
            setHint(districts[0])
            return
          }
          if (districts.length > 1) {
            onLocationRef.current({ district: districts[0] })
            setHint(districts.join(' / '))
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setHint('')
        })
    }, 300)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [value])

  if (!isFieldEnabled(fields, 'pincode')) return null
  const field = fieldByKey(fields, 'pincode')
  const label = (lang === 'en' ? field?.label_en : field?.label_ml) || t(lang, 'pincode')
  const required = isFieldRequired(fields, 'pincode')
  return (
    <label className={labelClass}>
      {label}
      {!required ? <span className="font-normal text-muted"> ({t(lang, 'optional')})</span> : null}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <span className="mt-1 block text-sm font-normal text-muted">
          {t(lang, 'district')}: {hint}
        </span>
      ) : null}
      {error ? <p className="mt-1 text-sm font-normal text-red-800">{error}</p> : null}
    </label>
  )
}

function Field({
  lang,
  fields,
  fieldKey,
  value,
  error,
  onChange,
  type = 'text',
  multiline,
  hint,
  autoComplete,
}: {
  lang: Lang
  fields: CampaignFormField[]
  fieldKey: Parameters<typeof isFieldEnabled>[1]
  value: string
  error?: string
  onChange: (value: string) => void
  type?: string
  multiline?: boolean
  hint?: string
  autoComplete?: string
}) {
  if (!isFieldEnabled(fields, fieldKey)) return null
  const field = fieldByKey(fields, fieldKey)
  const label = (lang === 'en' ? field?.label_en : field?.label_ml) || fieldKey
  const required = isFieldRequired(fields, fieldKey)
  return (
    <label className={labelClass}>
      {label}
      {!required ? <span className="font-normal text-muted"> ({t(lang, 'optional')})</span> : null}
      {multiline ? (
        <textarea className={`${inputClass} min-h-24 py-2`} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          type={type}
          className={inputClass}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? <span className="mt-1 block text-sm font-normal text-muted">{hint}</span> : null}
      {error ? <p className="mt-1 text-sm font-normal text-red-800">{error}</p> : null}
    </label>
  )
}

function ReviewStep({
  campaign,
  selected,
  details,
  letter,
  mode,
  onBack,
  onContinue,
}: {
  campaign: Campaign
  selected: ObjectionClause[]
  details: DetailsFields
  letter: CanonicalLetter
  mode: WizardMode
  onBack: () => void
  onContinue: () => void
}) {
  const { lang } = useLang()
  const targets = resolveMailTargets({ campaign, mode, testerEmail: details.email })
  return (
    <section>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'reviewTitle')}</h1>
      <p className="mt-2 text-base text-body">{t(lang, 'reviewLead')}</p>
      <dl className="mt-6 space-y-4 text-base">
        <div>
          <dt className="font-semibold text-ink">{t(lang, 'selectedConcern')}</dt>
          <dd className="mt-1 text-body">{selected.map((clause) => concernTitle(clause, lang)).join(', ')}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">{t(lang, 'yourName')}</dt>
          <dd className="mt-1 text-body">{details.fullName}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">{t(lang, 'subjectLabel')}</dt>
          <dd className="mt-1 break-words text-body">{letter.subject}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">{t(lang, 'toLabel')}</dt>
          <dd className="mt-1 break-all text-body">{targets.to.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">{t(lang, 'ccLabel')}</dt>
          <dd className="mt-1 break-all text-body">{targets.cc.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">{t(lang, 'bccLabel')}</dt>
          <dd className="mt-1 text-body">{targets.bcc.length > 0 ? t(lang, 'bccPrivateNote') : '—'}</dd>
        </div>
      </dl>
      <pre className="mt-5 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words rounded-[8px] border border-rule bg-raised p-4 text-sm leading-relaxed text-ink sm:text-base">
        {letter.body}
      </pre>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" className={cx(btnGhost, 'w-full sm:w-auto')} onClick={onBack}>
          {t(lang, 'backAndEdit')}
        </button>
        <button type="button" className={cx(btnPrimary, 'w-full sm:flex-1')} onClick={onContinue}>
          {t(lang, 'continueToEmail')}
          <IconChevronRight className="size-4 shrink-0" />
        </button>
      </div>
    </section>
  )
}

function EmailStep({
  campaign,
  details,
  letter,
  mode,
  submissionId,
  onBack,
}: {
  campaign: Campaign
  details: DetailsFields
  letter: CanonicalLetter
  mode: WizardMode
  submissionId: string | null
  onBack: () => void
}) {
  const { lang } = useLang()
  const router = useRouter()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [pasteHint, setPasteHint] = useState(false)
  const [emlHint, setEmlHint] = useState(false)
  const dryRun = isDryRun(mode)
  const targets = useMemo(
    () => resolveMailTargets({ campaign, mode, testerEmail: details.email }),
    [campaign, mode, details.email],
  )
  const mailParams: MailComposeParams = {
    to: targets.to,
    cc: targets.cc,
    bcc: targets.bcc,
    subject: letter.subject,
    body: letter.body,
  }
  const sendDisabled = !details.fullName.trim() || !details.email.trim() || mailParams.to.length === 0

  async function recordHandoff(method: 'gmail_web' | 'mailto' | 'copy', goSent: boolean) {
    if (!submissionId) return
    await markHandoff(submissionId, method)
    if (goSent) router.push(`/sent?id=${submissionId}`)
  }

  async function copyPlainText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const field = document.createElement('textarea')
      field.value = text
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(field)
      if (!ok) throw new Error('copy failed')
    }
  }

  async function openGmail() {
    setEmlHint(false)
    setPasteHint(false)
    const ua = navigator.userAgent
    if (/Android/i.test(ua)) {
      await copyPlainText(letter.body).catch(() => undefined)
      window.location.href = androidSendIntent(mailParams, {
        gmailOnly: true,
        fallbackUrl: gmailComposeUrl(mailParams, { includeBody: false }),
      })
      await recordHandoff('gmail_web', false)
      return
    }
    if (gmailUrlTooLong(mailParams)) {
      await copyPlainText(letter.body).catch(() => undefined)
      window.open(gmailComposeUrl(mailParams, { includeBody: false }), '_blank', 'noopener,noreferrer')
      setPasteHint(true)
      await recordHandoff('gmail_web', false)
      return
    }
    window.open(gmailComposeUrl(mailParams), '_blank', 'noopener,noreferrer')
    await recordHandoff('gmail_web', true)
  }

  async function openMailApp() {
    setEmlHint(false)
    setPasteHint(false)
    const ua = navigator.userAgent
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    if (/Android/i.test(ua)) {
      await copyPlainText(letter.body).catch(() => undefined)
      window.location.href = androidSendIntent(mailParams, {
        fallbackUrl: mailtoUrl(mailParams, { includeBody: false }),
      })
      await recordHandoff('mailto', false)
      return
    }
    if (!ios) {
      const blob = new Blob([formatUnsentEml(mailParams)], { type: 'message/rfc822' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'janashabdam-letter.eml'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
      setEmlHint(true)
      await recordHandoff('mailto', false)
      return
    }
    if (mailtoUrlTooLong(mailParams)) {
      await copyPlainText(letter.body).catch(() => undefined)
      window.location.href = mailtoUrl(mailParams, { includeBody: false })
      setPasteHint(true)
      await recordHandoff('mailto', false)
      return
    }
    window.location.href = mailtoUrl(mailParams)
    await recordHandoff('mailto', false)
  }

  return (
    <section>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'sendEmail')}</h1>
      <p className="mt-2 text-base text-body">{t(lang, 'letterSupport')}</p>
      {dryRun ? <p className="mt-3 text-base text-amber-900">{t(lang, 'demoLetterHint')}</p> : null}
      <div className="mt-6 flex flex-col gap-3">
        <button type="button" disabled={sendDisabled} onClick={() => void openGmail()} className={cx(btnPrimary, 'min-h-12 w-full')}>
          <IconGmail className="size-5 shrink-0" />
          {t(lang, 'sendEmail')}
        </button>
        <button type="button" disabled={sendDisabled} onClick={() => void openMailApp()} className={cx(btnSecondary, 'min-h-12 w-full')}>
          <IconEnvelope className="size-4 shrink-0" />
          {t(lang, 'sendMailto')}
        </button>
        <button
          type="button"
          disabled={sendDisabled}
          onClick={() => {
            void copyPlainText(formatCompleteEmailCopy(mailParams))
              .then(() => {
                setCopyState('copied')
                return recordHandoff('copy', true)
              })
              .catch(() => setCopyState('failed'))
          }}
          className={cx(btnGhost, 'min-h-12 w-full')}
        >
          <IconCopy className="size-4 shrink-0" />
          {copyState === 'copied' ? t(lang, 'copied') : t(lang, 'copyCompleteEmail')}
        </button>
      </div>
      {pasteHint ? <p className="mt-3 text-sm text-ink">{t(lang, 'pasteHint')}</p> : null}
      {emlHint ? <p className="mt-3 text-sm text-ink">{t(lang, 'emlHint')}</p> : null}
      {copyState === 'failed' ? <p className="mt-2 text-sm text-red-800">{t(lang, 'copyFailed')}</p> : null}
      <button type="button" className={cx(btnGhost, 'mt-6')} onClick={onBack}>
        {t(lang, 'backAndEdit')}
      </button>
    </section>
  )
}

export function NoActiveCampaign() {
  const { lang } = useLang()
  return (
    <PageContainer>
      <div className="flex justify-end">
        <LanguageToggle />
      </div>
      <h1 className="font-display mt-6 text-2xl text-ink sm:text-3xl">{t(lang, 'noActiveCampaign')}</h1>
    </PageContainer>
  )
}
