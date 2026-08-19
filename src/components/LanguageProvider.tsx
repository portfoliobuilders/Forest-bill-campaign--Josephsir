'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { persistLangCookie } from '@/lib/lang'
import { defaultLang, type Lang } from '@/lib/i18n'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang
  children: ReactNode
}) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next)
        persistLangCookie(next)
      },
    }),
    [lang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return {
      lang: defaultLang,
      setLang: () => {},
    }
  }
  return ctx
}
