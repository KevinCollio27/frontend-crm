import { ChevronDownIcon, TrendingUpIcon } from "lucide-react"

// Réplica de la referencia "Net Revenue" (barras + línea de pico + 3 mini-stats) que trajo
// el usuario, retrofiteada con el mismo tratamiento de header del resto de referencias
// (ícono + título/subtítulo) en vez del título plano de la imagen original. Pensada como
// mockup de "Nuevas Oportunidades por Mes" — la métrica que reemplazó a "ganadas por mes"
// (ver análisis previo: ganadas queda muy flaco en data real, nuevas oportunidades no).
// Hardcodeado, sin conectar — solo para validar visualmente antes de construir la versión real.
const BARS: { label: string; value: number }[] = [
  { label: "ENE", value: 60 },
  { label: "FEB", value: 95 },
  { label: "MAR", value: 75 },
  { label: "ABR", value: 135 },
  { label: "MAY", value: 165 },
  { label: "JUN", value: 105 },
  { label: "JUL", value: 225 },
  { label: "AGO", value: 640 },
  { label: "SEP", value: 320 },
  { label: "OCT", value: 195 },
  { label: "NOV", value: 85 },
  { label: "DIC", value: 215 },
]

const PEAK = BARS.reduce((max, b) => (b.value > max.value ? b : max), BARS[0])
const TOTAL = BARS.reduce((sum, b) => sum + b.value, 0)
const AVG = Math.round(TOTAL / BARS.length)

function fmtK(value: number) {
  return `$${value}K`
}

const CHART_W = 900
const CHART_H = 260
const PAD_LEFT = 8
const PAD_RIGHT = 8
const PAD_TOP = 40
const PAD_BOTTOM = 26
const INNER_W = CHART_W - PAD_LEFT - PAD_RIGHT
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM
const BAR_GAP = 18

function scaleY(v: number) {
  return PAD_TOP + INNER_H - (v / PEAK.value) * INNER_H
}

export function ReferenceCardExample17() {
  const bandWidth = INNER_W / BARS.length
  const barWidth = bandWidth - BAR_GAP
  const peakY = scaleY(PEAK.value)

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <TrendingUpIcon className="size-8 text-neutral-400" />
          <div>
            <p className="text-sm text-neutral-400">Pipeline Generado</p>
            <p className="text-base font-semibold text-white">Nuevas Oportunidades</p>
          </div>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3.5 py-2 text-sm text-white">
          Este Año <ChevronDownIcon className="size-3.5 text-neutral-400" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold text-white">{fmtK(PEAK.value)}</p>
        <p className="text-sm">
          <span className="font-medium text-emerald-400">+8,2%</span>{" "}
          <span className="text-neutral-400">vs. mes anterior</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-neutral-800/60 px-4 py-3">
          <p className="text-xs text-neutral-400">Mes Pico</p>
          <p className="text-sm font-semibold text-white">{PEAK.label} · {fmtK(PEAK.value)}</p>
        </div>
        <div className="rounded-lg bg-neutral-800/60 px-4 py-3">
          <p className="text-xs text-neutral-400">Promedio Mensual</p>
          <p className="text-sm font-semibold text-white">{fmtK(AVG)}</p>
        </div>
        <div className="rounded-lg bg-neutral-800/60 px-4 py-3">
          <p className="text-xs text-neutral-400">Total del Año</p>
          <p className="text-sm font-semibold text-white">${(TOTAL / 1000).toFixed(1)}M</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="ref17BarTexture" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#404040" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#5c5c5c" strokeWidth="2" />
          </pattern>
        </defs>

        <line x1={PAD_LEFT} y1={peakY} x2={CHART_W - PAD_RIGHT} y2={peakY} stroke="#525252" strokeWidth={1} strokeDasharray="4 4" />
        <g>
          <rect x={PAD_LEFT} y={peakY - 22} width={56} height={20} rx={4} fill="#ffffff" />
          <text x={PAD_LEFT + 28} y={peakY - 8} textAnchor="middle" className="fill-[#131313] text-[11px] font-semibold">
            {fmtK(PEAK.value)}
          </text>
        </g>

        {BARS.map((bar, i) => {
          const x = PAD_LEFT + i * bandWidth + BAR_GAP / 2
          const y = scaleY(bar.value)
          const isPeak = bar.label === PEAK.label
          return (
            <g key={bar.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={CHART_H - PAD_BOTTOM - y}
                rx={4}
                fill={isPeak ? "#ffffff" : "url(#ref17BarTexture)"}
              />
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
