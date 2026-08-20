'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  deleteConcernStudio,
  previewPathFor,
  saveCampaignStudio,
  saveConcernStudio,
  setCampaignStatus,
} from '@/app/admin/campaign-actions'
import { reorderConcerns } from '@/app/admin/cms-actions'
import { AdminPageHeader, ConfirmDialog, SaveStatus, SuccessBanner } from '@/components/admin/AdminPrimitives'
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-ui'
import { formatDatetimeLocal } from '@/lib/admin/format'
import { CAMPAIGN_STATUS_LABEL, type CampaignStatus } from '@/lib/campaign-status'
import { DEFAULT_FORM_FIELDS } from '@/lib/form-fields'
import { recipientsOfType } from '@/lib/recipients'
import type { Campaign, CampaignFormField, CampaignRecipient, ObjectionClause } from '@/types/database'

const TABS = [
  'Basic Details',
  'English Content',
  'Malayalam Content',
  'Concerns',
  'Email Recipients',
  'Form Fields',
  'Schedule & Status',
  'Preview',
] as const

type ConcernDraft = {
  id?: string
  code?: string
  title_en: string
  title_ml: string
  content_en: string
  content_ml: string
  email_subject_en: string
  email_subject_ml: string
  email_body_en: string
  email_body_ml: string
  is_active: boolean
  display_order: number
}

function fromClause(clause: ObjectionClause): ConcernDraft {
  return {
    id: clause.id,
    code: clause.code,
    title_en: clause.title_en,
    title_ml: clause.title_ml,
    content_en: clause.full_text_en || clause.explain_en,
    content_ml: clause.full_text_ml || clause.explain_ml,
    email_subject_en: clause.email_subject_en || '',
    email_subject_ml: clause.email_subject_ml || '',
    email_body_en: clause.email_body_en || clause.email_en,
    email_body_ml: clause.email_body_ml || clause.email_ml,
    is_active: clause.is_active,
    display_order: clause.sort_order,
  }
}

export function CampaignStudio({
  campaign,
  concerns,
  recipients,
  formFields,
  initialTab = 0,
}: {
  campaign: Campaign
  concerns: ObjectionClause[]
  recipients: CampaignRecipient[]
  formFields: CampaignFormField[]
  initialTab?: number
}) {
  const router = useRouter()
  const [tab, setTab] = useState(initialTab)
  const [status, setStatus] = useState<CampaignStatus>(campaign.status)
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [publishOpen, setPublishOpen] = useState(false)
  const [form, setForm] = useState({
    slug: campaign.slug,
    title_en: campaign.title_en,
    title_ml: campaign.title_ml,
    summary_en: campaign.summary_en,
    summary_ml: campaign.summary_ml,
    homepage_intro_en: campaign.homepage_intro_en,
    homepage_intro_ml: campaign.homepage_intro_ml,
    source_url: campaign.source_url,
    reference_url: campaign.reference_url ?? '',
    opens_at: formatDatetimeLocal(campaign.opens_at),
    deadline_at: formatDatetimeLocal(campaign.deadline_at),
    allow_multiple_concerns: campaign.allow_multiple_concerns,
    subject_en: campaign.subject_en,
    subject_ml: campaign.subject_ml,
    intro_en: campaign.intro_en,
    intro_ml: campaign.intro_ml,
    closing_en: campaign.closing_en,
    closing_ml: campaign.closing_ml,
    body_template_en: campaign.body_template_en,
    body_template_ml: campaign.body_template_ml,
    reply_to_email: campaign.reply_to_email ?? '',
    og_title_en: campaign.og_title_en,
    og_title_ml: campaign.og_title_ml,
    og_description_en: campaign.og_description_en,
    og_description_ml: campaign.og_description_ml,
    to_emails: recipientsOfType(recipients, 'to').join('\n') || campaign.recipient_emails.join('\n'),
    cc_emails: recipientsOfType(recipients, 'cc').join('\n') || campaign.cc_emails.join('\n'),
    bcc_emails: recipientsOfType(recipients, 'bcc').join('\n') || (campaign.bcc_emails ?? []).join('\n'),
  })
  const [fields, setFields] = useState(
    (formFields.length > 0 ? formFields : DEFAULT_FORM_FIELDS).map((field, index) => ({
      field_key: field.field_key,
      label_en: field.label_en,
      label_ml: field.label_ml,
      is_enabled: field.is_enabled,
      is_required: field.is_required,
      display_order: field.display_order || index + 1,
    })),
  )
  const [clauseDrafts, setClauseDrafts] = useState<ConcernDraft[]>(concerns.map(fromClause))
  const [editing, setEditing] = useState<ConcernDraft | null>(null)

  useEffect(() => {
    setClauseDrafts(concerns.map(fromClause))
  }, [concerns])

  function patch(next: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...next }))
    setSaveState('unsaved')
  }

  async function save() {
    setSaveState('saving')
    const result = await saveCampaignStudio({
      id: campaign.id,
      ...form,
      to_emails: form.to_emails.split(/[\n,;]+/),
      cc_emails: form.cc_emails.split(/[\n,;]+/),
      bcc_emails: form.bcc_emails.split(/[\n,;]+/),
      form_fields: fields,
    })
    if (!result.ok) {
      setSaveState('error')
      setMessage(result.error)
      return false
    }
    setSaveState('saved')
    setMessage('Campaign saved.')
    router.refresh()
    return true
  }

  async function publish() {
    const saved = await save()
    if (!saved) return
    const result = await setCampaignStatus(campaign.id, 'active', true)
    if (!result.ok) {
      setSaveState('error')
      setMessage(result.error)
      return
    }
    setStatus('active')
    setPublishOpen(false)
    setMessage('Campaign published.')
    router.refresh()
  }

  async function saveConcern() {
    if (!editing) return
    const result = await saveConcernStudio({
      ...editing,
      campaign_id: campaign.id,
    })
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setEditing(null)
    setMessage('Concern saved.')
    router.refresh()
  }

  const preview = useMemo(
    () => ({
      title: form.title_en,
      titleMl: form.title_ml,
      body: form.homepage_intro_en,
      bodyMl: form.homepage_intro_ml,
      to: form.to_emails,
      cc: form.cc_emails,
    }),
    [form],
  )

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={form.title_en || 'Campaign editor'}
        description={`Status: ${CAMPAIGN_STATUS_LABEL[status]} · /campaign/${form.slug}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={adminBtnSecondary} onClick={() => void save()}>
              Save Draft
            </button>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() =>
                void previewPathFor(campaign.id).then((result) => {
                  if (result.ok && result.url) window.open(result.url, '_blank', 'noopener,noreferrer')
                  else if (!result.ok) setMessage(result.error)
                })
              }
            >
              Preview
            </button>
            <button type="button" className={adminBtnPrimary} onClick={() => setPublishOpen(true)}>
              Publish Campaign
            </button>
          </div>
        }
      />
      <SaveStatus state={saveState} />
      {message ? <SuccessBanner>{message}</SuccessBanner> : null}

      <div className="flex flex-wrap gap-1">
        {TABS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`rounded-md px-3 py-2 text-sm ${tab === index ? 'bg-emerald-800 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200'}`}
            onClick={() => setTab(index)}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {tab === 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Campaign name — English" value={form.title_en} onChange={(v) => patch({ title_en: v })} />
          <Field label="Campaign name — Malayalam" value={form.title_ml} onChange={(v) => patch({ title_ml: v })} />
          <Field label="Slug" value={form.slug} onChange={(v) => patch({ slug: v })} />
          <label className={adminLabel}>
            Allow multiple concerns
            <input
              type="checkbox"
              className="ml-2"
              checked={form.allow_multiple_concerns}
              onChange={(e) => patch({ allow_multiple_concerns: e.target.checked })}
            />
          </label>
          <Area label="Short description — English" value={form.summary_en} onChange={(v) => patch({ summary_en: v })} />
          <Area label="Short description — Malayalam" value={form.summary_ml} onChange={(v) => patch({ summary_ml: v })} />
        </div>
      ) : null}

      {tab === 1 ? (
        <div className="grid gap-3">
          <Area label="Detailed content — English" value={form.homepage_intro_en} onChange={(v) => patch({ homepage_intro_en: v })} tall />
          <Field label="Default subject — English" value={form.subject_en} onChange={(v) => patch({ subject_en: v })} />
          <Area label="Email introduction — English" value={form.intro_en} onChange={(v) => patch({ intro_en: v })} />
          <Area label="Email closing — English" value={form.closing_en} onChange={(v) => patch({ closing_en: v })} />
          <Area label="Email body template — English" value={form.body_template_en} onChange={(v) => patch({ body_template_en: v })} tall />
          <Field label="Open Graph title — English" value={form.og_title_en} onChange={(v) => patch({ og_title_en: v })} />
          <Area label="Open Graph description — English" value={form.og_description_en} onChange={(v) => patch({ og_description_en: v })} />
        </div>
      ) : null}

      {tab === 2 ? (
        <div className="grid gap-3">
          <Area label="Detailed content — Malayalam" value={form.homepage_intro_ml} onChange={(v) => patch({ homepage_intro_ml: v })} tall />
          <Field label="Default subject — Malayalam" value={form.subject_ml} onChange={(v) => patch({ subject_ml: v })} />
          <Area label="Email introduction — Malayalam" value={form.intro_ml} onChange={(v) => patch({ intro_ml: v })} />
          <Area label="Email closing — Malayalam" value={form.closing_ml} onChange={(v) => patch({ closing_ml: v })} />
          <Area label="Email body template — Malayalam" value={form.body_template_ml} onChange={(v) => patch({ body_template_ml: v })} tall />
          <Field label="Open Graph title — Malayalam" value={form.og_title_ml} onChange={(v) => patch({ og_title_ml: v })} />
          <Area label="Open Graph description — Malayalam" value={form.og_description_ml} onChange={(v) => patch({ og_description_ml: v })} />
        </div>
      ) : null}

      {tab === 3 ? (
        <div className="space-y-4">
          <button
            type="button"
            className={adminBtnPrimary}
            onClick={() =>
              setEditing({
                title_en: '',
                title_ml: '',
                content_en: '',
                content_ml: '',
                email_subject_en: '',
                email_subject_ml: '',
                email_body_en: '',
                email_body_ml: '',
                is_active: true,
                display_order: clauseDrafts.length + 1,
              })
            }
          >
            Add concern
          </button>
          <ul className="space-y-2">
            {clauseDrafts.map((clause, index) => (
              <li key={clause.id ?? `new-${index}`} className="rounded-md border border-stone-200 bg-white p-3">
                <p className="font-medium text-stone-900">
                  {String(index + 1).padStart(2, '0')} {clause.code ? `${clause.code} · ` : ''}
                  {clause.title_en}
                </p>
                <p className="text-sm text-stone-600">{clause.title_ml}</p>
                <p className="mt-1 text-xs text-stone-500">{clause.is_active ? 'Active' : 'Inactive'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className={adminBtnSecondary} onClick={() => setEditing(clause)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className={adminBtnSecondary}
                    onClick={() => {
                      const next = [...clauseDrafts]
                      if (index === 0) return
                      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                      setClauseDrafts(next)
                      const ids = next.map((item) => item.id).filter(Boolean) as string[]
                      void reorderConcerns(campaign.id, ids)
                    }}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className={adminBtnSecondary}
                    onClick={() =>
                      void saveConcernStudio({
                        ...clause,
                        campaign_id: campaign.id,
                        is_active: !clause.is_active,
                      }).then(() => router.refresh())
                    }
                  >
                    {clause.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  {clause.id ? (
                    <button
                      type="button"
                      className={adminBtnDanger}
                      onClick={() =>
                        void deleteConcernStudio(clause.id!).then((result) => {
                          if (!result.ok) setMessage(result.error)
                          else router.refresh()
                        })
                      }
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {editing ? (
            <div className="rounded-md border border-stone-300 bg-stone-50 p-4">
              <h2 className="font-semibold text-stone-900">{editing.id ? 'Edit concern' : 'New concern'}</h2>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <Field label="Title — English" value={editing.title_en} onChange={(v) => setEditing({ ...editing, title_en: v })} />
                <Field label="Title — Malayalam" value={editing.title_ml} onChange={(v) => setEditing({ ...editing, title_ml: v })} />
                <Area label="English content" value={editing.content_en} onChange={(v) => setEditing({ ...editing, content_en: v })} tall />
                <Area label="Malayalam content" value={editing.content_ml} onChange={(v) => setEditing({ ...editing, content_ml: v })} tall />
                <Field label="Optional subject — English" value={editing.email_subject_en} onChange={(v) => setEditing({ ...editing, email_subject_en: v })} />
                <Field label="Optional subject — Malayalam" value={editing.email_subject_ml} onChange={(v) => setEditing({ ...editing, email_subject_ml: v })} />
                <Area label="Optional email body — English" value={editing.email_body_en} onChange={(v) => setEditing({ ...editing, email_body_en: v })} />
                <Area label="Optional email body — Malayalam" value={editing.email_body_ml} onChange={(v) => setEditing({ ...editing, email_body_ml: v })} />
                <label className={adminLabel}>
                  Active
                  <input
                    type="checkbox"
                    className="ml-2"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" className={adminBtnPrimary} onClick={() => void saveConcern()}>
                  Save concern
                </button>
                <button type="button" className={adminBtnSecondary} onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 4 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <Area label="TO recipients (one per line)" value={form.to_emails} onChange={(v) => patch({ to_emails: v })} tall />
          <Area label="CC recipients (one per line)" value={form.cc_emails} onChange={(v) => patch({ cc_emails: v })} tall />
          <Area label="BCC recipients (one per line)" value={form.bcc_emails} onChange={(v) => patch({ bcc_emails: v })} tall />
          <Field label="Reply-to" value={form.reply_to_email} onChange={(v) => patch({ reply_to_email: v })} />
        </div>
      ) : null}

      {tab === 5 ? (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.field_key} className="grid gap-2 rounded-md border border-stone-200 bg-white p-3 lg:grid-cols-4">
              <p className="font-medium text-stone-800">{field.field_key}</p>
              <Field label="Label EN" value={field.label_en} onChange={(v) => setFields(fields.map((item, i) => (i === index ? { ...item, label_en: v } : item)))} />
              <Field label="Label ML" value={field.label_ml} onChange={(v) => setFields(fields.map((item, i) => (i === index ? { ...item, label_ml: v } : item)))} />
              <label className="text-sm text-stone-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={field.is_enabled}
                  onChange={(e) => setFields(fields.map((item, i) => (i === index ? { ...item, is_enabled: e.target.checked } : item)))}
                />
                Enabled
              </label>
              <label className="text-sm text-stone-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={field.is_required}
                  onChange={(e) => setFields(fields.map((item, i) => (i === index ? { ...item, is_required: e.target.checked } : item)))}
                />
                Required
              </label>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 6 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Start date" type="datetime-local" value={form.opens_at} onChange={(v) => patch({ opens_at: v })} />
          <Field label="End date" type="datetime-local" value={form.deadline_at} onChange={(v) => patch({ deadline_at: v })} />
          <Field label="Official source URL" value={form.source_url} onChange={(v) => patch({ source_url: v })} />
          <Field label="Reference URL" value={form.reference_url} onChange={(v) => patch({ reference_url: v })} />
          <label className={adminLabel}>
            Status
            <select
              className={adminInput}
              value={status}
              onChange={(e) => {
                const next = e.target.value as CampaignStatus
                void setCampaignStatus(campaign.id, next, true).then((result) => {
                  if (!result.ok) setMessage(result.error)
                  else {
                    setStatus(next)
                    setMessage(`Campaign is now ${CAMPAIGN_STATUS_LABEL[next]}.`)
                    router.refresh()
                  }
                })
              }}
            >
              {Object.entries(CAMPAIGN_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {tab === 7 ? (
        <div className="space-y-4 rounded-md border border-stone-200 bg-white p-4">
          <p className="font-mono text-xs text-stone-500">{status.toUpperCase()}</p>
          <h2 className="text-2xl font-semibold text-stone-900">{preview.title}</h2>
          <p className="text-lg text-stone-800">{preview.titleMl}</p>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{preview.body}</pre>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{preview.bodyMl}</pre>
          <p className="text-sm text-stone-600">TO: {preview.to || '—'}</p>
          <p className="text-sm text-stone-600">CC: {preview.cc || '—'}</p>
          <p className="text-sm text-stone-600">BCC: {form.bcc_emails || '—'}</p>
          <p className="text-sm text-stone-600">Concerns: {clauseDrafts.filter((c) => c.is_active).length} active</p>
        </div>
      ) : null}

      {publishOpen ? (
        <ConfirmDialog
          title="Publish this campaign?"
          confirmLabel="Publish"
          onCancel={() => setPublishOpen(false)}
          onConfirm={() => void publish()}
        >
          Publishing makes this campaign publicly actionable. Confirm that the copy, concerns, dates, and recipients are correct.
        </ConfirmDialog>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className={adminLabel}>
      {label}
      <input type={type} className={adminInput} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Area({
  label,
  value,
  onChange,
  tall,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  tall?: boolean
}) {
  return (
    <label className={adminLabel}>
      {label}
      <textarea className={`${adminInput} ${tall ? 'min-h-40' : 'min-h-24'} py-2`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
