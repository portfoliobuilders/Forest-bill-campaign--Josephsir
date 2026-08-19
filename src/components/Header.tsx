'use client'

import Link from 'next/link'

import { useLang } from '@/components/LanguageProvider'
import { t, type Lang } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function Header() {
  const { lang, setLang } = useLang()
  const nextLang: Lang = lang === 'ml' ? 'en' : 'ml'

  return (
    <header className="border-b border-stone-300 bg-white">
      <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className={`min-h-[44px] min-w-[44px] content-center text-lg font-bold text-emerald-900 ${focusRing}`}
        >
          {t(lang, 'siteName')}
        </Link>
        <button
          type="button"
          onClick={() => setLang(nextLang)}
          className={`min-h-[44px] min-w-[44px] rounded-md border border-stone-400 px-3 text-base text-stone-900 transition-colors duration-150 hover:bg-stone-100 ${focusRing}`}
        >
          {t(lang, 'languageToggle')}
        </button>
      </div>
    </header>
  )
}
