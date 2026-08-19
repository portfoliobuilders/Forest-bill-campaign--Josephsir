'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { confirmSent } from '@/app/actions/submission'
import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { btnPrimary, btnSecondary } from '@/lib/ui'

function whatsAppShareUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const text = `ഞാൻ ജനശബ്ദം വഴി ഒരു വ്യക്തിഗത എതിർപ്പ് അയച്ചു. നിങ്ങളും നിങ്ങളുടെ സ്വന്തം ഇമെയിൽ വിലാസത്തിൽ നിന്ന് എതിർപ്പ് അയയ്ക്കാം: ${siteUrl}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function SentPage({ submissionId }: { submissionId: string | null }) {
  const { lang } = useLang()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(false)

  async function handleConfirm() {
    if (!submissionId || busy || confirmed) return
    setBusy(true)
    setError(false)
    const result = await confirmSent(submissionId)
    if (!result.ok) {
      setError(true)
      setBusy(false)
      return
    }
    setConfirmed(true)
    setBusy(false)
    router.refresh()
  }

  if (!submissionId) {
    return (
      <PageContainer>
        <p className="text-base text-red-800">{t(lang, 'sentMissingId')}</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'sentTitle')}</h1>
      <p className="mt-3 text-base leading-relaxed text-body">{t('ml', 'sentConfirmWhy')}</p>

      {confirmed ? (
        <p className="mt-6 rounded-[8px] border border-accent bg-accent-tint px-4 py-3 text-base font-medium text-ink">
          {t(lang, 'sentConfirmed')}
        </p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleConfirm()}
          className={cx(btnPrimary, 'mt-8 w-full')}
        >
          {t(lang, 'confirmSentYes')}
        </button>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {t(lang, 'sentConfirmFailed')}
        </p>
      ) : null}

      <a
        href={whatsAppShareUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(btnSecondary, 'mt-4 w-full')}
      >
        {t(lang, 'shareWhatsApp')}
      </a>
    </PageContainer>
  )
}
