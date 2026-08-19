'use client'

import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

export function NoLiveConsultation() {
  const { lang } = useLang()

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t(lang, 'noLiveTitle')}</h1>
      <p className="mt-3 text-base leading-relaxed text-stone-700">{t(lang, 'noLiveBody')}</p>
    </main>
  )
}
