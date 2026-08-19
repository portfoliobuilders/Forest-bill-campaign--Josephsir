'use client'

import Link from 'next/link'

import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function NoLiveConsultation() {
  const { lang } = useLang()

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t(lang, 'noLiveTitle')}</h1>
      <p className="mt-3 text-base leading-relaxed text-stone-700">{t(lang, 'noLiveBody')}</p>
      <Link
        href="/demo"
        className={cx(
          'mt-6 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white hover:bg-emerald-900',
          focusRing,
        )}
      >
        {t(lang, 'tryDemo')}
      </Link>
    </main>
  )
}
