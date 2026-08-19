import type { Metadata } from 'next'
import { Gayathri, IBM_Plex_Mono, Instrument_Serif, Inter, Manjari } from 'next/font/google'
import { cookies } from 'next/headers'

import { DemoBannerGate } from '@/components/DemoBanner'
import { Header } from '@/components/Header'
import { LanguageProvider } from '@/components/LanguageProvider'
import { SiteFooterGate } from '@/components/SiteFooter'
import { resolveCampaignState } from '@/lib/campaign'
import { parseLang } from '@/lib/lang'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-instrument',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-ibm',
})

const gayathri = Gayathri({
  subsets: ['malayalam'],
  weight: '700',
  display: 'swap',
  variable: '--font-gayathri',
})

const manjari = Manjari({
  subsets: ['malayalam', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-manjari',
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
    <html
      lang={lang}
      className={`${inter.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} ${gayathri.variable} ${manjari.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-surface text-base text-ink antialiased">
        <LanguageProvider initialLang={lang}>
          <DemoBannerGate active={campaignState.state !== 'live'} />
          <Header />
          <div className="flex-1">{children}</div>
          <SiteFooterGate />
        </LanguageProvider>
      </body>
    </html>
  )
}
