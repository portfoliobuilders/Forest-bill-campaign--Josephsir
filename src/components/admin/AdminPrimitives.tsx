import Link from 'next/link'

import { adminBtnPrimary, adminBtnSecondary, adminFocus } from '@/components/admin/admin-ui'

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-stone-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function AdminCard({
  title,
  children,
  action,
}: {
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title ? <h2 className="text-sm font-semibold text-stone-800">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-10 text-center">
      <p className="font-medium text-stone-800">{title}</p>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
    </div>
  )
}

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  )
}

export function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{children}</p>
  )
}

export function KpiCard({
  label,
  value,
  hint,
  weekPct,
}: {
  label: string
  value: number
  hint?: string
  weekPct?: number | null
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-stone-900">{value.toLocaleString('en-IN')}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        {weekPct === null || weekPct === undefined ? null : (
          <span className={weekPct >= 0 ? 'font-medium text-emerald-800' : 'font-medium text-stone-600'}>
            {weekPct >= 0 ? '↑' : '↓'} {Math.abs(weekPct)}% this week
          </span>
        )}
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string
  children: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-md border border-stone-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        <div className="mt-3 text-sm leading-relaxed text-stone-700">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className={adminBtnSecondary} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={adminBtnPrimary} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SaveStatus({ state }: { state: 'saved' | 'unsaved' | 'saving' | 'error' | 'idle' }) {
  const text =
    state === 'saved'
      ? 'Saved'
      : state === 'unsaved'
        ? 'Unsaved changes'
        : state === 'saving'
          ? 'Saving…'
          : state === 'error'
            ? 'Error saving'
            : ''
  if (!text) return null
  return <p className="text-sm text-stone-500">{text}</p>
}

export function PublicLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`text-sm font-medium text-emerald-800 underline ${adminFocus}`}>
      {children}
    </Link>
  )
}
