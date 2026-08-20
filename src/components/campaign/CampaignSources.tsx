'use client'

import { useLang } from '@/components/LanguageProvider'
import { isSourceImageMime, publicationDateForDisplay } from '@/lib/campaign-sources'
import { formatCampaignDate } from '@/lib/format-date'
import { t } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'
import type { CampaignSource } from '@/types/database'

export function CampaignSources({ sources }: { sources: CampaignSource[] }) {
  const { lang } = useLang()
  const visible = sources.filter((source) => source.is_public)
  if (visible.length === 0) return null

  return (
    <details className="mt-10 max-w-3xl border-t border-rule pt-5">
      <summary className={`min-h-11 cursor-pointer list-outside py-2 text-base font-semibold text-ink ${focusRing}`}>
        {t(lang, 'sourcesHeading')} → {t(lang, 'sourcesView')}
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t(lang, 'sourcesSupportNote')}</p>
      <ul className="mt-4 space-y-5">
        {visible.map((source) => {
          const title = lang === 'en' ? source.title_en || source.title_ml : source.title_ml || source.title_en
          const description =
            lang === 'en' ? source.description_en || source.description_ml : source.description_ml || source.description_en
          const published = formatCampaignDate(publicationDateForDisplay(source.publication_date), lang)
          return (
            <li key={source.id} className="rounded-[8px] border border-rule bg-raised p-4">
              <p className="font-mono text-xs text-muted">
                {source.publication_name}
                {published ? ` · ${published}` : ''}
              </p>
              {title ? <p className="mt-2 text-base font-semibold leading-snug text-ink">{title}</p> : null}
              {description ? <p className="mt-2 text-sm leading-relaxed text-body">{description}</p> : null}
              {source.file_url && isSourceImageMime(source.file_mime) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={source.file_url}
                  alt={title || source.publication_name}
                  className="mt-3 max-h-72 w-auto max-w-full rounded border border-rule"
                />
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3">
                {source.file_url ? (
                  <a
                    href={source.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-accent"
                  >
                    {t(lang, 'sourcesOpenFile')}
                  </a>
                ) : null}
                {source.source_url ? (
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-accent"
                  >
                    {t(lang, 'sourcesOpenLink')}
                  </a>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
