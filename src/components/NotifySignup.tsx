'use client'

import { useState } from 'react'

import { signupNotify } from '@/app/actions/notify'
import { TextField } from '@/components/ui/FormField'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { btnPrimary } from '@/lib/ui'

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
    return (
      <p className="mt-4 text-base font-medium text-accent" aria-live="polite">
        {t(lang, 'notifyThanks')}
      </p>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-2">
      <TextField
        id="notify-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        label={t(lang, 'notifyLabel')}
      />
      <button type="submit" disabled={pending} className={`${btnPrimary} mt-3`}>
        {t(lang, 'notifySubmit')}
      </button>
      {status === 'invalid_email' ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {t(lang, 'notifyInvalid')}
        </p>
      ) : null}
      {status === 'rate_limit' ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {t(lang, 'notifyRateLimit')}
        </p>
      ) : null}
      {status === 'notify_failed' ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {t(lang, 'notifyFailed')}
        </p>
      ) : null}
    </form>
  )
}
