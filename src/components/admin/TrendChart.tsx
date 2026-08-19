export function TrendChart({
  points,
}: {
  points: { day: string; prepared: number; emailOpened: number; confirmedSent: number }[]
}) {
  const width = 640
  const height = 220
  const pad = { top: 16, right: 12, bottom: 28, left: 36 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const max = Math.max(1, ...points.flatMap((p) => [p.prepared, p.emailOpened, p.confirmedSent]))
  const n = Math.max(1, points.length - 1)

  function xy(index: number, value: number) {
    const x = pad.left + (n === 0 ? innerW / 2 : (index / n) * innerW)
    const y = pad.top + innerH - (value / max) * innerH
    return `${x},${y}`
  }

  function line(key: 'prepared' | 'emailOpened' | 'confirmedSent') {
    return points.map((point, index) => xy(index, point[key])).join(' ')
  }

  const ticks = points.filter((_, index) => index === 0 || index === points.length - 1 || points.length < 10)

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full min-w-[20rem]" role="img" aria-label="Participation trend">
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + innerH} stroke="#e3e0d8" />
        <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} stroke="#e3e0d8" />
        <polyline fill="none" stroke="#0f5132" strokeWidth="2" points={line('prepared')} />
        <polyline fill="none" stroke="#5b8a6e" strokeWidth="2" points={line('emailOpened')} />
        <polyline fill="none" stroke="#1a1a18" strokeWidth="2" points={line('confirmedSent')} />
        {ticks.map((point) => {
          const index = points.indexOf(point)
          const x = pad.left + (n === 0 ? innerW / 2 : (index / n) * innerW)
          return (
            <text key={point.day} x={x} y={height - 8} textAnchor="middle" className="fill-stone-500" fontSize="10">
              {point.day.slice(5)}
            </text>
          )
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-4 text-xs text-stone-600">
        <li className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-emerald-800" /> Prepared
        </li>
        <li className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-[#5b8a6e]" /> Email opened
        </li>
        <li className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-stone-900" /> Confirmed sent
        </li>
      </ul>
    </div>
  )
}
