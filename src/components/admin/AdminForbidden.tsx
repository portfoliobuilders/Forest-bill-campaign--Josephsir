import Link from 'next/link'

import { AdminSignOut } from '@/components/admin/AdminSignOut'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function AdminForbidden({ email }: { email: string }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-stone-500">Janashabdam</p>
      <h1 className="mt-2 text-2xl font-bold text-stone-900 [font-family:var(--font-gayathri),serif]">ജനശബ്ദം</h1>
      <p className="mt-6 text-lg font-semibold text-stone-900">403 — You do not have administrator access.</p>
      <p className="mt-2 text-base text-stone-600">
        Signed in as {email}. This account is not on the admin allowlist.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AdminSignOut />
        <Link
          href="/"
          className={`inline-flex min-h-[44px] items-center rounded-md border border-stone-400 bg-white px-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 ${focusRing}`}
        >
          Public site
        </Link>
      </div>
    </div>
  )
}
