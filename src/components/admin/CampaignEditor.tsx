'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { changeCampaignStatus, duplicateCampaign, saveCampaign } from '@/app/admin/cms-actions'
import { AdminCard, AdminPageHeader, ConfirmDialog, SaveStatus, SuccessBanner } from '@/components/admin/AdminPrimitives'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-ui'
import { formatDatetimeLocal } from '@/lib/admin/format'
import { PUBLISH_STATUS_HELP, PUBLISH_STATUS_LABEL, type PublishStatus } from '@/lib/admin/publish'
import type { Campaign } from '@/types/database'

type Draft = {
  title_ml: string
  title_en: string
  summary_ml: string
  summary_en: string
  homepage_intro_ml: string
  homepage_intro_en: string
  explainer_ml: string
  explainer_en: string
  source_url: string
  reference_url: string
  opens_at: string
  deadline_at: string
}

function bulletsToText(items: string[] | null | undefined): string {
  return (items ?? []).join('\n')
}

function textToBullets(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function CampaignEditor({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>({
    title_ml: campaign.title_ml,
    title_en: campaign.title_en,
    summary_ml: campaign.summary_ml,
    summary_en: campaign.summary_en,
    homepage_intro_ml: campaign.homepage_intro_ml || campaign.summary_ml,
    homepage_intro_en: campaign.homepage_intro_en || campaign.summary_en,
    explainer_ml: bulletsToText(campaign.explainer_ml),
    explainer_en: bulletsToText(campaign.explainer_en),
    source_url: campaign.source_url,
    reference_url: campaign.reference_url ?? '',
    opens_at: formatDatetimeLocal(campaign.opens_at),
    deadline_at: formatDatetimeLocal(campaign.deadline_at),
  })
  const [status, setStatus] = useState<PublishStatus>(campaign.publish_status)
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [previewLang, setPreviewLang] = useState<'ml' | 'en'>('ml')
  const [liveOpen, setLiveOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<PublishStatus | null>(null)

  function patch(next: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...next }))
    setSaveState('unsaved')
  }

  const preview = useMemo(() => {
    const ml = previewLang === 'ml'
    return {
      title: ml ? draft.title_ml : draft.title_en,
      intro: ml ? draft.homepage_intro_ml : draft.homepage_intro_en,
      bullets: textToBullets(ml ? draft.explainer_ml : draft.explainer_en),
    }
  }, [draft, previewLang])

  async function handleSave() {
    setSaveState('saving')
    const result = await saveCampaign({
      id: campaign.id,
      title_ml: draft.title_ml,
      title_en: draft.title_en,
      summary_ml: draft.summary_ml,
      summary_en: draft.summary_en,
      homepage_intro_ml: draft.homepage_intro_ml,
      homepage_intro_en: draft.homepage_intro_en,
      explainer_ml: textToBullets(draft.explainer_ml),
      explainer_en: textToBullets(draft.explainer_en),
      source_url: draft.source_url,
      reference_url: draft.reference_url,
      opens_at: new Date(draft.opens_at).toISOString(),
      deadline_at: new Date(draft.deadline_at).toISOString(),
    })
    if (!result.ok) {
      setSaveState('error')
      setMessage(result.error)
      return
    }
    setSaveState('saved')
    setMessage('Changes saved.')
    router.refresh()
  }

  async function applyStatus(next: PublishStatus, confirmed = false) {
    const result = await changeCampaignStatus(campaign.id, next, confirmed)
    if (!result.ok && result.error === 'live_confirmation_required') {
      setPendingStatus(next)
      setLiveOpen(true)
      return
    }
    if (!result.ok) {
      setSaveState('error')
      setMessage(result.error)
      return
    }
    setStatus(next)
    setLiveOpen(false)
    setPendingStatus(null)
    setMessage(`Campaign is now ${PUBLISH_STATUS_LABEL[next]}.`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Campaign"
        description="Edit public copy, dates, and publishing. Recipients and email wording live under Email Template. Concern selection lives under Concerns."
        actions={
          <>
            <Link href="/admin/concerns" className={adminBtnSecondary}>
              Concerns
            </Link>
            <Link href="/admin/campaign/new" className={adminBtnSecondary}>
              New campaign
            </Link>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={async () => {
                const result = await duplicateCampaign(campaign.id)
                if (result.ok && result.id) router.push('/admin/campaign')
                else setMessage(result.ok ? '' : result.error)
              }}
            >
              Duplicate campaign
            </button>
            <button type="button" className={adminBtnPrimary} onClick={() => void handleSave()} disabled={saveState === 'saving'}>
              Save changes
            </button>
          </>
        }
      />
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={saveState} />
        {message ? <SuccessBanner>{message}</SuccessBanner> : null}
      </div>

      <AdminCard title="Campaign status">
        <div className="grid gap-2 sm:grid-cols-5">
          {(['draft', 'preview', 'live', 'closed', 'archived'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => void applyStatus(value)}
              className={`min-h-11 rounded-md border px-3 text-sm font-medium ${
                status === value ? 'border-emerald-800 bg-emerald-50 text-emerald-900' : 'border-stone-300 bg-white'
              }`}
            >
              {PUBLISH_STATUS_LABEL[value]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-stone-600">{PUBLISH_STATUS_HELP[status]}</p>
        <p className="mt-1 text-xs text-stone-500">
          Preview uses the campaign preview link. Live sends composed mail to the configured government addresses from the citizen’s own inbox.
        </p>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Campaign name — Malayalam" value={draft.title_ml} onChange={(v) => patch({ title_ml: v })} />
        <Field label="Campaign name — English" value={draft.title_en} onChange={(v) => patch({ title_en: v })} />
        <Area label="Short summary — Malayalam" value={draft.summary_ml} onChange={(v) => patch({ summary_ml: v })} />
        <Area label="Short summary — English" value={draft.summary_en} onChange={(v) => patch({ summary_en: v })} />
        <Area label="Homepage introduction — Malayalam" value={draft.homepage_intro_ml} onChange={(v) => patch({ homepage_intro_ml: v })} />
        <Area label="Homepage introduction — English" value={draft.homepage_intro_en} onChange={(v) => patch({ homepage_intro_en: v })} />
        <Area
          label="Explainer bullets — Malayalam (one per line)"
          value={draft.explainer_ml}
          onChange={(v) => patch({ explainer_ml: v })}
        />
        <Area
          label="Explainer bullets — English (one per line)"
          value={draft.explainer_en}
          onChange={(v) => patch({ explainer_en: v })}
        />
        <Field label="Official source URL" value={draft.source_url} onChange={(v) => patch({ source_url: v })} />
        <Field label="Reference source URL" value={draft.reference_url} onChange={(v) => patch({ reference_url: v })} />
        <label className={adminLabel}>
          Opening date
          <input type="datetime-local" className={adminInput} value={draft.opens_at} onChange={(e) => patch({ opens_at: e.target.value })} />
        </label>
        <label className={adminLabel}>
          Deadline
          <input
            type="datetime-local"
            className={adminInput}
            value={draft.deadline_at}
            onChange={(e) => patch({ deadline_at: e.target.value })}
          />
        </label>
      </div>

      <AdminCard
        title="Preview homepage"
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
        <div className="rounded-md border border-stone-200 bg-[#faf9f6] p-5">
          <h3 className="font-display text-2xl text-stone-900">{preview.title || 'Untitled'}</h3>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-700">{preview.intro || '—'}</p>
          {preview.bullets.length > 0 ? (
            <ol className="mt-5 space-y-2">
              {preview.bullets.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-3 text-sm text-stone-700">
                  <span className="w-6 font-mono text-emerald-800">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-stone-500">No explainer bullets yet.</p>
          )}
        </div>
      </AdminCard>

      {liveOpen ? (
        <ConfirmDialog
          title="Make this campaign live?"
          confirmLabel="Publish live"
          onCancel={() => {
            setLiveOpen(false)
            setPendingStatus(null)
          }}
          onConfirm={() => {
            if (pendingStatus) void applyStatus(pendingStatus, true)
          }}
        >
          <p>You are about to make this campaign public and enable real recipient addresses.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Confirm that the consultation is currently open</li>
            <li>Deadline is verified from a primary source</li>
            <li>Recipient addresses are correct</li>
            <li>Official source URL is valid</li>
          </ul>
        </ConfirmDialog>
      ) : null}
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
      <textarea className={`${adminInput} min-h-28 py-2`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
