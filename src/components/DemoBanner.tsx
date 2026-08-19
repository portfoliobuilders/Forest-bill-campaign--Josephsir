'use client'

import { IconWarning } from '@/components/ui/icons'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

export function DemoBanner() {
  const { lang } = useLang()

  return (
    <div
      role="status"
      className="sticky top-0 z-50 bg-alert-bg px-3 py-2.5 text-center text-sm font-semibold leading-snug text-alert-fg"
    >
      <span className="mx-auto inline-flex max-w-5xl items-start justify-center gap-2">
        <IconWarning className="mt-0.5 size-4 shrink-0" />
        <span>{t(lang, 'demoBanner')}</span>
      </span>
    </div>
  )
}

export function DemoBannerGate({ active }: { active: boolean }) {
  if (!active) return null
  return <DemoBanner />
}
