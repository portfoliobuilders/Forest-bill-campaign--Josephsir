import type { Metadata } from 'next'
import { Noto_Sans_Malayalam } from 'next/font/google'
import { cookies } from 'next/headers'

import { Header } from '@/components/Header'
import { LanguageProvider } from '@/components/LanguageProvider'
import { parseLang } from '@/lib/lang'

import './globals.css'

const notoSansMalayalam = Noto_Sans_Malayalam({
  subsets: ['malayalam', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ജനശബ്ദം',
  description: 'Kerala civic consultation objections',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const lang = parseLang(cookieStore.get('lang')?.value)

  return (
    <html lang={lang} className={notoSansMalayalam.className}>
      <body className="min-h-dvh bg-stone-100 text-base text-stone-900 antialiased">
        <LanguageProvider initialLang={lang}>
          <Header />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
