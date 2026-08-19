import { cookies } from 'next/headers'
import Link from 'next/link'

import { PageContainer } from '@/components/ui/PageContainer'
import { resolveCampaignState } from '@/lib/campaign'
import { demoCampaign } from '@/lib/demo-data'
import { t } from '@/lib/i18n'
import { parseLang } from '@/lib/lang'
import { btnPrimary, focusRing } from '@/lib/ui'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ preview?: string }>
}

export default async function BillPage({ searchParams }: Props) {
  const params = await searchParams
  const state = await resolveCampaignState(params.preview)
  const campaign = state.state === 'dormant' ? demoCampaign : state.campaign
  const cookieStore = await cookies()
  const lang = parseLang(cookieStore.get('lang')?.value)
  const title = lang === 'en' ? campaign.title_en : campaign.title_ml
  const summary = lang === 'en' ? campaign.homepage_intro_en || campaign.summary_en : campaign.homepage_intro_ml || campaign.summary_ml
  const bullets = (lang === 'en' ? campaign.explainer_en : campaign.explainer_ml) ?? []

  return (
    <PageContainer>
      <p className="font-mono text-xs text-muted sm:text-sm">{t(lang, 'gazetteBill')}</p>
      <h1 className="font-display mt-3 text-2xl text-ink sm:text-3xl">{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-body">{summary}</p>
      {bullets.length > 0 ? (
        <ol className="mt-6 space-y-3">
          {bullets.map((item, index) => (
            <li key={item} className="flex gap-3 text-base leading-relaxed text-body">
              <span className="w-8 shrink-0 font-mono text-sm font-medium text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {campaign.source_url ? (
        <p className="mt-6">
          <a
            href={campaign.source_url}
            className={`font-medium text-accent underline ${focusRing}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(lang, 'aboutSource')}
          </a>
        </p>
      ) : null}
      <Link href="/objection" className={`${btnPrimary} mt-8 inline-flex`}>
        {t(lang, 'ctaStart')}
      </Link>
    </PageContainer>
  )
}
