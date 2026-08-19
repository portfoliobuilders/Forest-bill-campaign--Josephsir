'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { adminPasswordSignIn, sendAdminMagicLink, verifyAdminLoginCode } from '@/app/admin/actions'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function failMessage(lang: 'ml' | 'en', reason: string): string {
  if (reason === 'not_allowed') {
    return lang === 'ml' ? 'ഈ ഇമെയിൽ അഡ്മിൻ ലിസ്റ്റിൽ ഇല്ല.' : 'This email is not on the admin allowlist.'
  }
  if (reason === 'wrong_password') {
    return lang === 'ml' ? 'ഇമെയിൽ അല്ലെങ്കിൽ പാസ്‌വേഡ് തെറ്റാണ്.' : 'Email or password is incorrect.'
  }
  if (reason === 'rate_limit') {
    return lang === 'ml'
      ? 'വളരെയധികം ലിങ്ക് ആവശ്യപ്പെട്ടു. പാസ്‌വേഡ് ഉപയോഗിച്ച് പ്രവേശിക്കുക.'
      : 'Too many login emails were requested. Sign in with your password instead.'
  }
  if (reason === 'config') {
    return lang === 'ml'
      ? 'ലിങ്ക് അയയ്ക്കാനുള്ള ഇമെയിൽ സേവനം ബന്ധിപ്പിച്ചിട്ടില്ല. പാസ്‌വേഡ് ഉപയോഗിക്കുക.'
      : 'The login email service is not connected. Use your password instead.'
  }
  if (reason === 'invalid_code' || reason === 'expired') {
    return lang === 'ml'
      ? 'കോഡ് തെറ്റാണ് അല്ലെങ്കിൽ കാലഹരണപ്പെട്ടു. പാസ്‌വേഡ് ഉപയോഗിക്കുക.'
      : 'That code is wrong or expired. Use your password instead.'
  }
  return lang === 'ml' ? 'പ്രവേശനം പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.' : 'Sign-in failed. Try again.'
}

export function AdminLoginForm({ errorCode }: { errorCode: string | null }) {
  const { lang } = useLang()
  const router = useRouter()
  const [email, setEmail] = useState('portfoliobuilders.ind@gmail.com')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [passwordState, setPasswordState] = useState<'idle' | 'signing' | 'failed'>('idle')
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'failed'>('idle')
  const [failReason, setFailReason] = useState('')
  const [validationError, setValidationError] = useState('')

  function validEmail(): string | null {
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) {
      setValidationError(lang === 'ml' ? 'സാധുവായ ഇമെയിൽ നൽകുക.' : 'Enter a valid email address.')
      return null
    }
    setValidationError('')
    return trimmed
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = validEmail()
    if (!trimmed) return
    if (!password) {
      setValidationError(lang === 'ml' ? 'പാസ്‌വേഡ് നൽകുക.' : 'Enter your password.')
      return
    }
    setPasswordState('signing')
    const result = await adminPasswordSignIn(trimmed, password)
    if (result.ok) {
      router.replace('/admin')
      router.refresh()
      return
    }
    setPasswordState('failed')
    setFailReason(result.error)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = validEmail()
    if (!trimmed) return
    setSendState('sending')
    const result = await sendAdminMagicLink(trimmed)
    if (result.ok) {
      setSendState('sent')
      setFailReason('')
    } else {
      setSendState('failed')
      setFailReason(result.error)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = validEmail()
    if (!trimmed) return
    setVerifyState('checking')
    const result = await verifyAdminLoginCode(trimmed, code)
    if (result.ok) {
      router.replace('/admin')
      router.refresh()
      return
    }
    setVerifyState('failed')
    setFailReason(result.error)
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
        {lang === 'ml' ? 'ഇമെയിലും പാസ്‌വേഡും ഉപയോഗിച്ച് പ്രവേശിക്കുക.' : 'Sign in with your email and password.'}
      </p>

      {errorCode ? (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {errorCode === 'expired'
            ? lang === 'ml'
              ? 'ലിങ്ക് കാലഹരണപ്പെട്ടു. പാസ്‌വേഡ് ഉപയോഗിച്ച് പ്രവേശിക്കുക.'
              : 'That login link expired. Sign in with your password instead.'
            : lang === 'ml'
              ? `പ്രവേശനം പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക. (${errorCode})`
              : `Sign-in failed. Try again. (${errorCode})`}
        </p>
      ) : null}

      <form onSubmit={(e) => void handlePassword(e)} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">{t(lang, 'email')}</span>
          <input
            type="email"
            required
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-3 text-base ${focusRing}`}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">{lang === 'ml' ? 'പാസ്‌വേഡ്' : 'Password'}</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-3 text-base ${focusRing}`}
          />
        </label>
        {validationError ? <p className="text-sm text-red-700">{validationError}</p> : null}
        <button
          type="submit"
          disabled={passwordState === 'signing'}
          className={`min-h-[44px] w-full rounded-md bg-emerald-800 px-4 text-base font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 ${focusRing}`}
        >
          {passwordState === 'signing'
            ? lang === 'ml'
              ? 'പ്രവേശിക്കുന്നു…'
              : 'Signing in…'
            : lang === 'ml'
              ? 'പ്രവേശിക്കുക'
              : 'Sign in'}
        </button>
      </form>

      {sendState === 'sent' ? (
        <p className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-base text-emerald-900">
          {lang === 'ml'
            ? 'പ്രവേശന ലിങ്കിനായി നിങ്ങളുടെ ഇമെയിൽ പരിശോധിക്കുക. localhost തുറക്കരുത്.'
            : 'Check your email for the login link or code. Do not open localhost.'}
        </p>
      ) : null}

      <form onSubmit={(e) => void handleSend(e)} className="mt-8 space-y-4 border-t border-stone-200 pt-6">
        <p className="text-sm font-medium text-stone-800">
          {lang === 'ml' ? 'ഇമെയിൽ ലിങ്ക് (ഓപ്ഷണൽ)' : 'Email link (optional)'}
        </p>
        <button
          type="submit"
          disabled={sendState === 'sending'}
          className={`min-h-[44px] w-full rounded-md border border-stone-400 bg-white px-4 text-base font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-60 ${focusRing}`}
        >
          {sendState === 'sending'
            ? lang === 'ml'
              ? 'അയയ്ക്കുന്നു…'
              : 'Sending…'
            : lang === 'ml'
              ? 'പ്രവേശന ലിങ്ക് അയയ്ക്കുക'
              : 'Send login link'}
        </button>
      </form>

      <form onSubmit={(e) => void handleVerify(e)} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">{lang === 'ml' ? '6 അക്ക കോഡ്' : '6-digit code'}</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-3 text-base tracking-[0.3em] ${focusRing}`}
          />
        </label>
        <button
          type="submit"
          disabled={verifyState === 'checking'}
          className={`min-h-[44px] w-full rounded-md border border-emerald-800 bg-white px-4 text-base font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-60 ${focusRing}`}
        >
          {verifyState === 'checking'
            ? lang === 'ml'
              ? 'പരിശോധിക്കുന്നു…'
              : 'Checking…'
            : lang === 'ml'
              ? 'കോഡ് ഉപയോഗിച്ച് പ്രവേശിക്കുക'
              : 'Sign in with code'}
        </button>
      </form>

      {passwordState === 'failed' || sendState === 'failed' || verifyState === 'failed' ? (
        <p className="mt-3 text-sm text-red-700">{failMessage(lang, failReason)}</p>
      ) : null}
    </div>
  )
}
