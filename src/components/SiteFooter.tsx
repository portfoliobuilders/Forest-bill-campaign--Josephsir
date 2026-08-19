'use client'

import Link from 'next/link'

import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

const links = [
  { href: '/data', key: 'footerData' as const },
  { href: '/privacy', key: 'footerPrivacy' as const },
  { href: '/delete', key: 'footerDelete' as const },
  { href: '/about', key: 'footerAbout' as const },
]

export function SiteFooter() {
  const { lang } = useLang()

  return (
    <footer className="mt-12 border-t border-stone-300 py-6">
      <nav className="flex flex-wrap gap-x-4 gap-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`min-h-[44px] content-center text-sm font-medium text-emerald-900 underline ${focusRing}`}
          >
            {t(lang, link.key)}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-sm text-stone-600">{t(lang, 'notOfficial')}</p>
    </footer>
  )
}
