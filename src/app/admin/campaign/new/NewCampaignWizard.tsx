'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createCampaignDraft } from '@/app/admin/cms-actions'
import { AdminPageHeader } from '@/components/admin/AdminPrimitives'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-ui'

const STEPS = ['Basic information', 'Dates / source', 'Recipients', 'Email template', 'Concerns', 'Review']

export function NewCampaignWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title_ml: '',
    title_en: '',
    summary_ml: '',
    summary_en: '',
    source_url: '',
    reference_url: '',
    opens_at: '',
    deadline_at: '',
    recipient_emails: '',
    cc_emails: '',
    subject_ml: '',
    subject_en: '',
    intro_ml: '',
    intro_en: '',
    closing_ml: '',
    closing_en: '',
  })

  function patch(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const result = await createCampaignDraft({
      ...form,
      recipient_emails: form.recipient_emails.split('\n'),
      cc_emails: form.cc_emails.split('\n'),
      opens_at: form.opens_at || new Date().toISOString(),
      deadline_at: form.deadline_at || new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push('/admin/concerns')
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="New campaign" description="Always saved as Draft. It will not go live from this wizard." />
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? 'font-semibold text-emerald-800' : 'text-stone-500'}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {step === 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Name — Malayalam" value={form.title_ml} onChange={(v) => patch('title_ml', v)} />
          <Field label="Name — English" value={form.title_en} onChange={(v) => patch('title_en', v)} />
          <Area label="Summary — Malayalam" value={form.summary_ml} onChange={(v) => patch('summary_ml', v)} />
          <Area label="Summary — English" value={form.summary_en} onChange={(v) => patch('summary_en', v)} />
        </div>
      ) : null}
      {step === 1 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Official source URL" value={form.source_url} onChange={(v) => patch('source_url', v)} />
          <Field label="Reference URL" value={form.reference_url} onChange={(v) => patch('reference_url', v)} />
          <label className={adminLabel}>
            Opening date
            <input type="datetime-local" className={adminInput} value={form.opens_at} onChange={(e) => patch('opens_at', e.target.value)} />
          </label>
          <label className={adminLabel}>
            Deadline
            <input type="datetime-local" className={adminInput} value={form.deadline_at} onChange={(e) => patch('deadline_at', e.target.value)} />
          </label>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Area label="TO recipients (one per line)" value={form.recipient_emails} onChange={(v) => patch('recipient_emails', v)} />
          <Area label="CC recipients (one per line)" value={form.cc_emails} onChange={(v) => patch('cc_emails', v)} />
        </div>
      ) : null}
      {step === 3 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Subject — Malayalam" value={form.subject_ml} onChange={(v) => patch('subject_ml', v)} />
          <Field label="Subject — English" value={form.subject_en} onChange={(v) => patch('subject_en', v)} />
          <Area label="Intro — Malayalam" value={form.intro_ml} onChange={(v) => patch('intro_ml', v)} />
          <Area label="Intro — English" value={form.intro_en} onChange={(v) => patch('intro_en', v)} />
          <Area label="Closing — Malayalam" value={form.closing_ml} onChange={(v) => patch('closing_ml', v)} />
          <Area label="Closing — English" value={form.closing_en} onChange={(v) => patch('closing_en', v)} />
        </div>
      ) : null}
      {step === 4 ? (
        <div className="rounded-md border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-700">
          <p>Objection concerns are edited in the Concerns CMS after this campaign is saved as Draft.</p>
          <p className="mt-2">You can create, reorder, and disable concerns there without touching the database.</p>
        </div>
      ) : null}
      {step === 5 ? (
        <div className="rounded-md border border-stone-200 bg-white p-4 text-sm">
          <p className="font-medium">{form.title_en || form.title_ml || 'Untitled'}</p>
          <p className="mt-2 text-stone-600">This campaign will be saved as Draft. It will not go live from this wizard.</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        {step > 0 ? (
          <button type="button" className={adminBtnSecondary} onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button type="button" className={adminBtnPrimary} onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button type="button" className={adminBtnPrimary} onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={adminLabel}>
      {label}
      <input className={adminInput} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={adminLabel}>
      {label}
      <textarea className={`${adminInput} min-h-24 py-2`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
