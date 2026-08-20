'use client'

import Link from 'next/link'

import { LanguageToggle } from '@/components/LanguageToggle'
import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'

export function Header({
  titleMl,
  titleEn,
  taglineMl,
  taglineEn,
  logoUrl,
}: {
  titleMl?: string
  titleEn?: string
  taglineMl?: string
  taglineEn?: string
  logoUrl?: string | null
}) {
  const { lang } = useLang()
  const english = titleEn?.trim() || t('en', 'wordmarkEn')
  const malayalam = titleMl?.trim() || t('ml', 'wordmarkMl')
  const tagline = (lang === 'en' ? taglineEn : taglineMl)?.trim() || (lang === 'en' ? taglineMl : taglineEn)?.trim() || ''

  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className={`min-h-11 min-w-0 content-center ${focusRing}`}>
          {logoUrl ? (
            <span className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="h-10 w-auto max-w-[9rem] object-contain sm:h-11" />
              <span className="min-w-0">
                <span className="block font-mono text-[11px] font-medium tracking-[0.16em] text-muted">{english}</span>
                <span className="mt-1 block text-xl leading-none text-ink [font-family:var(--font-gayathri),serif]">
                  {malayalam}
                </span>
              </span>
            </span>
          ) : (
            <>
              <span className="block font-mono text-[11px] font-medium tracking-[0.16em] text-muted">{english}</span>
              <span className="mt-1 block text-xl leading-none text-ink [font-family:var(--font-gayathri),serif] [letter-spacing:0]">
                {malayalam}
              </span>
            </>
          )}
          {tagline ? <span className="mt-1 hidden text-xs text-muted sm:block">{tagline}</span> : null}
        </Link>
        <LanguageToggle />
      </div>
    </header>
  )
}
