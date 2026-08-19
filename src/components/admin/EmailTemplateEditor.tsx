'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { saveEmailTemplate } from '@/app/admin/cms-actions'
import { AdminCard, AdminPageHeader, SaveStatus, SuccessBanner } from '@/components/admin/AdminPrimitives'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-ui'
import { composeEmail, gmailComposeUrl, liveMailTargets, resolveMailTargets } from '@/lib/compose'
import { EMAIL_PLACEHOLDERS, defaultBodyTemplate } from '@/lib/email-template'
import type { Campaign, ObjectionClause } from '@/types/database'

const SAMPLE = {
  fullName: 'Ravi Kumar',
  addressLine: 'Ward 4, example house',
  panchayat: 'Vandiperiyar',
  district: 'Idukki',
  pincode: '685533',
  phone: '9876543210',
  email: 'citizen@example.com',
  customText: 'Our farm is on the forest boundary.',
}

export function EmailTemplateEditor({
  campaign,
  clauses,
  adminEmail,
}: {
  campaign: Campaign
  clauses: ObjectionClause[]
  adminEmail: string
}) {
  const router = useRouter()
  const [to, setTo] = useState(campaign.recipient_emails.join('\n') || campaign.recipient_email)
  const [cc, setCc] = useState(campaign.cc_emails.join('\n'))
  const [subjectMl, setSubjectMl] = useState(campaign.subject_ml)
  const [subjectEn, setSubjectEn] = useState(campaign.subject_en)
  const [introMl, setIntroMl] = useState(campaign.intro_ml)
  const [introEn, setIntroEn] = useState(campaign.intro_en)
  const [closingMl, setClosingMl] = useState(campaign.closing_ml)
  const [closingEn, setClosingEn] = useState(campaign.closing_en)
  const [templateMl, setTemplateMl] = useState(campaign.body_template_ml || defaultBodyTemplate('ml'))
  const [templateEn, setTemplateEn] = useState(campaign.body_template_en || defaultBodyTemplate('en'))
  const [lang, setLang] = useState<'ml' | 'en'>('ml')
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function mark() {
    setSaveState('unsaved')
  }

  const draftCampaign = useMemo<Campaign>(
    () => ({
      ...campaign,
      recipient_emails: to.split('\n'),
      cc_emails: cc.split('\n'),
      subject_ml: subjectMl,
      subject_en: subjectEn,
      intro_ml: introMl,
      intro_en: introEn,
      closing_ml: closingMl,
      closing_en: closingEn,
      body_template_ml: templateMl,
      body_template_en: templateEn,
    }),
    [campaign, to, cc, subjectMl, subjectEn, introMl, introEn, closingMl, closingEn, templateMl, templateEn],
  )

  const preview = useMemo(
    () =>
      composeEmail({
        campaign: draftCampaign,
        clauses: clauses.slice(0, 3),
        details: SAMPLE,
        lang,
      }),
    [draftCampaign, clauses, lang],
  )

  const live = liveMailTargets(draftCampaign)
  const testTargets = resolveMailTargets({ campaign: draftCampaign, mode: 'preview', testerEmail: adminEmail })

  async function handleSave() {
    setSaveState('saving')
    const result = await saveEmailTemplate({
      id: campaign.id,
      recipient_emails: to.split('\n'),
      cc_emails: cc.split('\n'),
      subject_ml: subjectMl,
      subject_en: subjectEn,
      intro_ml: introMl,
      intro_en: introEn,
      closing_ml: closingMl,
      closing_en: closingEn,
      body_template_ml: templateMl,
      body_template_en: templateEn,
    })
    if (!result.ok) {
      setSaveState('error')
      setMessage(result.error)
      return
    }
    setSaveState('saved')
    setMessage('Email template saved.')
    router.refresh()
  }

  function openTestGmail() {
    const url = gmailComposeUrl({
      to: testTargets.to,
      cc: testTargets.cc,
      subject: `[TEST] ${preview.subject}`,
      body: preview.body,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email template"
        description="Controls the letter citizens send. Test preview never uses government addresses."
        actions={
          <button type="button" className={adminBtnPrimary} onClick={() => void handleSave()}>
            Save changes
          </button>
        }
      />
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={saveState} />
        {message ? <SuccessBanner>{message}</SuccessBanner> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className={adminLabel}>
          TO recipients (one email per line)
          <textarea className={`${adminInput} min-h-28 py-2`} value={to} onChange={(e) => { setTo(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          CC recipients (one email per line)
          <textarea className={`${adminInput} min-h-28 py-2`} value={cc} onChange={(e) => { setCc(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          Subject — Malayalam
          <input className={adminInput} value={subjectMl} onChange={(e) => { setSubjectMl(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          Subject — English
          <input className={adminInput} value={subjectEn} onChange={(e) => { setSubjectEn(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          Intro — Malayalam
          <textarea className={`${adminInput} min-h-24 py-2`} value={introMl} onChange={(e) => { setIntroMl(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          Intro — English
          <textarea className={`${adminInput} min-h-24 py-2`} value={introEn} onChange={(e) => { setIntroEn(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          Closing — Malayalam
          <textarea className={`${adminInput} min-h-24 py-2`} value={closingMl} onChange={(e) => { setClosingMl(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          Closing — English
          <textarea className={`${adminInput} min-h-24 py-2`} value={closingEn} onChange={(e) => { setClosingEn(e.target.value); mark() }} />
        </label>
      </div>

      <p className="text-xs text-stone-500">
        Placeholders: {EMAIL_PLACEHOLDERS.map((item) => `{{${item}}}`).join(' ')}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className={adminLabel}>
          Body template — Malayalam
          <textarea className={`${adminInput} min-h-64 py-2 font-mono text-xs`} value={templateMl} onChange={(e) => { setTemplateMl(e.target.value); mark() }} />
        </label>
        <label className={adminLabel}>
          Body template — English
          <textarea className={`${adminInput} min-h-64 py-2 font-mono text-xs`} value={templateEn} onChange={(e) => { setTemplateEn(e.target.value); mark() }} />
        </label>
      </div>

      <AdminCard
        title="Template preview"
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={lang === 'ml' ? adminBtnPrimary : adminBtnSecondary} onClick={() => setLang('ml')}>
              Preview Malayalam
            </button>
            <button type="button" className={lang === 'en' ? adminBtnPrimary : adminBtnSecondary} onClick={() => setLang('en')}>
              Preview English
            </button>
            <button type="button" className={adminBtnSecondary} onClick={openTestGmail}>
              Open test in Gmail
            </button>
          </div>
        }
      >
        <p className="text-xs text-stone-500">
          Live TO: {live.to.join(', ') || '—'} · Live CC: {live.cc.join(', ') || '—'}
        </p>
        <p className="mt-1 text-xs font-medium text-amber-800">
          Test Gmail sends only to {adminEmail}. Government recipients are not contacted.
        </p>
        <p className="mt-3 text-sm">
          <span className="font-medium">To:</span> {testTargets.to.join(', ')}
        </p>
        <p className="text-sm">
          <span className="font-medium">CC:</span> {testTargets.cc.join(', ') || '—'}
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium">Subject:</span> {preview.subject}
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-relaxed">
          {preview.body}
        </pre>
      </AdminCard>
    </div>
  )
}
