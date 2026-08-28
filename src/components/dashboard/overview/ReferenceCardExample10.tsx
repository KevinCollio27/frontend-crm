import { BarChart3Icon, ChevronDownIcon } from "lucide-react"

// Réplica de la décima card de referencia ("Revenue Overview", barras apiladas) —
// pensada para reemplazar "Last 30 Days" por un selector de Embudo/Funnels más adelante.
// Header con el mismo tratamiento del resto de referencias (ícono + título/subtítulo,
// sin separador) aunque la imagen original no traía ícono. El resto (leyenda, selector,
// chart de 3 series apiladas) es literal a la imagen — datos hardcodeados, sin conectar.
const LEGEND = [
  { label: "Team A", dotClass: "bg-neutral-200" },
  { label: "Team B", dotClass: "bg-neutral-500" },
  { label: "Team C", dotClass: "bg-neutral-400" },
]

// [Team A, Team B, Team C] por categoría — valores aproximados a la imagen, en miles.
const BARS: { label: string; values: [number, number, number] }[] = [
  { label: "Jan 1",  values: [7,    5,   4]   },
  { label: "Jan 4",   values: [7.5,  4,   4.5] },
  { label: "Jan 6",   values: [9,    5.5, 5.5] },
  { label: "Jan 8",   values: [8,    5.5, 5]   },
  { label: "Jan 12",  values: [10,   6,   7]   },
  { label: "Jan 16",  values: [7,    3.5, 5]   },
  { label: "Jan 20",  values: [8.5,  5.5, 6]   },
  { label: "Jan 24",  values: [11,   6.5, 7]   },
  { label: "Jan 28",  values: [10.5, 6,   6.5] },
  { label: "Feb 1",   values: [9,    5,   6]   },
  { label: "Feb 5",   values: [9.5,  6.5, 6]   },
  { label: "Feb 8",   values: [12,   8,   6]   },
]

const Y_TICKS = [0, 5, 10, 15, 20, 25, 30]
const SEGMENT_FILL = ["#e5e5e5", "#737373", "#525252"] // Team A, B, C — claro a oscuro

const CHART_W = 900
const CHART_H = 300
const PAD_LEFT = 34
const PAD_RIGHT = 8
const PAD_TOP = 10
const PAD_BOTTOM = 26
const INNER_W = CHART_W - PAD_LEFT - PAD_RIGHT
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM
const BAR_GAP = 10

function scaleY(v: number) {
  return PAD_TOP + INNER_H - (v / 30) * INNER_H
}

export function ReferenceCardExample10() {
  const bandWidth = INNER_W / BARS.length
  const barWidth = bandWidth - BAR_GAP

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <BarChart3Icon className="size-8 text-neutral-400" />
          <div>
            <p className="text-sm text-neutral-400">Revenue Overview</p>
            <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${l.dotClass}`} />
              <span className="text-xs text-neutral-400">{l.label}</span>
            </div>
          ))}
          <button type="button" className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3.5 py-2 text-sm text-white">
            Last 30 Days <ChevronDownIcon className="size-3.5 text-neutral-400" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold text-white">$640,000</p>
        <p className="text-sm">
          <span className="font-medium text-emerald-400">+18.0%</span>{" "}
          <span className="text-neutral-400">vs last month</span>
        </p>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" preserveAspectRatio="none">
        {Y_TICKS.map((tick) => {
          const y = scaleY(tick)
          return (
            <g key={tick}>
              <line x1={PAD_LEFT} y1={y} x2={CHART_W - PAD_RIGHT} y2={y} stroke="#3f3f3f" strokeWidth={1} strokeDasharray="4 4" />
              <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" className="fill-neutral-500 text-[11px]">
                {tick === 0 ? "0" : `${tick}k`}
              </text>
            </g>
          )
        })}

        {BARS.map((bar, i) => {
          const x = PAD_LEFT + i * bandWidth + BAR_GAP / 2
          let acc = 0
          return (
            <g key={bar.label}>
              {bar.values.map((v, si) => {
                const yTop = scaleY(acc + v)
                const yBottom = scaleY(acc)
                acc += v
                return (
                  <rect
                    key={si}
                    x={x}
                    y={yTop}
                    width={barWidth}
                    height={yBottom - yTop}
                    fill={SEGMENT_FILL[si]}
                    rx={si === bar.values.length - 1 ? 3 : 0}
                  />
                )
              })}
              <text x={x + barWidth / 2} y={CHART_H - 6} textAnchor="middle" className="fill-neutral-500 text-[11px]">
                {bar.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
