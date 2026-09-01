import { LayersIcon, UsersIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Réplica de la quinta card de referencia ("Customer Segmentation", anillo radial) —
// pensada para "Origen" en Contactos/Organizaciones (Widget, Google Contacts, Manual...).
// Header con el mismo tratamiento de la referencia 1 (ícono + título/subtítulo, sin
// separador) — el resto (anillo, centro, lista de segmentos) es literal a la imagen.
const TICK_COUNT = 48
const R_INNER = 39
const R_OUTER = 47

const SEGMENTS = [
  { label: "Startup",     value: "2,310", trend: 32.8, barClass: "bg-white"       },
  { label: "Enterprise",  value: "800",   trend: 32.8, barClass: "bg-neutral-400" },
  { label: "Individuals", value: "310",   trend: -1.7, barClass: "bg-neutral-600" },
]

export function ReferenceCardExample5() {
  return (
    <div className="flex flex-col gap-5 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex items-center gap-2.5">
        <LayersIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Customer Segmentation</p>
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
            <UsersIcon className="size-3.5 text-white" />
          </div>
          <p className="text-xs text-neutral-400">Total</p>
          <p className="text-lg font-bold text-white">3,420</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SEGMENTS.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2.5">
            <span className={cn("h-6 w-1 shrink-0 rounded-full", seg.barClass)} />
            <span className="flex-1 text-sm text-white">{seg.label}</span>
            <span className="text-sm font-medium text-white">{seg.value}</span>
            <span className={cn("w-14 shrink-0 text-right text-sm", seg.trend >= 0 ? "text-emerald-400" : "text-red-400")}>
              {seg.trend >= 0 ? "+" : ""}{seg.trend}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
