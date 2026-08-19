'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { saveSiteSettings } from '@/app/admin/cms-actions'
import { AdminPageHeader, SaveStatus, SuccessBanner } from '@/components/admin/AdminPrimitives'
import { adminBtnPrimary, adminInput, adminLabel } from '@/components/admin/admin-ui'
import type { SiteSettings } from '@/lib/admin/queries'

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter()
  const [form, setForm] = useState(settings)
  const [state, setState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function patch<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setState('unsaved')
  }

  async function handleSave() {
    setState('saving')
    const result = await saveSiteSettings({
      ...form,
      support_email: form.support_email ?? '',
    })
    if (!result.ok) {
      setState('error')
      setMessage(result.error)
      return
    }
    setState('saved')
    setMessage('Settings saved.')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Public copy and defaults. API secrets stay in environment variables."
        actions={
          <button type="button" className={adminBtnPrimary} onClick={() => void handleSave()}>
            Save changes
          </button>
        }
      />
      <SaveStatus state={state} />
      {message ? <SuccessBanner>{message}</SuccessBanner> : null}

      <label className={adminLabel}>
        Default language
        <select className={adminInput} value={form.default_language} onChange={(e) => patch('default_language', e.target.value)}>
          <option value="ml">Malayalam</option>
          <option value="en">English</option>
        </select>
      </label>
      <label className={adminLabel}>
        Site title — Malayalam
        <input className={adminInput} value={form.site_title_ml} onChange={(e) => patch('site_title_ml', e.target.value)} />
      </label>
      <label className={adminLabel}>
        Site title — English
        <input className={adminInput} value={form.site_title_en} onChange={(e) => patch('site_title_en', e.target.value)} />
      </label>
      <label className={adminLabel}>
        Support email
        <input className={adminInput} value={form.support_email ?? ''} onChange={(e) => patch('support_email', e.target.value)} />
      </label>
      <label className={adminLabel}>
        Public disclaimer — Malayalam
        <textarea className={`${adminInput} min-h-24 py-2`} value={form.public_disclaimer_ml} onChange={(e) => patch('public_disclaimer_ml', e.target.value)} />
      </label>
      <label className={adminLabel}>
        Public disclaimer — English
        <textarea className={`${adminInput} min-h-24 py-2`} value={form.public_disclaimer_en} onChange={(e) => patch('public_disclaimer_en', e.target.value)} />
      </label>
      <label className={adminLabel}>
        Public footer — Malayalam
        <textarea className={`${adminInput} min-h-24 py-2`} value={form.public_footer_ml} onChange={(e) => patch('public_footer_ml', e.target.value)} />
      </label>
      <label className={adminLabel}>
        Public footer — English
        <textarea className={`${adminInput} min-h-24 py-2`} value={form.public_footer_en} onChange={(e) => patch('public_footer_en', e.target.value)} />
      </label>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Not editable here</p>
        <p className="mt-1">SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY, and IP_HASH_SALT remain environment variables.</p>
      </div>
    </div>
  )
}
