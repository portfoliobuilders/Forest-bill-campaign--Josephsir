'use client'

import Link from 'next/link'

import { LanguageToggle } from '@/components/LanguageToggle'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'

export function Header() {
  const { lang } = useLang()

  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className={`min-h-11 min-w-0 content-center ${focusRing}`}>
          <span className="block font-mono text-[11px] font-medium tracking-[0.16em] text-muted">
            {t(lang, 'wordmarkEn')}
          </span>
          <span className="mt-1 block text-xl leading-none text-ink [font-family:var(--font-gayathri),serif] [letter-spacing:0]">
            {t(lang, 'wordmarkMl')}
          </span>
        </Link>
        <LanguageToggle />
      </div>
    </header>
  )
}
