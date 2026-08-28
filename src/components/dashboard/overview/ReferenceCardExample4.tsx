import { WalletIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Réplica de la cuarta card de referencia ("Total Assets", distribución) — pensada para
// Oportunidades: el patrón total + barra segmentada + desglose calza con "Pipeline por
// Etapa", que ya tenemos como dato real (pipelineByStage). Por ahora es literal a la
// imagen — la adaptación con datos reales queda para después. Subtítulo alineado a la
// referencia 1, mismo criterio que las cards 2 y 3.
const DISTRIBUTION = [
  { label: "Product Sales",   value: "$312,500.45", percent: 65 },
  { label: "Service Revenue", value: "$125,000.25", percent: 26 },
  { label: "Other Income",    value: "$40,730.20",  percent: 9  },
]

const BAR_SEGMENTS = 40
const FILLED_SEGMENTS = 26 // ~65%, el mismo peso que "Product Sales"

export function ReferenceCardExample4() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5">
        <WalletIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Total Assets</p>
          <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-6 pt-4 pb-4">
        <p className="text-3xl font-bold text-white">$478,230.90</p>
        <p className="text-sm">
          <span className="font-medium text-emerald-400">+15.7%</span>{" "}
          <span className="text-white">+$65,000</span>{" "}
          <span className="text-neutral-400">vs last month</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 px-6 pb-5">
        <p className="text-sm font-medium text-white">Distribution</p>
        <div className="flex gap-0.5">
          {Array.from({ length: BAR_SEGMENTS }).map((_, i) => (
            <div key={i} className={cn("h-6 w-1.5 rounded-[1px]", i < FILLED_SEGMENTS ? "bg-white" : "bg-neutral-700")} />
          ))}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-800 border-t border-neutral-800">
        {DISTRIBUTION.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-neutral-400" />
              <span className="text-sm text-white">{item.label}</span>
            </div>
            <span className="text-sm text-white">
              {item.value} <span className="text-neutral-500">({item.percent}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
