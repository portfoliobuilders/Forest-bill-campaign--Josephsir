'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useCallback, useEffect, useRef, useState } from 'react'

import { createDraft, sendOtp, verifyOtp } from '@/app/actions/submission'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import type { DetailsFields } from '@/lib/details-schema'
import { t } from '@/lib/i18n'
import { normalizeIndianPhone } from '@/lib/phone'
import type { WizardMode } from '@/lib/wizard-mode'
import type { WizardRouting } from '@/types/database'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

const RESEND_COOLDOWN_SEC = 60

type VerifyErrorKey =
  | 'turnstile_failed'
  | 'rate_limit'
  | 'campaign_not_active'
  | 'invalid_input'
  | 'draft_failed'
  | 'otp_rate_limit'
  | 'otp_send_failed'
  | 'wrong_code'
  | 'expired_code'
  | 'too_many_attempts'
  | 'already_submitted'
  | 'verify_failed'
  | 'body_too_long'
  | 'invalid_clauses'
  | 'generic'

function errorKeyToI18n(key: string): VerifyErrorKey {
  const known: VerifyErrorKey[] = [
    'turnstile_failed',
    'rate_limit',
    'campaign_not_active',
    'invalid_input',
    'draft_failed',
    'otp_rate_limit',
    'otp_send_failed',
    'wrong_code',
    'expired_code',
    'too_many_attempts',
    'already_submitted',
    'verify_failed',
    'body_too_long',
    'invalid_clauses',
  ]
  return known.includes(key as VerifyErrorKey) ? (key as VerifyErrorKey) : 'generic'
}

function errorI18nKey(key: VerifyErrorKey): keyof (typeof import('@/lib/i18n').dictionary)['ml'] {
  const map: Record<VerifyErrorKey, keyof (typeof import('@/lib/i18n').dictionary)['ml']> = {
    turnstile_failed: 'errorTurnstile',
    rate_limit: 'errorRateLimit',
    campaign_not_active: 'errorCampaignInactive',
    invalid_input: 'errorGenericVerify',
    draft_failed: 'errorGenericVerify',
    otp_rate_limit: 'errorOtpRateLimit',
    otp_send_failed: 'errorOtpSendFailed',
    wrong_code: 'errorWrongOtp',
    expired_code: 'errorExpiredOtp',
    too_many_attempts: 'errorTooManyAttempts',
    already_submitted: 'errorAlreadySubmitted',
    verify_failed: 'errorGenericVerify',
    body_too_long: 'tooLongBody',
    invalid_clauses: 'errorGenericVerify',
    generic: 'errorGenericVerify',
  }
  return map[key]
}

export function Step3_Verify({
  campaignSlug,
  clauseCodes,
  details,
  routing,
  mode,
  initialSubmissionId,
  initiallyVerified,
  onVerified,
  onContinue,
}: {
  campaignSlug: string
  clauseCodes: string[]
  details: DetailsFields
  routing: WizardRouting
  mode: WizardMode
  initialSubmissionId: string | null
  initiallyVerified: boolean
  onVerified: (submissionId: string) => void
  onContinue: () => void
}) {
  const { lang } = useLang()
  const turnstileRef = useRef<TurnstileInstance | null>(null)
  const [phase, setPhase] = useState<'turnstile' | 'otp' | 'verified'>(() =>
    initiallyVerified ? 'verified' : 'turnstile',
  )
  const [submissionId, setSubmissionId] = useState<string | null>(initialSubmissionId)
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<VerifyErrorKey | null>(null)
  const [resendSec, setResendSec] = useState(0)
  const [otpSent, setOtpSent] = useState(false)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  useEffect(() => {
    if (resendSec <= 0) return
    const timer = window.setInterval(() => {
      setResendSec((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendSec])

  const dispatchOtp = useCallback(
    async (id: string) => {
      const result = await sendOtp(id)
      if (!result.ok) {
        setErrorKey(errorKeyToI18n(result.error))
        return false
      }
      setOtpSent(true)
      setResendSec(RESEND_COOLDOWN_SEC)
      setErrorKey(null)
      return true
    },
    [],
  )

  async function handleTurnstile(token: string) {
    if (mode !== 'live' || busy) return
    setBusy(true)
    setErrorKey(null)

    const phone = normalizeIndianPhone(details.phone) ?? details.phone
    const result = await createDraft({
      turnstileToken: token,
      campaignSlug,
      fullName: details.fullName,
      email: details.email,
      phone,
      address: details.addressLine,
      panchayat: details.panchayat,
      district: details.district,
      pincode: details.pincode,
      language: lang,
      customText: details.customText,
      clauseCodes,
      constituencyId: routing.constituencyId,
      ccRepIds: routing.ccRepresentativeIds,
    })

    if (!result.ok) {
      setErrorKey(errorKeyToI18n(result.error))
      turnstileRef.current?.reset()
      setBusy(false)
      return
    }

    setSubmissionId(result.data.id)
    setPhase('otp')
    await dispatchOtp(result.data.id)
    setBusy(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!submissionId || busy || phase === 'verified') return
    setBusy(true)
    setErrorKey(null)

    const result = await verifyOtp(submissionId, otp.trim())
    if (!result.ok) {
      setErrorKey(errorKeyToI18n(result.error))
      setBusy(false)
      return
    }

    setPhase('verified')
    onVerified(submissionId)
    setBusy(false)
  }

  async function handleResend() {
    if (!submissionId || resendSec > 0 || busy) return
    setBusy(true)
    await dispatchOtp(submissionId)
    setBusy(false)
  }

  if (mode !== 'live') {
    return (
      <div>
        <h2 className="text-xl font-bold text-stone-900">{t(lang, 'verify')}</h2>
        <p className="mt-3 text-base leading-relaxed text-stone-700">
          {t(lang, mode === 'preview' ? 'verifyPreviewHint' : 'verifyDemoBlocked')}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className={cx(
            'mt-5 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white transition-colors duration-150 hover:bg-emerald-900',
            focusRing,
          )}
        >
          {t(lang, 'continue')}
        </button>
      </div>
    )
  }

  if (!siteKey) {
    return (
      <div>
        <h2 className="text-xl font-bold text-stone-900">{t(lang, 'verify')}</h2>
        <p className="mt-3 text-base leading-relaxed text-red-800">{t(lang, 'errorTurnstileConfig')}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">{t(lang, 'verify')}</h2>
      <p className="mt-2 text-base leading-relaxed text-stone-700">{t(lang, 'verifyIntro')}</p>
      <p className="mt-1 text-sm text-stone-600">
        {t(lang, 'otpSentTo')}: <span className="font-medium">{details.email}</span>
      </p>

      {phase === 'turnstile' ? (
        <div className="mt-4">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={(token) => void handleTurnstile(token)}
            onError={() => setErrorKey('turnstile_failed')}
            onExpire={() => turnstileRef.current?.reset()}
            options={{ theme: 'light', size: 'normal' }}
          />
          {busy ? <p className="mt-2 text-sm text-stone-600">{t(lang, 'verifyWorking')}</p> : null}
        </div>
      ) : null}

      {phase === 'otp' || phase === 'verified' ? (
        <form onSubmit={(e) => void handleVerify(e)} className="mt-5">
          <label htmlFor="otp" className="block text-base font-medium text-stone-900">
            {t(lang, 'otpLabel')}
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={otp}
            disabled={phase === 'verified' || busy}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t(lang, 'otpPlaceholder')}
            className={cx(
              'mt-2 w-full rounded-md border border-stone-400 bg-white px-3 py-3 text-lg tracking-widest text-stone-900',
              focusRing,
            )}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {resendSec > 0 ? (
              <span className="text-stone-600">{t(lang, 'resendCooldown').replace('{sec}', String(resendSec))}</span>
            ) : (
              <button
                type="button"
                disabled={busy || phase === 'verified'}
                onClick={() => void handleResend()}
                className={cx('font-semibold text-emerald-900 underline', focusRing)}
              >
                {t(lang, 'resendOtp')}
              </button>
            )}
            {otpSent ? <span className="text-stone-600">{t(lang, 'otpSentHint')}</span> : null}
          </div>

          {phase === 'verified' ? (
            <p className="mt-3 text-base font-medium text-emerald-900">{t(lang, 'verifySuccess')}</p>
          ) : (
            <button
              type="submit"
              disabled={otp.length !== 6 || busy}
              className={cx(
                'mt-5 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white transition-colors duration-150 hover:bg-emerald-900 disabled:bg-stone-300 disabled:text-stone-500',
                focusRing,
              )}
            >
              {t(lang, 'verifySubmit')}
            </button>
          )}
        </form>
      ) : null}

      {phase === 'verified' ? (
        <button
          type="button"
          onClick={onContinue}
          className={cx(
            'mt-5 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white transition-colors duration-150 hover:bg-emerald-900',
            focusRing,
          )}
        >
          {t(lang, 'continue')}
        </button>
      ) : null}

      {errorKey ? (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {t(lang, errorI18nKey(errorKey))}
        </p>
      ) : null}
    </div>
  )
}
