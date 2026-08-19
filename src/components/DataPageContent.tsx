'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'

export function DataPageContent({
  stats,
  clauses,
  maxClause,
  districtRows,
  constituencyRows,
  supporters,
  timeline,
}: {
  stats: { confirmed: number; opened: number; districts: number }
  clauses: { code: string; title_ml: string; title_en: string; cnt: number }[]
  maxClause: number
  districtRows: { district: string; cnt: number }[]
  constituencyRows: { name_ml: string; name_en: string; district: string; cnt: number }[]
  supporters: { display_name: string; district: string }[]
  timeline: { day: string; prepared: number; opened: number; confirmed: number }[]
}) {
  const { lang } = useLang()
  const isMl = lang === 'ml'

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{isMl ? 'പൊതു വിവരം' : 'Public data'}</h1>

      <section className="mt-6" aria-live="polite">
        <p className="text-sm font-medium text-muted">{isMl ? 'സ്ഥിരീകരിച്ച എതിർപ്പുകൾ' : 'Confirmed objections'}</p>
        <p className="mt-1 font-mono text-5xl tabular-nums text-ink">{stats.confirmed.toLocaleString('en-IN')}</p>
        <p className="mt-2 text-sm text-muted">
          {isMl
            ? `മെയിൽ തുറന്നവർ (handoff): ${stats.opened.toLocaleString('en-IN')} · ${stats.districts} ജില്ലകൾ`
            : `Handoff opened: ${stats.opened.toLocaleString('en-IN')} · ${stats.districts} districts`}
        </p>
      </section>

      {clauses.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">{isMl ? 'ആശങ്കകൾ' : 'Concerns selected'}</h2>
          <ul className="mt-4 space-y-3" aria-label={isMl ? 'ആശങ്കകളുടെ എണ്ണം' : 'Clause counts'}>
            {clauses.map((c) => {
              const pct = (c.cnt / maxClause) * 100
              const label = isMl ? c.title_ml : c.title_en
              return (
                <li key={c.code}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="leading-snug">{label}</span>
                    <span className="shrink-0 font-mono tabular-nums font-medium">{c.cnt}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-[4px] bg-rule" aria-hidden="true">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {timeline.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">{isMl ? 'കാലരേഖ' : 'Timeline'}</h2>
          <div className="mt-3 overflow-x-auto rounded-[8px] border border-rule bg-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2">{isMl ? 'ദിവസം' : 'Day'}</th>
                  <th className="px-3 py-2">{isMl ? 'തയ്യാറാക്കി' : 'Prepared'}</th>
                  <th className="px-3 py-2">{isMl ? 'തുറന്നു' : 'Opened'}</th>
                  <th className="px-3 py-2">{isMl ? 'സ്ഥിരീകരിച്ചു' : 'Confirmed'}</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((row) => (
                  <tr key={row.day} className="border-b border-rule">
                    <td className="px-3 py-2">{row.day}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">{row.prepared}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">{row.opened}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">{row.confirmed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {districtRows.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">{isMl ? 'ജില്ലകൾ' : 'Districts'}</h2>
          <div className="mt-3 overflow-x-auto rounded-[8px] border border-rule bg-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2">{isMl ? 'ജില്ല' : 'District'}</th>
                  <th className="px-3 py-2">{isMl ? 'എണ്ണം' : 'Count'}</th>
                </tr>
              </thead>
              <tbody>
                {districtRows.map((row) => (
                  <tr key={row.district} className="border-b border-rule">
                    <td className="px-3 py-2">{row.district}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">{row.cnt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {constituencyRows.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">{isMl ? 'നിയോജകമണ്ഡലങ്ങൾ' : 'Constituencies'}</h2>
          <div className="mt-3 overflow-x-auto rounded-[8px] border border-rule bg-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2">{isMl ? 'നിയോജകമണ്ഡലം' : 'Constituency'}</th>
                  <th className="px-3 py-2">{isMl ? 'ജില്ല' : 'District'}</th>
                  <th className="px-3 py-2">{isMl ? 'എണ്ണം' : 'Count'}</th>
                </tr>
              </thead>
              <tbody>
                {constituencyRows.map((row) => (
                  <tr key={`${row.name_ml}-${row.district}`} className="border-b border-rule">
                    <td className="px-3 py-2">{isMl ? row.name_ml : row.name_en}</td>
                    <td className="px-3 py-2">{row.district}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">{row.cnt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {supporters.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">{isMl ? 'പേര് പരസ്യമാക്കിയവർ' : 'Names shared publicly'}</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {supporters.map((s, i) => (
              <li key={`${s.display_name}-${s.district}-${i}`}>
                {s.display_name} — {s.district}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 rounded-[8px] border border-rule bg-raised p-4 text-sm leading-relaxed text-body">
        <h2 className="text-base font-bold text-ink">{isMl ? 'എണ്ണം എങ്ങനെ?' : 'Methodology'}</h2>
        {isMl ? (
          <>
            <p className="mt-3">
              <strong>എന്താണ് എണ്ണുന്നത്:</strong> ഈ സൈറ്റ് വഴി എതിർപ്പ് തയ്യാറാക്കി, ഇമെയിൽ സ്ഥിരീകരിച്ച്,
              &quot;ഞാൻ അയച്ചു&quot; എന്ന് സ്ഥിരീകരിച്ച രേഖകൾ മാത്രം (status = confirmed_sent അല്ലെങ്കിൽ
              server_sent). ടെസ്റ്റ്/ഡെമോ വരികൾ ഒഴിവാക്കിയിരിക്കുന്നു. ജില്ല, നിയോജകമണ്ഡലം, തിരഞ്ഞെടുത്ത
              ആശങ്കകൾ — വ്യക്തിഗത വിവരമല്ലാത്തത് — aggregate ചെയ്യുന്നു.
            </p>
            <p className="mt-3">
              <strong>എന്ത് എണ്ണുന്നില്ല:</strong> തയ്യാറാക്കി അയച്ചതായി സ്ഥിരീകരിക്കാത്ത രേഖകൾ, ടെസ്റ്റ് വരികൾ,
              ഇമെയിൽ/ഫോൺ/വിലാസം/പിൻകോഡ്/IP. സ്വീകർത്താവിന് മെയിൽ എത്തിയോ എന്ന് പരിശോധിക്കുന്നില്ല.
            </p>
            <p className="mt-3">
              <strong>confirmed vs opened:</strong> &quot;opened&quot; മെയിൽ ആപ്പ്/Gmail തുറന്നവർ.
              &quot;confirmed&quot; അയച്ചതായി സ്വയം സ്ഥിരീകരിച്ചവർ. പൊതു headline-ൽ confirmed മാത്രം.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3">
              <strong>What is counted:</strong> Records where a citizen composed an objection on this site and pressed
              &quot;I sent it&quot;. Test/demo rows are excluded. District, constituency, and selected concerns are
              aggregated — no personal identifiers in those tables.
            </p>
            <p className="mt-3">
              <strong>What is not counted:</strong> Records that were only started or prepared. We do not verify email
              delivery. Email, phone, address, PIN, personal comments, and IP never appear here.
            </p>
            <p className="mt-3">
              <strong>Confirmed vs opened:</strong> &quot;Opened&quot; means a mail app or Gmail was opened from this
              site. &quot;Confirmed&quot; means the citizen self-reported sending. The headline uses confirmed only.
            </p>
          </>
        )}
      </section>
    </PageContainer>
  )
}
