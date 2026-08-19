'use client'

import Link from 'next/link'

import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function HomePage() {
  const { lang } = useLang()

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t(lang, 'siteName')}</h1>
      <p className="mt-2 text-lg text-stone-800">{t(lang, 'tagline')}</p>
      <p className="mt-4 text-base leading-relaxed text-stone-700">{t(lang, 'homeIntro')}</p>
      <Link
        href="/objection"
        className={`mt-8 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white transition-colors duration-150 hover:bg-emerald-900 ${focusRing}`}
      >
        {t(lang, 'ctaStart')}
      </Link>
      <p className="mt-8 text-sm text-stone-600">{t(lang, 'notOfficial')}</p>
    </main>
  )
}
