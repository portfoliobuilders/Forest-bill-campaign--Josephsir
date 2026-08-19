'use client'

import { useState } from 'react'

import { submitDeletionRequest } from '@/app/delete/actions'
import { PageContainer } from '@/components/ui/PageContainer'
import { TextAreaField, TextField } from '@/components/ui/FormField'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { btnPrimary } from '@/lib/ui'

export function DeletePageContent() {
  const { lang } = useLang()
  const isMl = lang === 'ml'
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [state, setState] = useState<'form' | 'submitting' | 'done' | 'error'>('form')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('submitting')
    const result = await submitDeletionRequest({ email, reason: reason || undefined })
    setState(result.ok ? 'done' : 'error')
  }

  if (state === 'done') {
    return (
      <PageContainer>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          {isMl ? 'അഭ്യർത്ഥന ലഭിച്ചു' : 'Request received'}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-body">
          {isMl
            ? 'DPDP Act 2023 പ്രകാരം 30 ദിവസത്തിനുള്ളിൽ നിങ്ങളുടെ വിവരം മായ്ക്കും. ഇമെയിൽ വിലാസം പരിശോധിച്ച് confirm ചെയ്യാം.'
            : 'Under the DPDP Act 2023, your data will be erased within 30 days. We may email to confirm your request.'}
        </p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'deleteData')}</h1>
      <p className="mt-3 text-base text-body">
        {isMl
          ? 'ഈ കാമ്പെയ്‌നിൽ നൽകിയ വിവരം മായ്ക്കാൻ ഇമെയിൽ നൽകുക.'
          : 'Enter the email you used so we can erase your campaign data.'}
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <TextField
          id="delete-email"
          type="email"
          required
          autoComplete="email"
          label={t(lang, 'email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextAreaField
          id="delete-reason"
          label={isMl ? 'കാരണം (ഐച്ഛികം)' : 'Reason (optional)'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <button type="submit" disabled={state === 'submitting'} className={btnPrimary}>
          {state === 'submitting' ? (isMl ? 'അയയ്ക്കുന്നു…' : 'Submitting…') : isMl ? 'അഭ്യർത്ഥിക്കുക' : 'Submit request'}
        </button>
      </form>

      {state === 'error' ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {isMl ? 'അയയ്ക്കാൻ കഴിഞ്ഞില്ല.' : 'Could not submit.'}
        </p>
      ) : null}
    </PageContainer>
  )
}
