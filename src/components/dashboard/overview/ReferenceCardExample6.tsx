import { ArrowUpIcon, ChevronDownIcon, ShoppingCartIcon } from "lucide-react"

// Réplica de la sexta card de referencia ("Order Overview", chart de línea doble) —
// pensada para "Ventas" (período actual vs anterior). Header con el mismo tratamiento
// del resto de referencias (ícono + título/subtítulo, sin separador); el resto (badge de
// tendencia, stats, selector de rango, chart con 2 series) es literal a la imagen. Datos
// y ejes hardcodeados — es solo para comparar el diseño, no consume nada real todavía.
const SOLID_SERIES = [38, 27, 33, 24, 27, 20, 30, 19, 23, 17, 20, 15, 16]
const DASHED_SERIES = [17, 15, 20, 17, 24, 20, 27, 23, 30, 27, 33, 35, 38]
const X_LABELS = ["Mar 30", "Apr 4", "Apr 9", "Apr 14", "Apr 19", "Apr 24", "Apr 30"]
const Y_TICKS = [0, 10, 20, 30, 40]

const CHART_W = 700
const CHART_H = 260
const PAD_LEFT = 36
const PAD_RIGHT = 8
const PAD_TOP = 10
const PAD_BOTTOM = 28

const INNER_W = CHART_W - PAD_LEFT - PAD_RIGHT
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM

function scaleX(i: number, count: number) {
  return PAD_LEFT + (i / (count - 1)) * INNER_W
}
function scaleY(v: number) {
  return PAD_TOP + INNER_H - (v / 40) * INNER_H
}

function buildSmoothPath(values: number[]): string {
  const points = values.map((v, i) => ({ x: scaleX(i, values.length), y: scaleY(v) }))
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]!
    const p1 = points[i]!
    const midX = (p0.x + p1.x) / 2
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
}

export function ReferenceCardExample6() {
  return (
    <div className="flex flex-col gap-5 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ShoppingCartIcon className="size-8 text-neutral-400" />
          <div>
            <p className="text-sm text-neutral-400">Order Overview</p>
            <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <div className="flex size-5 items-center justify-center rounded-full border border-emerald-400">
            <ArrowUpIcon className="size-3" />
          </div>
          <span className="text-sm font-medium">17.0%</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-neutral-400">Total Sales</p>
            <p className="text-xl font-bold text-white">$22,560</p>
          </div>
          <div className="h-9 w-px bg-neutral-700" />
          <div>
            <p className="text-sm text-neutral-400">Orders</p>
            <p className="text-xl font-bold text-white">1,540</p>
          </div>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3.5 py-2 text-sm text-white">
          Last 30 Days <ChevronDownIcon className="size-3.5 text-neutral-400" />
        </button>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" preserveAspectRatio="none">
        {/* gridlines horizontales + labels del eje Y */}
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

        {/* línea de referencia vertical, punto medio (Apr 14) */}
        <line
          x1={scaleX(3, X_LABELS.length)}
          y1={PAD_TOP}
          x2={scaleX(3, X_LABELS.length)}
          y2={CHART_H - PAD_BOTTOM}
          stroke="#3f3f3f"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* período anterior — línea punteada, de-enfasis */}
        <path d={buildSmoothPath(DASHED_SERIES)} fill="none" stroke="#6b6b6b" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />

        {/* período actual — línea sólida blanca */}
        <path d={buildSmoothPath(SOLID_SERIES)} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* labels del eje X */}
        {X_LABELS.map((label, i) => (
          <text
            key={label}
            x={scaleX(i * 2, SOLID_SERIES.length)}
            y={CHART_H - 6}
            textAnchor="middle"
            className="fill-neutral-500 text-[11px]"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}
