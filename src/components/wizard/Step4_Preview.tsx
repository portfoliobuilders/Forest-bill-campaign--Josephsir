'use client'

import { useMemo, useState } from 'react'

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
import { normalizeIndianPhone } from '@/lib/phone'
import type { Campaign, ObjectionClause, WizardRouting } from '@/types/database'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

const btnBase = `inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-md px-3 text-center text-base font-semibold transition-colors duration-150 ${focusRing}`

function downloadPdf(): null {
  return null
}

export function Step4_Preview({
  campaign,
  clauses,
  details,
  routing,
}: {
  campaign: Campaign
  clauses: ObjectionClause[]
  details: DetailsFields
  routing: WizardRouting
}) {
  const { lang } = useLang()
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

  const optedIn =
    routing.ccMla &&
    routing.constituencyId !== null &&
    Boolean(routing.representative?.official_email?.trim()) &&
    routing.representative !== null &&
    routing.ccRepresentativeIds.includes(routing.representative.id)

  const mailParams = withRepresentativeCc(
    {
      to: campaign.recipient_email,
      cc: campaign.cc_emails,
      subject: composed.subject,
      body: composed.body,
    },
    routing.representative?.official_email,
    optedIn,
  )
  const gmailHref = gmailComposeUrl(mailParams)
  const mailtoHref = mailtoUrl(mailParams)
  const urlLength = estimateUrlLength(mailParams)
  const urlTooLong = urlLength > URL_LENGTH_WARN
  const tooLong = composed.error === 'too_long'
  const overAmber = composed.charCount > 1300
  const atLimit = composed.charCount >= MAX_BODY_CHARS

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(composed.body)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">{t(lang, 'preview')}</h2>

      <div className="mt-4 space-y-1 text-base">
        <p>
          <span className="font-medium">{t(lang, 'toLabel')}: </span>
          <span className="select-all">{campaign.recipient_email}</span>
        </p>
        {mailParams.cc.length > 0 ? (
          <p>
            <span className="font-medium">{t(lang, 'ccLabel')}: </span>
            <span className="select-all">{mailParams.cc.join(', ')}</span>
          </p>
        ) : null}
      </div>

      <pre className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-stone-400 bg-white p-3 font-mono text-sm leading-relaxed text-stone-900">
        {composed.body}
      </pre>

      <p
        className={cx(
          'mt-2 text-base font-medium',
          atLimit && 'text-red-700',
          overAmber && !atLimit && 'text-amber-700',
          !overAmber && 'text-stone-700',
        )}
      >
        {composed.charCount}/{MAX_BODY_CHARS} {t(lang, 'charsUsed')}
      </p>

      {tooLong ? <p className="mt-2 text-base text-red-800">{t(lang, 'tooLongBody')}</p> : null}
      {urlTooLong ? <p className="mt-2 text-sm text-amber-800">{t(lang, 'urlTooLong')}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {tooLong ? (
          <button type="button" disabled className={cx(btnBase, 'bg-stone-300 text-stone-500')}>
            {t(lang, 'sendGmail')}
          </button>
        ) : (
          <a
            href={gmailHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(btnBase, 'bg-emerald-800 text-white hover:bg-emerald-900')}
          >
            {t(lang, 'sendGmail')}
          </a>
        )}

        {tooLong ? (
          <button type="button" disabled className={cx(btnBase, 'bg-stone-300 text-stone-500')}>
            {t(lang, 'sendMailto')}
          </button>
        ) : (
          <a href={mailtoHref} className={cx(btnBase, 'border border-emerald-800 bg-white text-emerald-900 hover:bg-emerald-50')}>
            {t(lang, 'sendMailto')}
          </a>
        )}

        <button
          type="button"
          onClick={() => void copyBody()}
          className={cx(btnBase, 'border border-stone-400 bg-white text-stone-900 hover:bg-stone-100')}
        >
          {copyState === 'copied' ? t(lang, 'copied') : t(lang, 'copyText')}
        </button>

        <button
          type="button"
          disabled
          onClick={() => downloadPdf()}
          title={t(lang, 'pdfUnavailable')}
          className={cx(btnBase, 'cursor-not-allowed bg-stone-200 text-stone-500')}
        >
          {t(lang, 'downloadPdf')}
        </button>
      </div>
      {copyState === 'failed' ? <p className="mt-2 text-sm text-red-700">{t(lang, 'copyFailed')}</p> : null}
    </div>
  )
}
