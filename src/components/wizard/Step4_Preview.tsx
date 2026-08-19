'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { markHandoff } from '@/app/actions/submission'
import { IconCopy, IconEnvelope, IconGmail } from '@/components/ui/icons'
import { useLang } from '@/components/LanguageProvider'
import {
  composeEmail,
  estimateUrlLength,
  gmailComposeUrl,
  mailtoUrl,
  MAX_BODY_CHARS,
  URL_LENGTH_WARN,
  withRepresentativeCc,
} from '@/lib/compose'
import { cx } from '@/lib/cx'
import type { DetailsFields } from '@/lib/details-schema'
import { t } from '@/lib/i18n'
import { PDF_LETTER_AVAILABLE } from '@/lib/pdf-available'
import { normalizeIndianPhone } from '@/lib/phone'
import { btnGhost, btnPrimary, btnSecondary } from '@/lib/ui'
import type { WizardMode } from '@/lib/wizard-mode'
import type { Campaign, ObjectionClause, WizardRouting } from '@/types/database'

export function Step4_Preview({
  campaign,
  clauses,
  details,
  routing,
  submissionId,
  mode,
  testerEmail,
  onEditDetails,
}: {
  campaign: Campaign
  clauses: ObjectionClause[]
  details: DetailsFields
  routing: WizardRouting
  submissionId: string | null
  mode: WizardMode
  testerEmail: string | null
  onEditDetails: () => void
}) {
  const { lang } = useLang()
  const router = useRouter()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const composed = useMemo(() => {
    return composeEmail({
      campaign,
      clauses,
      details: {
        fullName: details.fullName,
        addressLine: details.addressLine,
        panchayat: details.panchayat,
        district: details.district,
        pincode: details.pincode,
        phone: normalizeIndianPhone(details.phone) ?? details.phone,
        customText: details.customText,
      },
      lang,
    })
  }, [campaign, clauses, details, lang])

  const isPreview = mode === 'preview'
  const testerTo = (testerEmail ?? details.email).trim()

  const optedIn =
    !isPreview &&
    routing.ccMla &&
    routing.constituencyId !== null &&
    Boolean(routing.representative?.official_email?.trim()) &&
    routing.representative !== null &&
    routing.ccRepresentativeIds.includes(routing.representative.id)

  const liveParams = withRepresentativeCc(
    {
      to: campaign.recipient_email,
      cc: campaign.cc_emails,
      subject: composed.subject,
      body: composed.body,
    },
    routing.representative?.official_email,
    optedIn,
  )

  const mailParams = isPreview
    ? { to: testerTo, cc: [] as string[], subject: composed.subject, body: composed.body }
    : liveParams

  const gmailHref = gmailComposeUrl(mailParams)
  const mailtoHref = mailtoUrl(mailParams)
  const urlLength = estimateUrlLength(mailParams)
  const urlTooLong = urlLength > URL_LENGTH_WARN
  const tooLong = composed.error === 'too_long'
  const overAmber = composed.charCount > 1300
  const atLimit = composed.charCount >= MAX_BODY_CHARS
  const sendDisabled = tooLong || !mailParams.to

  async function openHandoff(method: 'gmail_web' | 'mailto' | 'copy', href?: string) {
    if (href && method === 'gmail_web') {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else if (href && method === 'mailto') {
      window.location.href = href
    }

    if (submissionId) {
      await markHandoff(submissionId, method)
      if (method !== 'mailto') {
        router.push(`/sent?id=${submissionId}`)
      }
    }
  }

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(composed.body)
      setCopyState('copied')
      await openHandoff('copy')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'letterTitle')}</h1>
          <p className="mt-2 text-base leading-relaxed text-body">{t(lang, 'letterSupport')}</p>
        </div>
        <button type="button" onClick={onEditDetails} className={cx(btnGhost, 'shrink-0 self-start')}>
          {t(lang, 'editDetails')}
        </button>
      </div>
      {isPreview ? <p className="mt-3 text-base leading-relaxed text-amber-900">{t(lang, 'demoLetterHint')}</p> : null}

      <dl className="mt-5 space-y-1 text-sm sm:text-base">
        <div>
          <dt className="inline font-semibold text-ink">{t(lang, 'toLabel')}: </dt>
          <dd className="inline select-all text-body">{mailParams.to}</dd>
        </div>
        {mailParams.cc.length > 0 ? (
          <div>
            <dt className="inline font-semibold text-ink">{t(lang, 'ccLabel')}: </dt>
            <dd className="inline select-all text-body">{mailParams.cc.join(', ')}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-semibold text-ink">{t(lang, 'subjectLabel')}: </dt>
          <dd className="inline text-body">{mailParams.subject}</dd>
        </div>
      </dl>

      <pre
        className={cx(
          'mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-[8px] border border-rule bg-raised p-4 text-sm leading-relaxed text-ink sm:text-base',
          lang === 'en' && 'font-serif',
        )}
      >
        {composed.body}
      </pre>

      <p
        className={cx(
          'mt-2 text-sm font-medium',
          atLimit && 'text-red-800',
          overAmber && !atLimit && 'text-amber-800',
          !overAmber && 'text-muted',
        )}
      >
        {composed.charCount}/{MAX_BODY_CHARS} {t(lang, 'charsUsed')}
      </p>

      {tooLong ? <p className="mt-2 text-base text-red-800">{t(lang, 'tooLongBody')}</p> : null}
      {urlTooLong ? <p className="mt-2 text-sm text-amber-800">{t(lang, 'urlTooLong')}</p> : null}

      <p className="mt-5 text-sm leading-relaxed text-muted">{t(lang, 'trustLine')}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <span className="flex flex-1" title={sendDisabled ? t(lang, 'sendDisabledTooltip') : undefined}>
          <button
            type="button"
            disabled={sendDisabled}
            onClick={() => void openHandoff('gmail_web', gmailHref)}
            className={cx(btnPrimary, 'w-full')}
          >
            <IconGmail className="size-5 shrink-0" />
            {t(lang, 'sendGmail')}
          </button>
        </span>

        <span className="flex flex-1" title={sendDisabled ? t(lang, 'sendDisabledTooltip') : undefined}>
          <button
            type="button"
            disabled={sendDisabled}
            onClick={() => void openHandoff('mailto', mailtoHref)}
            className={cx(btnSecondary, 'w-full')}
          >
            <IconEnvelope className="size-4 shrink-0" />
            {t(lang, 'sendMailto')}
          </button>
        </span>

        <span className="flex flex-1" title={sendDisabled ? t(lang, 'sendDisabledTooltip') : undefined}>
          <button
            type="button"
            disabled={sendDisabled}
            onClick={() => void copyBody()}
            className={cx(btnGhost, 'w-full')}
          >
            <IconCopy className="size-4 shrink-0" />
            {copyState === 'copied' ? t(lang, 'copied') : t(lang, 'copyText')}
          </button>
        </span>
      </div>
      <p className="sr-only" aria-live="polite">
        {copyState === 'copied' ? t(lang, 'copied') : copyState === 'failed' ? t(lang, 'copyFailed') : ''}
      </p>
      {copyState === 'failed' ? <p className="mt-2 text-sm text-red-800">{t(lang, 'copyFailed')}</p> : null}

      <button
        type="button"
        disabled={!PDF_LETTER_AVAILABLE || sendDisabled}
        title={t(lang, 'pdfUnavailable')}
        className={cx(btnGhost, 'mt-3 w-full sm:w-auto', (!PDF_LETTER_AVAILABLE || sendDisabled) && 'opacity-50')}
      >
        {t(lang, 'downloadPdf')}
      </button>
    </div>
  )
}
