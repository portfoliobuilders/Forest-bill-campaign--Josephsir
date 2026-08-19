'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { AdminCard, AdminPageHeader, EmptyState, KpiCard } from '@/components/admin/AdminPrimitives'
import { TrendChart } from '@/components/admin/TrendChart'
import { adminFocus } from '@/components/admin/admin-ui'
import type { DashboardData } from '@/lib/admin/queries'

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const range = searchParams.get('range') === '30d' || searchParams.get('range') === 'all' ? searchParams.get('range')! : '7d'

  function setRange(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === '7d') params.delete('range')
    else params.set('range', next)
    router.push(`/admin${params.toString() ? `?${params}` : ''}`)
  }

  const { funnel, funnelPercents, dropOff } = data

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="How many people took part, how far they got, and which concerns they chose."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((card) => (
          <KpiCard key={card.key} label={card.label} value={card.value} hint={card.hint} weekPct={card.weekPct} />
        ))}
      </section>

      <AdminCard title="Participation funnel">
        {funnel.started === 0 ? (
          <EmptyState title="No submissions yet." body="When citizens prepare an objection, the funnel will fill in." />
        ) : (
          <ol className="space-y-4">
            {[
              { label: 'Started', value: funnel.started, conversion: 100, drop: null as number | null },
              { label: 'Prepared', value: funnel.prepared, conversion: funnelPercents.prepared, drop: dropOff.prepared },
              { label: 'Email Opened', value: funnel.emailOpened, conversion: funnelPercents.emailOpened, drop: dropOff.emailOpened },
              { label: 'Confirmed Sent', value: funnel.confirmedSent, conversion: funnelPercents.confirmedSent, drop: dropOff.confirmedSent },
            ].map((step, index) => {
              const width = Math.max(8, (step.value / Math.max(1, funnel.started)) * 100)
              return (
                <li key={step.label}>
                  {index > 0 ? (
                    <p className="mb-2 text-center text-xs text-stone-500">↓ {step.drop ?? 0}% drop-off</p>
                  ) : null}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{step.label}</span>
                    <span className="tabular-nums text-stone-600">
                      {step.value.toLocaleString('en-IN')}
                      {step.conversion === null ? '' : ` · ${step.conversion}%`}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-sm bg-stone-100">
                    <div className="h-full bg-emerald-800" style={{ width: `${width}%` }} />
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="Participation trend"
          action={
            <div className="flex gap-1">
              {(['7d', '30d', 'all'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRange(item)}
                  className={`min-h-9 rounded-md px-2 text-xs font-medium ${adminFocus} ${
                    range === item ? 'bg-emerald-800 text-white' : 'border border-stone-300 bg-white'
                  }`}
                >
                  {item === '7d' ? '7 days' : item === '30d' ? '30 days' : 'All time'}
                </button>
              ))}
            </div>
          }
        >
          <TrendChart points={data.trend} />
        </AdminCard>

        <AdminCard title="Most selected concerns">
          {data.topConcerns.length === 0 ? (
            <EmptyState title="No concerns selected yet." body="Concern counts appear once submissions include clauses." />
          ) : (
            <ol className="space-y-2">
              {data.topConcerns.map((concern, index) => (
                <li key={concern.id}>
                  <Link
                    href={`/admin/concerns/${concern.id}`}
                    className={`flex items-baseline justify-between gap-3 rounded-md px-1 py-1 hover:bg-stone-50 ${adminFocus}`}
                  >
                    <span className="min-w-0">
                      <span className="mr-2 font-mono text-xs text-stone-400">{String(index + 1).padStart(2, '0')}</span>
                      {concern.title_en}
                    </span>
                    <span className="shrink-0 tabular-nums text-sm text-stone-600">
                      {concern.cnt} · {concern.pct}%
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Top districts">
          {data.topDistricts.length === 0 ? (
            <EmptyState title="No districts yet." body="Districts appear from real submissions." />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topDistricts.map((row) => (
                <li key={row.name} className="flex justify-between gap-3">
                  <span>{row.name}</span>
                  <span className="tabular-nums font-medium">{row.cnt}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
        <AdminCard title="Top constituencies">
          {data.topConstituencies.length === 0 ? (
            <EmptyState
              title="No constituency data yet."
              body="Constituencies are shown only when a citizen confirmed one."
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topConstituencies.map((row) => (
                <li key={row.name} className="flex justify-between gap-3">
                  <span>{row.name}</span>
                  <span className="tabular-nums font-medium">{row.cnt}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
