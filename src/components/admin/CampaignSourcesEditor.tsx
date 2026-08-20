'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { deleteCampaignSource, reorderCampaignSources, saveCampaignSource } from '@/app/admin/campaign-actions'
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-ui'
import { isSourceImageMime } from '@/lib/campaign-sources'
import type { CampaignSource } from '@/types/database'

type Draft = {
  id?: string
  publication_name: string
  publication_date: string
  title_en: string
  title_ml: string
  description_en: string
  description_ml: string
  source_url: string
  is_public: boolean
  sort_order: number
  file_url: string | null
  file_name: string | null
  file_mime: string | null
}

function emptyDraft(sortOrder: number): Draft {
  return {
    publication_name: '',
    publication_date: '',
    title_en: '',
    title_ml: '',
    description_en: '',
    description_ml: '',
    source_url: '',
    is_public: true,
    sort_order: sortOrder,
    file_url: null,
    file_name: null,
    file_mime: null,
  }
}

function fromSource(source: CampaignSource): Draft {
  return {
    id: source.id,
    publication_name: source.publication_name,
    publication_date: source.publication_date ? source.publication_date.slice(0, 10) : '',
    title_en: source.title_en,
    title_ml: source.title_ml,
    description_en: source.description_en,
    description_ml: source.description_ml,
    source_url: source.source_url ?? '',
    is_public: source.is_public,
    sort_order: source.sort_order,
    file_url: source.file_url,
    file_name: source.file_name,
    file_mime: source.file_mime,
  }
}

export function CampaignSourcesEditor({
  campaignId,
  sources,
  loadError,
}: {
  campaignId: string
  sources: CampaignSource[]
  loadError?: string | null
}) {
  const router = useRouter()
  const [rows, setRows] = useState(sources)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [removeFile, setRemoveFile] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setRows(sources)
  }, [sources])

  async function save() {
    if (!editing) return
    setSaving(true)
    setMessage('')
    const data = new FormData()
    if (editing.id) data.set('id', editing.id)
    data.set('campaign_id', campaignId)
    data.set('publication_name', editing.publication_name)
    data.set('publication_date', editing.publication_date)
    data.set('title_en', editing.title_en)
    data.set('title_ml', editing.title_ml)
    data.set('description_en', editing.description_en)
    data.set('description_ml', editing.description_ml)
    data.set('source_url', editing.source_url)
    data.set('is_public', editing.is_public ? 'true' : 'false')
    data.set('sort_order', String(editing.sort_order || rows.length + 1))
    if (removeFile) data.set('remove_file', 'true')
    if (file) data.set('file', file)
    const result = await saveCampaignSource(data)
    setSaving(false)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setEditing(null)
    setFile(null)
    setRemoveFile(false)
    setMessage('Source saved. It is supporting material only — it is never copied into emails.')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-relaxed text-stone-600">
        Newspaper clippings, PDFs, and reference links for this campaign. Public items appear in a collapsed
        Sources &amp; References section on the campaign page. They are never copied into the composed email.
      </p>
      {loadError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {loadError}
        </p>
      ) : null}
      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}

      <button
        type="button"
        className={adminBtnPrimary}
        onClick={() => {
          setFile(null)
          setRemoveFile(false)
          setEditing(emptyDraft(rows.length + 1))
        }}
      >
        Add source
      </button>

      <ul className="space-y-2">
        {rows.map((source, index) => (
          <li key={source.id} className="rounded-md border border-stone-200 bg-white p-3">
            <p className="font-medium text-stone-900">
              {index + 1}. {source.publication_name}
              {source.publication_date ? ` · ${source.publication_date.slice(0, 10)}` : ''}
            </p>
            <p className="text-sm text-stone-700">{source.title_en || source.title_ml}</p>
            <p className="mt-1 text-xs text-stone-500">
              {source.is_public ? 'Public' : 'Hidden'}
              {source.file_name ? ` · ${source.file_name}` : ' · no file yet'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={adminBtnSecondary}
                onClick={() => {
                  setFile(null)
                  setRemoveFile(false)
                  setEditing(fromSource(source))
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={index === 0}
                onClick={() => {
                  const next = [...rows]
                  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                  setRows(next)
                  void reorderCampaignSources(
                    campaignId,
                    next.map((item) => item.id),
                  )
                }}
              >
                Move up
              </button>
              <button
                type="button"
                className={adminBtnDanger}
                onClick={() =>
                  void deleteCampaignSource(source.id).then((result) => {
                    if (!result.ok) setMessage(result.error)
                    else router.refresh()
                  })
                }
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !editing ? (
        <p className="text-sm text-stone-600">No sources yet. Upload a newspaper clipping, PDF, or add a reference URL.</p>
      ) : null}

      {editing ? (
        <div className="rounded-md border border-stone-300 bg-stone-50 p-4">
          <h2 className="font-semibold text-stone-900">{editing.id ? 'Edit source' : 'New source'}</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label className={adminLabel}>
              Publication name
              <input
                className={adminInput}
                value={editing.publication_name}
                onChange={(e) => setEditing({ ...editing, publication_name: e.target.value })}
                placeholder="Deepika"
              />
            </label>
            <label className={adminLabel}>
              Publication date
              <input
                type="date"
                className={adminInput}
                value={editing.publication_date}
                onChange={(e) => setEditing({ ...editing, publication_date: e.target.value })}
              />
            </label>
            <label className={adminLabel}>
              Title — English
              <input className={adminInput} value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} />
            </label>
            <label className={adminLabel}>
              Title — Malayalam
              <input className={adminInput} value={editing.title_ml} onChange={(e) => setEditing({ ...editing, title_ml: e.target.value })} />
            </label>
            <label className={adminLabel}>
              Description — English
              <textarea
                className={`${adminInput} min-h-24 py-2`}
                value={editing.description_en}
                onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
              />
            </label>
            <label className={adminLabel}>
              Description — Malayalam
              <textarea
                className={`${adminInput} min-h-24 py-2`}
                value={editing.description_ml}
                onChange={(e) => setEditing({ ...editing, description_ml: e.target.value })}
              />
            </label>
            <label className={`${adminLabel} lg:col-span-2`}>
              Optional source URL
              <input
                className={adminInput}
                value={editing.source_url}
                onChange={(e) => setEditing({ ...editing, source_url: e.target.value })}
                placeholder="https://"
              />
            </label>
            <label className={adminLabel}>
              Clipping (PNG, JPG, WebP, or PDF, max 10 MB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf"
                className={`${adminInput} py-2`}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  setRemoveFile(false)
                }}
              />
            </label>
            <label className={adminLabel}>
              Visible on the public page
              <input
                type="checkbox"
                className="ml-2"
                checked={editing.is_public}
                onChange={(e) => setEditing({ ...editing, is_public: e.target.checked })}
              />
            </label>
          </div>
          {editing.file_url && !removeFile ? (
            <div className="mt-3 rounded-md border border-stone-200 bg-white p-3">
              <p className="text-sm text-stone-700">Current file: {editing.file_name || 'clipping'}</p>
              {isSourceImageMime(editing.file_mime) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editing.file_url} alt="" className="mt-2 max-h-40 max-w-full rounded border border-stone-200" />
              ) : (
                <a href={editing.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-emerald-800">
                  Open file
                </a>
              )}
              <label className="mt-2 block text-sm text-stone-700">
                <input type="checkbox" className="mr-2" checked={removeFile} onChange={(e) => setRemoveFile(e.target.checked)} />
                Remove stored file
              </label>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={adminBtnPrimary} disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save source'}
            </button>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() => {
                setEditing(null)
                setFile(null)
                setRemoveFile(false)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
