'use client'

import Link from 'next/link'

import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { btnPrimary } from '@/lib/ui'

export function NoLiveConsultation() {
  const { lang } = useLang()

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'noLiveTitle')}</h1>
      <p className="mt-3 text-base leading-relaxed text-body">{t(lang, 'noLiveBody')}</p>
      <Link href="/" className={`${btnPrimary} mt-8 inline-flex`}>
        {t(lang, 'siteName')}
      </Link>
    </PageContainer>
  )
}
