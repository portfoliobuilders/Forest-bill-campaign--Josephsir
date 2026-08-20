'use client'

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { prepareDemoLetter, markHandoff } from '@/app/actions/submission'
import { CampaignProgress } from '@/components/campaign/CampaignProgress'
import { CampaignSources } from '@/components/campaign/CampaignSources'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useLang } from '@/components/LanguageProvider'
import { IconCheck, IconCopy, IconEnvelope, IconSparkle } from '@/components/ui/icons'
import { PageContainer } from '@/components/ui/PageContainer'
import {
  androidSendIntent,
  composeEmail,
  formatCompleteEmailCopy,
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
import { formatCampaignDate } from '@/lib/format-date'
import { isFieldEnabled, isFieldRequired, labelForField } from '@/lib/form-fields'
import { t, tReplace, type Lang } from '@/lib/i18n'
import {
  compactLocationLine,
  isValidPincode,
  locationFromLookup,
  type PostalLookup,
} from '@/lib/postal'
import { btnGhost, btnPrimary, btnSecondary, focusRing, inputClass, labelClass } from '@/lib/ui'
import type { WizardMode } from '@/lib/wizard-mode'
import { isDryRun } from '@/lib/wizard-mode'
import type { Campaign, CampaignFormField, CampaignSource, ObjectionClause } from '@/types/database'
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

function statusLabel(lang: Lang, view: 'live' | 'preview' | 'inactive' | 'expired') {
  if (view === 'live') return t(lang, 'statusActive')
  if (view === 'expired') return t(lang, 'statusExpired')
  if (view === 'inactive') return t(lang, 'statusInactive')
  return t(lang, 'statusDraft')
}

const pinCache = new Map<string, PostalLookup>()

export function CampaignFlow({
  campaign,
  clauses,
  formFields,
  districts,
  mode,
  view,
  sources = [],
}: {
  campaign: Campaign
  clauses: ObjectionClause[]
  formFields: CampaignFormField[]
  districts: { value: string; labelEn: string; labelMl: string }[]
  mode: WizardMode
  view: 'live' | 'preview' | 'inactive' | 'expired'
  sources?: CampaignSource[]
}) {
  const { lang } = useLang()
  const router = useRouter()
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

  const showAi =
    features.enable_ai_mail &&
    selected.length === 1 &&
    (aiConfigured || Boolean(selected[0] && approvedAiBody(selected[0], lang)))
  const showVoice = features.enable_voice_input
  const showRead = features.enable_mail_read_aloud && Boolean(letter?.body)

  function patchDetails(next: Partial<DetailsFields>) {
    setDetails((prev) => ({ ...prev, ...next }))
    const nextErrors = { ...errors }
    for (const key of Object.keys(next) as Array<keyof DetailsFields>) delete nextErrors[key]
    setErrors(nextErrors)
  }

  function selectConcern(id: string) {
    const next = applyPredefinedConcernClick({
      mode: config.mode,
      selectedIds,
      id,
      maxSelections: config.maxSelections,
    })
    setSelectedIds(next.selectedIds)
    setConcernError(false)
    setImproved(null)
    setAiError('')
  }

  function validate(): boolean {
    const validity = validatePredefinedSelection({
      mode: config.mode,
      selectedIds,
      maxSelections: config.maxSelections,
    })
    if (validity !== 'ok') {
      setConcernError(true)
      return false
    }
    const parsed = createDetailsSchema(
      lang,
      districts.map((item) => item.value),
      formFields,
      { privacyMode: privacyOn, campaign },
    ).safeParse(details)
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error))
      return false
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
        fullName: details.fullName || (privacyOn ? 'Citizen' : ''),
        email: details.email,
        phone: details.phone,
        address: details.addressLine,
        panchayat: details.panchayat,
        village: details.village,
        district: location.district || details.district,
        pincode: details.pincode,
        language: lang,
        customText: details.customText,
        extraConcerns: config.allowCustomConcern && details.customText.trim() ? [details.customText] : [],
        clauseCodes: selected.map((clause) => clause.code),
        letterMode: 'selected',
        constituencyId: null,
        ccRepIds: [],
        privacyMode: privacyOn,
        postOffice: location.postOffice ?? '',
        state: location.state ?? '',
        postalRegion: location.postalRegion ?? '',
        taluk: location.taluk ?? '',
      })
      if (prepared.ok) id = prepared.data.id
      setSubmissionId(id)
    } catch {
      // Sending still works offline.
    }
    if (id) await markHandoff(id, method)
    if (goSent && id) router.push(`/sent?id=${id}`)
  }

  function mailParams(): MailComposeParams | null {
    if (!letter) return null
    const targets = resolveMailTargets({ campaign, mode, testerEmail: details.email })
    return { to: targets.to, cc: targets.cc, bcc: targets.bcc, subject: letter.subject, body: letter.body }
  }

  async function sendMailto() {
    if (!validate()) return
    const params = mailParams()
    if (!params || params.to.length === 0) return
    setPasteHint(false)
    const ua = navigator.userAgent
    if (/Android/i.test(ua)) {
      await copyPlainText(params.body).catch(() => undefined)
      window.location.href = androidSendIntent(params, { fallbackUrl: mailtoUrl(params, { includeBody: false }) })
      await persistAndHandoff('mailto', false)
      return
    }
    if (mailtoUrlTooLong(params)) {
      await copyPlainText(formatCompleteEmailCopy(params)).catch(() => undefined)
      setCopyState('copied')
      setPasteHint(true)
      setStatus(t(lang, 'mailtoTooLong'))
      await persistAndHandoff('copy', false)
      return
    }
    window.location.href = mailtoUrl(params)
    await persistAndHandoff('mailto', false)
  }

  async function sendGmail() {
    if (!validate()) return
    const params = mailParams()
    if (!params || params.to.length === 0) return
    if (gmailUrlTooLong(params)) {
      await copyPlainText(params.body).catch(() => undefined)
      window.open(gmailComposeUrl(params, { includeBody: false }), '_blank', 'noopener,noreferrer')
      setPasteHint(true)
      await persistAndHandoff('gmail_web', false)
      return
    }
    window.open(gmailComposeUrl(params), '_blank', 'noopener,noreferrer')
    await persistAndHandoff('gmail_web', true)
  }

  async function improveEmail() {
    const concern = selected[0]
    if (!concern || !showAi) return
    aiAbort.current?.abort()
    const controller = new AbortController()
    aiAbort.current = controller
    setImproving(true)
    setAiError('')
    setStatus(t(lang, 'improvingEmail'))
    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          campaign_id: campaign.id,
          concern_id: concern.id,
          language: lang,
        }),
      })
      const payload = (await response.json()) as { ok?: boolean; body?: string }
      if (!payload.ok || !payload.body) {
        setAiError(t(lang, 'aiUnavailable'))
        setImproved(null)
        setStatus(t(lang, 'aiUnavailable'))
        return
      }
      setImproved({ concernId: concern.id, body: payload.body })
      setStatus(t(lang, 'aiGenerated'))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setAiError(t(lang, 'aiUnavailable'))
      setImproved(null)
      setStatus(t(lang, 'aiUnavailable'))
    } finally {
      setImproving(false)
    }
  }

  const locationLine = lookup?.found ? compactLocationLine(lookup.common) : ''

  return (
    <PageContainer>
      <StatusRegion message={status} />

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {t(lang, 'campaignStatus')}: {statusLabel(lang, view)}
          </p>
          <LanguageToggle />
        </div>
        <h1 lang={lang} className="font-display mt-4 text-[1.85rem] text-ink sm:text-4xl">{title}</h1>
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
              <span className="ml-2 font-semibold text-accent">{tReplace(lang, 'daysRemaining', { n: String(daysLeft) })}</span>
            ) : null}
          </p>
        ) : null}
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">{t(lang, 'trustLine')}</p>
      </section>

          {actionable ? (
            <button type="button" className={cx(btnPrimary, 'mt-8 w-full sm:w-auto')} onClick={goConcern}>
              {t(lang, 'selectYourConcern')}
              <IconChevronRight className="size-4 shrink-0" />
            </button>
          ) : null}
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">{t(lang, 'trustLine')}</p>
          <CampaignSources sources={sources} />
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

          {isFieldEnabled(formFields, 'name') && !privacyOn ? (
            <Field
              id="full-name"
              label={labelForField(formFields, 'name', lang, t(lang, 'fullName'))}
              required={isFieldRequired(formFields, 'name')}
              value={details.fullName}
              error={errors.fullName}
              autoComplete="name"
              onChange={(value) => patchDetails({ fullName: value })}
              voice={showVoice ? { lang, onStatus: setStatus } : null}
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
              id="phone"
              label={labelForField(formFields, 'phone', lang, t(lang, 'phone'))}
              required={isFieldRequired(formFields, 'phone')}
              value={details.phone}
              error={errors.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              onChange={(value) => patchDetails({ phone: value })}
            />
          ) : null}

          {isFieldEnabled(formFields, 'address') && !privacyOn ? (
            <Field
              id="address"
              label={labelForField(formFields, 'address', lang, t(lang, 'address'))}
              required={isFieldRequired(formFields, 'address')}
              value={details.addressLine}
              error={errors.addressLine}
              multiline
              onChange={(value) => patchDetails({ addressLine: value })}
              voice={showVoice ? { lang, onStatus: setStatus } : null}
            />
          ) : null}

          {isFieldEnabled(formFields, 'local_body') && !privacyOn ? (
            <Field
              id="panchayat"
              label={labelForField(formFields, 'local_body', lang, t(lang, 'panchayat'))}
              required={isFieldRequired(formFields, 'local_body')}
              value={details.panchayat}
              error={errors.panchayat}
              onChange={(value) => patchDetails({ panchayat: value })}
            />
          ) : null}

          {isFieldEnabled(formFields, 'village') && !privacyOn ? (
            <Field
              id="village"
              label={labelForField(formFields, 'village', lang, t(lang, 'village'))}
              required={isFieldRequired(formFields, 'village')}
              value={details.village}
              error={errors.village}
              onChange={(value) => patchDetails({ village: value })}
            />
          ) : null}

          {isFieldEnabled(formFields, 'email') && !privacyOn ? (
            <Field
              id="email"
              label={labelForField(formFields, 'email', lang, t(lang, 'email'))}
              required={isFieldRequired(formFields, 'email')}
              value={details.email}
              error={errors.email}
              type="email"
              autoComplete="email"
              onChange={(value) => patchDetails({ email: value })}
            />
            {isFieldEnabled(formFields, 'custom_message') && !config.allowCustomConcern ? (
              <label className={labelClass}>
                {fieldByKey(formFields, 'custom_message')?.[lang === 'en' ? 'label_en' : 'label_ml'] || t(lang, 'customText')}
                <span className="font-normal text-muted"> ({t(lang, 'optional')})</span>
              ) : (
                <span className="text-accent"> *</span>
              )}
              <select
                id="district"
                className={inputClass}
                value={details.district}
                onChange={(event) => patchDetails({ district: event.target.value })}
              >
                <option value="">{t(lang, 'selectDistrict')}</option>
                {districts.map((district) => (
                  <option key={district.value} value={district.value}>
                    {lang === 'en' ? district.labelEn : district.labelMl}
                  </option>
                ))}
              </select>
              {errors.district ? <p className="mt-1 text-sm font-normal text-red-800">{errors.district}</p> : null}
            </label>
          ) : null}

          {features.allow_privacy_mode ? (
            <div className="rounded-[8px] border border-rule bg-raised p-4">
              <label className="flex min-h-11 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-6 accent-[var(--color-accent)]"
                  checked={privacyOn}
                  onChange={(event) => {
                    setPrivacyMode(event.target.checked)
                    setImproved(null)
                  }}
                />
                <span>
                  <span className="block font-semibold text-ink">{t(lang, 'privacyMode')}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-body">{t(lang, 'privacyModeHelp')}</span>
                </span>
              </label>
            </div>
          ) : null}

          {letter ? (
            <section aria-label={t(lang, 'previewEmail')}>
              <h2 className="font-display text-xl text-ink">{t(lang, 'previewEmail')}</h2>
              <p className="mt-2 text-sm font-semibold text-ink">{letter.subject}</p>
              <pre className="mt-3 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words rounded-[8px] border border-rule bg-raised p-4 text-sm leading-relaxed text-ink sm:text-base">
                {letter.body}
              </pre>
            </section>
          ) : null}

          {showRead && letter ? <ReadAloudControls lang={lang} text={`${letter.subject}\n\n${letter.body}`} onStatus={setStatus} /> : null}

          {showAi ? (
            <div>
              <button
                type="button"
                className={cx(btnGhost, 'w-full sm:w-auto')}
                onClick={() => void improveEmail()}
                disabled={improving}
                aria-busy={improving}
              >
                <IconSparkle className="size-5" />
                {improving ? t(lang, 'improvingEmail') : t(lang, 'improveEmail')}
              </button>
              <p className="mt-1 text-sm text-muted">{t(lang, 'improveEmailHint')}</p>
              {improving ? (
                <button type="button" className={cx(btnGhost, 'mt-2')} onClick={() => aiAbort.current?.abort()}>
                  {t(lang, 'cancelImprove')}
                </button>
              ) : null}
              {aiError ? <p className="mt-2 text-sm text-ink">{aiError}</p> : null}
            </div>
          ) : null}

          {isDryRun(mode) ? <p className="text-base text-amber-900">{t(lang, 'demoLetterHint')}</p> : null}

          <div className="flex flex-col gap-3">
            <button type="submit" className={cx(btnPrimary, 'min-h-14 w-full')}>
              <IconEnvelope className="size-5 shrink-0" />
              {t(lang, 'sendEmail')}
            </button>
            <button type="button" className={cx(btnSecondary, 'min-h-12 w-full')} onClick={() => void sendGmail()}>
              {t(lang, 'sendGmail')}
            </button>
            <button
              type="button"
              className={cx(btnGhost, 'min-h-12 w-full')}
              onClick={() => {
                if (!validate()) return
                const params = mailParams()
                if (!params) return
                void copyPlainText(formatCompleteEmailCopy(params))
                  .then(() => {
                    setCopyState('copied')
                    setStatus(t(lang, 'mailCopied'))
                    return persistAndHandoff('copy', true)
                  })
                  .catch(() => setCopyState('failed'))
              }}
            >
              <IconCopy className="size-4" />
              {copyState === 'copied' ? t(lang, 'copied') : t(lang, 'copyEmail')}
            </button>
          </div>
          {pasteHint ? <p className="text-sm text-ink">{t(lang, 'mailtoTooLong')}</p> : null}
          {copyState === 'failed' ? <p className="text-sm text-red-800">{t(lang, 'copyFailed')}</p> : null}
        </form>
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
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  multiline,
  autoComplete,
  inputMode,
  voice,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  type?: string
  multiline?: boolean
  autoComplete?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  voice?: { lang: Lang; onStatus: (message: string) => void } | null
}) {
  const { lang } = useLang()
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
          {required ? <span className="text-accent"> *</span> : <span className="font-normal text-muted"> ({t(lang, 'optional')})</span>}
        </label>
        {voice ? (
          <VoiceInputButton lang={voice.lang} fieldId={id} value={value} onChange={onChange} onStatus={voice.onStatus} />
        ) : null}
      </div>
      {multiline ? (
        <textarea
          id={id}
          className={`${inputClass} min-h-24 resize-y py-2`}
          value={value}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={inputClass}
          value={value}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm font-normal text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
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
