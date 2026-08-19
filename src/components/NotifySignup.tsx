'use client'

import { useState } from 'react'

import { signupNotify } from '@/app/actions/notify'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function NotifySignup() {
  const { lang } = useLang()
  const [status, setStatus] = useState<'idle' | 'ok' | 'invalid_email' | 'rate_limit' | 'notify_failed'>('idle')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    const form = new FormData(e.currentTarget)
    const result = await signupNotify(form)
    if (result.ok) {
      setStatus('ok')
    } else if (
      result.error === 'invalid_email' ||
      result.error === 'rate_limit' ||
      result.error === 'notify_failed'
    ) {
      setStatus(result.error)
    } else {
      setStatus('notify_failed')
    }
    setPending(false)
  }

  if (status === 'ok') {
    return <p className="mt-4 text-base font-medium text-emerald-900">{t(lang, 'notifyThanks')}</p>
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-6">
      <label htmlFor="notify-email" className="block text-base font-medium text-stone-900">
        {t(lang, 'notifyLabel')}
      </label>
      <input
        id="notify-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder={t(lang, 'notifyPlaceholder')}
        className={cx(
          'mt-2 min-h-[44px] w-full rounded-md border border-stone-400 bg-white px-3 text-base text-stone-900',
          focusRing,
        )}
      />
      <button
        type="submit"
        disabled={pending}
        className={cx(
          'mt-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white hover:bg-emerald-900 disabled:bg-stone-300 disabled:text-stone-500',
          focusRing,
        )}
      >
        {t(lang, 'notifySubmit')}
      </button>
      {status === 'invalid_email' ? (
        <p className="mt-2 text-sm text-red-800">{t(lang, 'notifyInvalid')}</p>
      ) : null}
      {status === 'rate_limit' ? (
        <p className="mt-2 text-sm text-red-800">{t(lang, 'notifyRateLimit')}</p>
      ) : null}
      {status === 'notify_failed' ? (
        <p className="mt-2 text-sm text-red-800">{t(lang, 'notifyFailed')}</p>
      ) : null}
    </form>
  )
}
