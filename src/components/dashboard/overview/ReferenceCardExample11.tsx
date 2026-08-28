import { InboxIcon, WalletIcon } from "lucide-react"

// Réplica de la undécima card de referencia ("Sales Distribution", anillo radial) —
// mismo esqueleto que la referencia 5 (Customer Segmentation), con montos en vez de
// conteos. Header con el mismo tratamiento del resto (ícono + título/subtítulo, sin
// separador) — la imagen original no traía subtítulo, se agrega "Shadcn Dashboard" para
// quedar alineada con las demás.
const TICK_COUNT = 48
const R_INNER = 39
const R_OUTER = 47

const SOURCES = [
  { label: "Website",     value: "$4,385",  trend: "+4.7%", barClass: "bg-white"       },
  { label: "Marketplace", value: "$4,590",  trend: "+2.1%", barClass: "bg-neutral-400" },
  { label: "Affiliate",   value: "$18,356", trend: "+1.7%", barClass: "bg-neutral-600" },
]

export function ReferenceCardExample11() {
  return (
    <div className="flex flex-col gap-5 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex items-center gap-2.5">
        <InboxIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Sales Distribution</p>
          <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
        </div>
      </div>

      <div className="relative mx-auto flex size-48 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const angle = (i / TICK_COUNT) * 2 * Math.PI
            const x1 = 50 + R_INNER * Math.sin(angle)
            const y1 = 50 - R_INNER * Math.cos(angle)
            const x2 = 50 + R_OUTER * Math.sin(angle)
            const y2 = 50 - R_OUTER * Math.cos(angle)
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={2} strokeLinecap="round" />
            )
          })}
        </svg>
        <div className="relative flex size-24 flex-col items-center justify-center gap-1 rounded-full bg-neutral-800">
          <div className="flex size-7 items-center justify-center rounded-full bg-neutral-700">
            <WalletIcon className="size-3.5 text-white" />
          </div>
          <p className="text-[10px] tracking-wide text-neutral-400">TOTAL REVENUE</p>
          <p className="text-base font-bold text-white">$284,920.00</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SOURCES.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <span className={`h-6 w-1 shrink-0 rounded-full ${s.barClass}`} />
            <span className="flex-1 text-sm text-white">{s.label}</span>
            <span className="text-sm font-medium text-white">{s.value}</span>
            <span className="w-14 shrink-0 text-right text-sm text-emerald-400">{s.trend}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
