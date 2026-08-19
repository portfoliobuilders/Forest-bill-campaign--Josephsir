'use client'

import { adminSignOut } from '@/app/admin/actions'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function AdminSignOut() {
  return (
    <form action={adminSignOut}>
      <button
        type="submit"
        className={`min-h-[44px] rounded-md border border-stone-400 bg-white px-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 ${focusRing}`}
      >
        Sign out
      </button>
    </form>
  )
}
