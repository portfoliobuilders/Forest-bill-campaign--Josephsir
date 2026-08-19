'use client'

import { useState } from 'react'

import { sendAdminMagicLink } from '@/app/admin/actions'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AdminLoginForm({ errorCode }: { errorCode: string | null }) {
  const { lang } = useLang()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [failReason, setFailReason] = useState('')
  const [validationError, setValidationError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) {
      setValidationError(lang === 'ml' ? 'സാധുവായ ഇമെയിൽ നൽകുക.' : 'Enter a valid email address.')
      return
    }
    setValidationError('')
    setState('sending')
    const result = await sendAdminMagicLink(trimmed)
    if (result.ok) {
      setState('sent')
    } else {
      setState('failed')
      setFailReason(result.error)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-stone-500">{t(lang, 'wordmarkEn')}</p>
      <h1 className="mt-1 text-2xl font-bold text-stone-900 [font-family:var(--font-gayathri),serif]">
        {t(lang, 'wordmarkMl')}
      </h1>
      <p className="mt-4 text-lg font-semibold text-stone-900">
        {lang === 'ml' ? 'അഡ്മിൻ പ്രവേശനം' : 'Admin sign-in'}
      </p>
      <p className="mt-2 text-base text-stone-600">
        {lang === 'ml'
          ? 'അനുവദിച്ച ഇമെയിലിലേക്ക് പ്രവേശന ലിങ്ക് അയയ്ക്കും.'
          : 'A login link is sent only to an allowlisted email.'}
      </p>

      {errorCode ? (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {errorCode === 'expired'
            ? lang === 'ml'
              ? 'ഈ പ്രവേശന ലിങ്ക് കാലഹരണപ്പെട്ടു അല്ലെങ്കിൽ ഇതിനകം ഉപയോഗിച്ചു. പുതിയ ലിങ്ക് ആവശ്യപ്പെടുക. localhost തുറക്കരുത് — തത്സമയ സൈറ്റ് ഉപയോഗിക്കുക.'
              : 'This login link has expired or was already used. Request a new one on the live site. Do not open localhost.'
            : lang === 'ml'
              ? `പ്രവേശനം പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക. (${errorCode})`
              : `Sign-in failed. Try again. (${errorCode})`}
        </p>
      ) : null}

      {state === 'sent' ? (
        <p className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-base text-emerald-900">
          {lang === 'ml'
            ? 'പ്രവേശന ലിങ്കിനായി നിങ്ങളുടെ ഇമെയിൽ പരിശോധിക്കുക.'
            : 'Check your email for the login link.'}
        </p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">{t(lang, 'email')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-3 text-base ${focusRing}`}
            />
          </label>
          {validationError ? <p className="text-sm text-red-700">{validationError}</p> : null}
          <button
            type="submit"
            disabled={state === 'sending'}
            className={`min-h-[44px] w-full rounded-md bg-emerald-800 px-4 text-base font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 ${focusRing}`}
          >
            {state === 'sending'
              ? lang === 'ml'
                ? 'അയയ്ക്കുന്നു…'
                : 'Sending…'
              : lang === 'ml'
                ? 'പ്രവേശന ലിങ്ക് അയയ്ക്കുക'
                : 'Send login link'}
          </button>
        </form>
      )}

      {state === 'failed' ? (
        <p className="mt-3 text-sm text-red-700">
          {failReason === 'not_allowed'
            ? lang === 'ml'
              ? 'ഈ ഇമെയിൽ അഡ്മിൻ ലിസ്റ്റിൽ ഇല്ല.'
              : 'This email is not on the admin allowlist.'
            : lang === 'ml'
              ? 'ലിങ്ക് അയയ്ക്കാനായില്ല.'
              : 'Could not send link.'}
        </p>
      ) : null}
    </div>
  )
}
