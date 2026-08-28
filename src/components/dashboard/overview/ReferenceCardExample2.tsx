import { TrendingUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Réplica de la segunda card de referencia ("Monthly Sales", dot-matrix) — mismo criterio
// que ReferenceCardExample: colores/textos hardcodeados a propósito, solo para comparar.
// Título/subtítulo alineados a la referencia 1 ("Shadcn Dashboard") aunque la imagen
// original de esta card no traía subtítulo — pedido explícito para que ambas se vean
// parejas una al lado de la otra. Ícono agregado después, mismo criterio que la 1 y la 4.
const BAR_HEIGHTS = [2, 3, 2, 4, 3, 5, 4, 6, 6]
const ROWS = 6

export function ReferenceCardExample2() {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <TrendingUpIcon className="size-8 text-neutral-400" />
          <div>
            <p className="text-sm text-neutral-400">Monthly Sales</p>
            <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-white">$36,890</p>
          <p className="text-sm">
            <span className="font-medium text-emerald-400">+32.8%</span>{" "}
            <span className="text-neutral-400">vs last month</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-end gap-1">
        {BAR_HEIGHTS.map((filled, colIdx) => (
          <div key={colIdx} className="flex flex-col-reverse gap-1">
            {Array.from({ length: ROWS }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className={cn(
                  "size-1.5 rounded-[2px]",
                  rowIdx >= filled
                    ? "bg-neutral-700/60"
                    : rowIdx === filled - 1
                      ? "bg-white"
                      : "bg-neutral-400"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
