'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { uploadBrandingFile } from '@/app/admin/campaign-actions'
import { saveSiteSettings } from '@/app/admin/cms-actions'
import { AdminPageHeader, SaveStatus, SuccessBanner } from '@/components/admin/AdminPrimitives'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-ui'
import type { SiteSettings } from '@/lib/admin/queries'

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter()
  const [form, setForm] = useState(settings)
  const [state, setState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState<'logo' | 'favicon' | 'og' | null>(null)

  function patch<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setState('unsaved')
  }

  async function handleSave() {
    setState('saving')
    const result = await saveSiteSettings({
      ...form,
      support_email: form.support_email ?? '',
      logo_url: form.logo_url ?? '',
      favicon_url: form.favicon_url ?? '',
      og_image_url: form.og_image_url ?? '',
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

  async function handleUpload(kind: 'logo' | 'favicon' | 'og', file: File | undefined) {
    if (!file) return
    setUploading(kind)
    const data = new FormData()
    data.set('file', file)
    data.set('kind', kind === 'og' ? 'og' : kind)
    const result = await uploadBrandingFile(data)
    setUploading(null)
    if (!result.ok || !result.url) {
      setState('error')
      setMessage(result.ok ? 'Upload did not return a URL.' : result.error)
      return
    }
    if (kind === 'logo') patch('logo_url', result.url)
    if (kind === 'favicon') patch('favicon_url', result.url)
    if (kind === 'og') patch('og_image_url', result.url)
    setMessage(`${kind === 'og' ? 'Social image' : kind} uploaded. Save changes to keep it.`)
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Settings"
        description="Public branding and copy. API secrets stay in environment variables."
        actions={
          <button type="button" className={adminBtnPrimary} onClick={() => void handleSave()}>
            Save changes
          </button>
        }
      />
      <SaveStatus state={state} />
      {message ? <SuccessBanner>{message}</SuccessBanner> : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Branding</h2>
          <p className="mt-1 text-sm text-stone-600">
            These names, taglines, and images appear in the public header, favicon, and share cards. Campaign copy is
            edited under Campaigns.
          </p>
        </div>
        <label className={adminLabel}>
          Default language
          <select className={adminInput} value={form.default_language} onChange={(e) => patch('default_language', e.target.value)}>
            <option value="ml">Malayalam</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className={adminLabel}>
          Brand name — Malayalam
          <input className={adminInput} value={form.site_title_ml} onChange={(e) => patch('site_title_ml', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Brand name — English
          <input className={adminInput} value={form.site_title_en} onChange={(e) => patch('site_title_en', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Tagline — Malayalam
          <input className={adminInput} value={form.tagline_ml} onChange={(e) => patch('tagline_ml', e.target.value)} />
        </label>
        <label className={adminLabel}>
          Tagline — English
          <input className={adminInput} value={form.tagline_en} onChange={(e) => patch('tagline_en', e.target.value)} />
        </label>

        <div className="grid gap-4 lg:grid-cols-3">
          <BrandingUpload
            label="Logo"
            url={form.logo_url}
            busy={uploading === 'logo'}
            onClear={() => patch('logo_url', null)}
            onFile={(file) => void handleUpload('logo', file)}
          />
          <BrandingUpload
            label="Favicon"
            url={form.favicon_url}
            busy={uploading === 'favicon'}
            onClear={() => patch('favicon_url', null)}
            onFile={(file) => void handleUpload('favicon', file)}
          />
          <BrandingUpload
            label="Social / OG image"
            url={form.og_image_url}
            busy={uploading === 'og'}
            onClear={() => patch('og_image_url', null)}
            onFile={(file) => void handleUpload('og', file)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Public copy</h2>
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
      </section>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Not editable here</p>
        <p className="mt-1">SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY, and IP_HASH_SALT remain environment variables.</p>
      </div>
    </div>
  )
}

function BrandingUpload({
  label,
  url,
  busy,
  onFile,
  onClear,
}: {
  label: string
  url: string | null
  busy: boolean
  onFile: (file: File | undefined) => void
  onClear: () => void
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-3">
      <p className="text-sm font-medium text-stone-800">{label}</p>
      {url ? (
        <div className="mt-2 flex h-20 items-center justify-center rounded bg-stone-100 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="max-h-16 max-w-full object-contain" />
        </div>
      ) : (
        <p className="mt-2 text-xs text-stone-500">No image yet.</p>
      )}
      <label className={`${adminBtnSecondary} mt-3 w-full cursor-pointer`}>
        {busy ? 'Uploading…' : 'Upload'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            onFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </label>
      {url ? (
        <button type="button" className={`${adminBtnSecondary} mt-2 w-full`} onClick={onClear}>
          Remove
        </button>
      ) : null}
    </div>
  )
}
