'use client'

import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import { t, type Lang } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'

export function LanguageToggle() {
  const { lang, setLang } = useLang()

  function optionClass(active: boolean) {
    return cx(
      'inline-flex min-h-11 items-center justify-center px-3 py-2 text-sm font-semibold leading-snug',
      active ? 'bg-accent text-white' : 'bg-transparent text-body hover:bg-accent-tint hover:text-ink',
      focusRing,
    )
  }

  return (
    <div role="group" aria-label={t(lang, 'languageGroup')} className="inline-flex shrink-0 overflow-hidden rounded-[5px] border border-rule">
      <button type="button" lang="ml" aria-pressed={lang === 'ml'} onClick={() => setLang('ml' satisfies Lang)} className={optionClass(lang === 'ml')}>
        {t(lang, 'langMlLabel')}
      </button>
      <span className="self-center px-1 text-muted" aria-hidden="true">
        |
      </span>
      <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en' satisfies Lang)} className={optionClass(lang === 'en')}>
        {t(lang, 'langEnLabel')}
      </button>
    </div>
  )
}
