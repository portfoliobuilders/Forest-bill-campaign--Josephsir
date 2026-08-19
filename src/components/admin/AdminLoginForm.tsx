'use client'

import { useState } from 'react'

import { sendAdminMagicLink } from '@/app/admin/actions'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function AdminLoginForm({ errorCode }: { errorCode: string | null }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [failReason, setFailReason] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    const result = await sendAdminMagicLink(email)
    if (result.ok) {
      setState('sent')
    } else {
      setState('failed')
      setFailReason(result.error)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">Admin sign-in</h1>
      <p className="mt-2 text-base text-stone-600">Magic link sent to allowlisted email only.</p>

      {errorCode ? (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Sign-in failed ({errorCode}). Try again.
        </p>
      ) : null}

      {state === 'sent' ? (
        <p className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-base text-emerald-900">
          Check your email for the sign-in link.
        </p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-3 text-base ${focusRing}`}
            />
          </label>
          <button
            type="submit"
            disabled={state === 'sending'}
            className={`min-h-[44px] w-full rounded-md bg-emerald-800 px-4 text-base font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 ${focusRing}`}
          >
            {state === 'sending' ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}

      {state === 'failed' ? (
        <p className="mt-3 text-sm text-red-700">
          {failReason === 'not_allowed' ? 'This email is not on the admin allowlist.' : 'Could not send link.'}
        </p>
      ) : null}
    </div>
  )
}
