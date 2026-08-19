'use client'

import Link from 'next/link'
import { useState } from 'react'

import { moderateCustomText } from '@/app/admin/actions'
import { AdminCard, AdminPageHeader } from '@/components/admin/AdminPrimitives'
import { adminBtnSecondary, adminFocus } from '@/components/admin/admin-ui'
import { dash, formatAdminDateTime } from '@/lib/admin/format'
import { DISPLAY_STAGE_LABEL, sendMethodLabel } from '@/lib/admin/stages'
import type { SubmissionDetail } from '@/lib/admin/queries'

async function copyText(value: string) {
  await navigator.clipboard.writeText(value)
}

export function SubmissionRecord({ detail }: { detail: SubmissionDetail }) {
  const [copied, setCopied] = useState('')

  async function copy(label: string, value: string) {
    try {
      await copyText(value)
      setCopied(label)
    } catch {
      setCopied('failed')
    }
  }

  const timeline = [
    { label: 'Created', at: detail.created_at },
    { label: 'Prepared', at: detail.verified_at },
    { label: 'Email opened', at: detail.handoff_at },
    { label: 'Confirmed sent', at: detail.confirmed_at },
  ].filter((item) => item.at)

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={detail.full_name || 'Submission'}
        description={`${DISPLAY_STAGE_LABEL[detail.stage]} · ${detail.is_test ? 'Test' : 'Live'}`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Citizen">
          <Meta label="Name" value={dash(detail.full_name)} />
          <Meta label="Email" value={dash(detail.email)} />
          <Meta label="Phone" value={dash(detail.phone_e164)} />
          <Meta label="Address" value={dash(detail.address_line)} />
          <div className="mt-3 flex gap-2">
            {detail.email ? (
              <button type="button" className={adminBtnSecondary} onClick={() => void copy('email', detail.email!)}>
                Copy email
              </button>
            ) : null}
            {detail.phone_e164 ? (
              <button type="button" className={adminBtnSecondary} onClick={() => void copy('phone', detail.phone_e164!)}>
                Copy phone
              </button>
            ) : null}
          </div>
        </AdminCard>
        <AdminCard title="Location">
          <Meta label="Panchayat" value={dash(detail.panchayat)} />
          <Meta label="District" value={dash(detail.district)} />
          <Meta label="Pincode" value={dash(detail.pincode)} />
          <Meta label="Constituency" value={dash(detail.constituency_name)} />
        </AdminCard>
      </div>

      <AdminCard title="Participation">
        <Meta label="Stage" value={DISPLAY_STAGE_LABEL[detail.stage]} />
        <Meta label="Send method" value={sendMethodLabel(detail.send_method)} />
        <Meta label="Language" value={detail.language === 'en' ? 'English' : 'Malayalam'} />
        <Meta label="Test / Live" value={detail.is_test ? 'Test' : 'Live'} />
      </AdminCard>

      <AdminCard title="Selected concerns">
        {detail.clauses.length === 0 ? (
          <p className="text-sm text-stone-500">—</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {detail.clauses.map((clause, index) => (
              <li key={clause.id}>
                <Link href={`/admin/concerns/${clause.id}`} className={`text-emerald-800 underline ${adminFocus}`}>
                  {index + 1}. {clause.title_en}
                </Link>
                <span className="text-stone-500"> · {clause.section_ref ?? '—'}</span>
              </li>
            ))}
          </ol>
        )}
      </AdminCard>

      <AdminCard title="Personal comment">
        <p className="whitespace-pre-wrap text-sm">{dash(detail.custom_text)}</p>
        {detail.custom_text ? (
          <div className="mt-3 flex gap-2">
            <button type="button" className={adminBtnSecondary} onClick={() => void moderateCustomText(detail.id, true)}>
              Approve for public
            </button>
            <button type="button" className={adminBtnSecondary} onClick={() => void moderateCustomText(detail.id, false)}>
              Reject
            </button>
          </div>
        ) : null}
      </AdminCard>

      <AdminCard
        title="Generated email"
        action={
          <div className="flex gap-2">
            <button type="button" className={adminBtnSecondary} onClick={() => void copy('subject', detail.generated_subject)}>
              Copy subject
            </button>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() => void copy('email-body', `${detail.generated_subject}\n\n${detail.generated_body}`)}
            >
              Copy full email
            </button>
          </div>
        }
      >
        <p className="text-sm">
          <span className="font-medium">Subject:</span> {dash(detail.generated_subject)}
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-sm leading-relaxed">{dash(detail.generated_body)}</pre>
        {copied ? <p className="mt-2 text-xs text-emerald-800">{copied === 'failed' ? 'Copy failed' : 'Copied'}</p> : null}
      </AdminCard>

      <AdminCard title="Recipients at the time">
        <p className="text-sm">
          <span className="font-medium">TO:</span> {detail.generated_to.length ? detail.generated_to.join(', ') : '—'}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-medium">CC:</span> {detail.generated_cc.length ? detail.generated_cc.join(', ') : '—'}
        </p>
        {detail.reps.length > 0 ? (
          <ul className="mt-3 text-sm">
            {detail.reps.map((rep) => (
              <li key={`${rep.name_en}-${rep.official_email ?? ''}`}>
                {rep.name_ml} · {rep.level}
                {rep.official_email ? ` · ${rep.official_email}` : ''}
              </li>
            ))}
          </ul>
        ) : null}
      </AdminCard>

      <AdminCard title="Activity timeline">
        {timeline.length === 0 ? (
          <p className="text-sm text-stone-500">No timestamped events yet.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {timeline.map((item) => (
              <li key={item.label} className="flex justify-between gap-3">
                <span>{item.label}</span>
                <span className="tabular-nums text-stone-600">{formatAdminDateTime(item.at)}</span>
              </li>
            ))}
          </ol>
        )}
      </AdminCard>

      <AdminCard title="Consent">
        <Meta label="Consent at" value={formatAdminDateTime(detail.consent_at)} />
        <Meta label="Consent version" value={dash(detail.consent_version)} />
      </AdminCard>

      <AdminCard title="Technical metadata">
        <Meta label="Submission ID" value={detail.id} />
        <Meta label="User agent" value={dash(detail.user_agent)} />
        <Meta label="IP hash" value={dash(detail.ip_hash)} />
      </AdminCard>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="font-medium text-stone-700">{label}:</span> {value}
    </p>
  )
}
