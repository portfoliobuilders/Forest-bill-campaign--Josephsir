'use client'

import { AdminSignOut } from '@/components/admin/AdminSignOut'

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">Admin dashboard could not load</h1>
      <p className="mt-3 text-base text-stone-700">
        You are signed in. Refresh the page, or sign out and sign back in with your password.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-[44px] rounded-md bg-emerald-800 px-4 text-base font-semibold text-white hover:bg-emerald-900"
        >
          Try again
        </button>
        <AdminSignOut />
      </div>
    </div>
  )
}
