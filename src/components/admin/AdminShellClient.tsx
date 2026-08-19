'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'

import { adminSignOut } from '@/app/admin/actions'
import { selectAdminCampaign } from '@/app/admin/cms-actions'
import { NAV_ITEMS, adminFocus } from '@/components/admin/admin-ui'
import type { CampaignListItem } from '@/lib/admin/context'

export function AdminShellClient({
  email,
  campaigns,
  selectedId,
  children,
}: {
  email: string
  campaigns: CampaignListItem[]
  selectedId: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  function navActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map((item) => {
        const active = navActive(item.href, 'exact' in item ? item.exact : false)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`rounded-md px-3 py-2.5 text-sm font-medium ${adminFocus} ${
              active ? 'bg-white/10 text-white' : 'text-stone-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-dvh bg-[#f6f4ef] text-stone-900">
      <div className="flex min-h-dvh">
        <aside className="hidden w-56 shrink-0 flex-col bg-[#1a1a18] md:flex">
          <div className="border-b border-white/10 px-4 py-4">
            <p className="font-mono text-[10px] tracking-[0.16em] text-stone-400">JANASHABDAM</p>
            <p className="mt-1 text-lg text-white [font-family:var(--font-gayathri),serif]">Admin</p>
          </div>
          {nav}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-stone-200 bg-[#f6f4ef]/95 px-4 py-3 backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className={`inline-flex min-h-11 items-center rounded-md border border-stone-300 bg-white px-3 text-sm font-medium md:hidden ${adminFocus}`}
                onClick={() => setOpen(true)}
              >
                Menu
              </button>
              <label className="hidden min-w-0 text-sm sm:block">
                <span className="sr-only">Campaign</span>
                <select
                  className={`max-w-[min(100%,22rem)] min-h-11 rounded-md border border-stone-300 bg-white px-2 text-sm ${adminFocus}`}
                  value={selectedId ?? ''}
                  disabled={campaigns.length === 0}
                  onChange={(event) => {
                    const id = event.target.value
                    startTransition(() => {
                      void selectAdminCampaign(id)
                    })
                  }}
                >
                  {campaigns.length === 0 ? <option value="">No campaign</option> : null}
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title_en}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <p className="hidden truncate text-sm text-stone-600 sm:block">{email}</p>
              <form action={adminSignOut}>
                <button
                  type="submit"
                  className={`min-h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold ${adminFocus}`}
                >
                  Logout
                </button>
              </form>
            </div>
          </header>

          <label className="block px-4 pt-3 sm:hidden">
            <span className="text-xs font-medium text-stone-500">Campaign</span>
            <select
              className={`mt-1 w-full min-h-11 rounded-md border border-stone-300 bg-white px-2 text-sm ${adminFocus}`}
              value={selectedId ?? ''}
              disabled={campaigns.length === 0}
              onChange={(event) => {
                const id = event.target.value
                startTransition(() => {
                  void selectAdminCampaign(id)
                })
              }}
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title_en}
                </option>
              ))}
            </select>
          </label>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">{children}</main>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64 bg-[#1a1a18]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <p className="text-white">Menu</p>
              <button type="button" className="text-sm text-stone-300" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}
    </div>
  )
}
