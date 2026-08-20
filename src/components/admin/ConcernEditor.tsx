'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { saveConcern } from '@/app/admin/cms-actions'
import { AdminCard, AdminPageHeader, SaveStatus } from '@/components/admin/AdminPrimitives'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-ui'
import { composeEmail } from '@/lib/compose'
import type { Campaign, ObjectionClause } from '@/types/database'

export function ConcernEditor({
  campaign,
  concern,
}: {
  campaign: Campaign
  concern: Partial<ObjectionClause> & { id?: string; usage_count?: number }
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    code: concern.code ?? '',
    section_ref: concern.section_ref ?? '',
    title_ml: concern.title_ml ?? '',
    title_en: concern.title_en ?? '',
    explain_ml: concern.explain_ml ?? '',
    explain_en: concern.explain_en ?? '',
    email_ml: concern.email_ml ?? '',
    email_en: concern.email_en ?? '',
    full_text_ml: concern.full_text_ml ?? '',
    full_text_en: concern.full_text_en ?? '',
    full_url: concern.full_url ?? '',
    sort_order: String(concern.sort_order ?? 0),
    is_active: concern.is_active ?? true,
  })
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [previewLang, setPreviewLang] = useState<'ml' | 'en'>('ml')

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveState('unsaved')
  }

  const emailMlCount = [...form.email_ml].length
  const emailEnCount = [...form.email_en].length

  const preview = useMemo(() => {
    const clause: ObjectionClause = {
      id: concern.id ?? 'preview',
      campaign_id: campaign.id,
      code: form.code || 'PREVIEW',
      section_ref: form.section_ref || null,
      title_ml: form.title_ml,
      title_en: form.title_en,
      explain_ml: form.explain_ml,
      explain_en: form.explain_en,
      email_ml: form.email_ml,
      email_en: form.email_en,
      full_text_ml: form.full_text_ml,
      full_text_en: form.full_text_en,
      full_url: form.full_url || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }
    return composeEmail({
      campaign,
      clauses: [clause],
      details: {
        fullName: 'Ravi Kumar',
        addressLine: '',
        panchayat: '',
        district: 'Idukki',
        pincode: '685533',
        phone: '',
        email: 'citizen@example.com',
      },
      lang: previewLang,
    })
  }, [campaign, concern.id, form, previewLang])

  async function handleSave() {
    if (!form.code.trim() || !form.title_ml.trim() || !form.title_en.trim()) {
      setError('Code and titles are required.')
      return
    }
    setSaveState('saving')
    const result = await saveConcern({
      id: concern.id,
      campaign_id: campaign.id,
      ...form,
      sort_order: Number(form.sort_order) || 0,
    })
    if (!result.ok) {
      setSaveState('error')
      setError(result.error)
      return
    }
    setSaveState('saved')
    setError('')
    if (!concern.id && result.id) router.push(`/admin/concerns/${result.id}`)
    else router.refresh()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={concern.id ? 'Edit concern' : 'New concern'}
        description={concern.usage_count ? `Selected in ${concern.usage_count} submissions. Disabling keeps history.` : undefined}
        actions={
          <button type="button" className={adminBtnPrimary} onClick={() => void handleSave()} disabled={saveState === 'saving'}>
            Save changes
          </button>
        }
      />
      <SaveStatus state={saveState} />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className={adminLabel}>
          Internal code
          <input className={adminInput} value={form.code} onChange={(e) => patch('code', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Section reference
          <input className={adminInput} value={form.section_ref} onChange={(e) => patch('section_ref', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Title — Malayalam
          <input className={adminInput} value={form.title_ml} onChange={(e) => patch('title_ml', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Title — English
          <input className={adminInput} value={form.title_en} onChange={(e) => patch('title_en', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Short explanation — Malayalam
          <textarea className={`${adminInput} min-h-24 py-2`} value={form.explain_ml} onChange={(e) => patch('explain_ml', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Short explanation — English
          <textarea className={`${adminInput} min-h-24 py-2`} value={form.explain_en} onChange={(e) => patch('explain_en', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Email version — Malayalam
          <textarea className={`${adminInput} min-h-24 py-2`} value={form.email_ml} onChange={(e) => patch('email_ml', e.target.value)} />
          <span className="mt-1 block text-xs text-stone-500">{emailMlCount} characters</span>
        </label>
        <label className={adminLabel}>
          Email version — English
          <textarea className={`${adminInput} min-h-24 py-2`} value={form.email_en} onChange={(e) => patch('email_en', e.target.value)} />
          <span className="mt-1 block text-xs text-stone-500">{emailEnCount} characters</span>
        </label>
        <label className={adminLabel}>
          Full source text — Malayalam
          <textarea className={`${adminInput} min-h-24 py-2`} value={form.full_text_ml} onChange={(e) => patch('full_text_ml', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Full source text — English
          <textarea className={`${adminInput} min-h-24 py-2`} value={form.full_text_en} onChange={(e) => patch('full_text_en', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Source URL
          <input className={adminInput} value={form.full_url} onChange={(e) => patch('full_url', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Sort order
          <input className={adminInput} type="number" value={form.sort_order} onChange={(e) => patch('sort_order', e.target.value)} />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_active} onChange={(e) => patch('is_active', e.target.checked)} />
        Active
      </label>

      <AdminCard
        title="Preview in email"
        action={
          <div className="flex gap-1">
            <button type="button" className={previewLang === 'ml' ? adminBtnPrimary : adminBtnSecondary} onClick={() => setPreviewLang('ml')}>
              Malayalam
            </button>
            <button type="button" className={previewLang === 'en' ? adminBtnPrimary : adminBtnSecondary} onClick={() => setPreviewLang('en')}>
              English
            </button>
          </div>
        }
      >
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">{preview.body}</pre>
      </AdminCard>
    </div>
  )
}
