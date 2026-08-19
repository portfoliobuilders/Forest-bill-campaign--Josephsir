'use client'

import { useLang } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

export function Step3_Verify({ onContinue }: { onContinue: () => void }) {
  const { lang } = useLang()

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">{t(lang, 'verify')}</h2>
      <p className="mt-3 text-base leading-relaxed text-stone-700">{t(lang, 'verifyPlaceholder')}</p>
      <button
        type="button"
        onClick={onContinue}
        className={`mt-6 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-emerald-800 px-5 text-base font-semibold text-white transition-colors duration-150 hover:bg-emerald-900 ${focusRing}`}
      >
        {t(lang, 'continue')}
      </button>
    </div>
  )
}
