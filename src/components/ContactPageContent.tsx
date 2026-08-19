'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'

const GRIEVANCE_EMAIL = 'privacy@janashabdam.in'

export function ContactPageContent() {
  const { lang } = useLang()

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{t(lang, 'contactTitle')}</h1>
      <p className="mt-4 text-base leading-relaxed text-body">{t(lang, 'contactBody')}</p>
      <p className="mt-6 text-sm font-semibold text-ink">{t(lang, 'contactEmailLabel')}</p>
      <a href={`mailto:${GRIEVANCE_EMAIL}`} className={`mt-1 inline-flex min-h-11 items-center text-accent underline ${focusRing}`}>
        {GRIEVANCE_EMAIL}
      </a>
      <p className="mt-8 text-sm leading-relaxed text-muted">{t(lang, 'notOfficial')}</p>
    </PageContainer>
  )
}
