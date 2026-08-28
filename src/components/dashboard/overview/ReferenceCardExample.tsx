import { DollarSignIcon } from "lucide-react"

// Réplica de la card de referencia (shadcn-studio "dashboard-shell-01") — solo para
// comparar visualmente contra StatsRow antes de decidir qué adaptar. Colores y textos
// hardcodeados a propósito (no usa datos reales ni sigue el tema claro/oscuro de la app):
// la idea es validar que el look es igual al de la imagen, no integrarla todavía. Ícono
// agregado después (no estaba en la imagen original) — mismo criterio que referencia 4:
// tamaño grande, centrado contra el bloque de las 2 líneas de texto.
export function ReferenceCardExample() {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <DollarSignIcon className="size-8 text-neutral-400" />
          <div>
            <p className="text-sm text-neutral-400">Total Sales</p>
            <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-white">$98,452.76</p>
          <p className="text-sm">
            <span className="font-medium text-emerald-400">+32.8%</span>{" "}
            <span className="text-neutral-400">vs last month</span>
          </p>
        </div>
      </div>
      <svg viewBox="0 0 200 60" className="h-16 w-48 shrink-0" preserveAspectRatio="none">
        <path
          d="M 0 40 C 20 40, 30 15, 50 15 S 80 45, 100 30 S 130 10, 150 25 S 180 35, 200 10"
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
