import type { Metadata } from 'next'
import { Noto_Sans_Malayalam } from 'next/font/google'
import { cookies } from 'next/headers'

import { Header } from '@/components/Header'
import { DemoBanner } from '@/components/DemoBanner'
import { LanguageProvider } from '@/components/LanguageProvider'
import { resolveCampaignState } from '@/lib/campaign'
import { parseLang } from '@/lib/lang'

import './globals.css'

const notoSansMalayalam = Noto_Sans_Malayalam({
  subsets: ['malayalam', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://janashabdam.in'

export const metadata: Metadata = {
  title: 'ജനശബ്ദം',
  description: 'നിങ്ങളുടെ സ്വന്തം ഇമെയിൽ വിലാസത്തിൽ നിന്ന് കൂടിയാലോചനയോടുള്ള വ്യക്തിഗത എതിർപ്പ് അയയ്ക്കുക.',
  openGraph: {
    title: 'ജനശബ്ദം — നിങ്ങളുടെ വിലാസത്തിൽ നിന്നുള്ള എതിർപ്പ്',
    description:
      'കേരളത്തിലെ കൂടിയാലോചനകളോട് നിങ്ങളുടെ സ്വന്തം ഇമെയിൽ വിലാസത്തിൽ നിന്ന് വ്യക്തിഗത എതിർപ്പ് തയ്യാറാക്കി അയയ്ക്കുക.',
    url: siteUrl,
    siteName: 'ജനശബ്ദം',
    locale: 'ml_IN',
    type: 'website',
    images: [{ url: `${siteUrl}/og-image.svg`, width: 1200, height: 630, alt: 'ജനശബ്ദം' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ജനശബ്ദം — നിങ്ങളുടെ വിലാസത്തിൽ നിന്നുള്ള എതിർപ്പ്',
    description: 'കൂടിയാലോചനയോടുള്ള വ്യക്തിഗത എതിർപ്പ് — നിങ്ങളുടെ ഇമെയിൽ, നിങ്ങളുടെ ശബ്ദം.',
    images: [`${siteUrl}/og-image.svg`],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const lang = parseLang(cookieStore.get('lang')?.value)
  const campaignState = await resolveCampaignState()

  return (
    <html lang={lang} className={notoSansMalayalam.className}>
      <body className="min-h-dvh bg-stone-100 text-base text-stone-900 antialiased">
        <LanguageProvider initialLang={lang}>
          {campaignState.state === 'preview' ? <DemoBanner /> : null}
          <Header />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
