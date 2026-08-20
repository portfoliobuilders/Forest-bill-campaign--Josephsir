'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useLang } from '@/components/LanguageProvider'
import { PortfolixLockup } from '@/components/PortfolixLockup'
import { t } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'

const primaryLinks = [
  { href: '/about', key: 'footerAbout' as const },
  { href: '/faq', key: 'footerFaq' as const },
  { href: '/privacy', key: 'footerPrivacy' as const },
  { href: '/contact', key: 'footerContact' as const },
]

const secondaryLinks = [
  { href: '/data', key: 'footerData' as const },
  { href: '/delete', key: 'footerDelete' as const },
]

export function SiteFooter({
  disclaimerMl,
  disclaimerEn,
  footerMl,
  footerEn,
  supportEmail,
}: {
  disclaimerMl?: string
  disclaimerEn?: string
  footerMl?: string
  footerEn?: string
  supportEmail?: string | null
}) {
  const { lang } = useLang()
  const disclaimer = (lang === 'en' ? disclaimerEn : disclaimerMl)?.trim() || t(lang, 'notOfficial')
  const footerNote = (lang === 'en' ? footerEn : footerMl)?.trim() || ''

  return (
    <footer className="mt-auto bg-ink text-stone-300">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <nav aria-label={t(lang, 'footerAbout')} className="flex flex-col gap-x-8 gap-y-3 sm:flex-row sm:flex-wrap">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-11 items-center text-sm font-medium text-stone-200 hover:text-white ${focusRing}`}
            >
              {t(lang, link.key)}
            </Link>
          ))}
        </nav>
        <nav className="mt-4 flex flex-col gap-x-8 gap-y-2 sm:flex-row sm:flex-wrap" aria-label={t(lang, 'footerData')}>
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-11 items-center text-sm text-stone-400 hover:text-stone-200 ${focusRing}`}
            >
              {t(lang, link.key)}
            </Link>
          ))}
        </nav>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-stone-400">{disclaimer}</p>
        {footerNote ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">{footerNote}</p> : null}
        {supportEmail ? (
          <p className="mt-3 text-sm text-stone-400">
            <a href={`mailto:${supportEmail}`} className={`text-stone-200 underline ${focusRing}`}>
              {supportEmail}
            </a>
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-mono text-xs text-stone-500">{t(lang, 'footerCopyright')}</p>
          <a
            href="https://portfolix.tech/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(lang, 'portfolixCredit')}
            className={`inline-flex max-w-full items-center gap-3 rounded-md bg-black px-2 py-1.5 hover:bg-black ${focusRing}`}
          >
            <PortfolixLockup className="px-2 py-1.5" />
            <span className="font-mono text-[10px] tracking-wide text-stone-400">
              Powered by <span className="font-semibold text-white">Portfolix.tech</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  )
}

export function SiteFooterGate(props: {
  disclaimerMl?: string
  disclaimerEn?: string
  footerMl?: string
  footerEn?: string
  supportEmail?: string | null
}) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return <SiteFooter {...props} />
}
