import { BoxIcon } from "lucide-react"

// Réplica de la tercera card de referencia ("Total Orders") — a diferencia de las otras,
// esta no trae sparkline ni dot-matrix. El ícono en caja arriba a la derecha se sacó:
// ahora usa el mismo tratamiento inline (ícono + título/subtítulo, tamaño 8, centrado)
// que las referencias 1, 2 y 4, para que las 4 queden alineadas entre sí.
export function ReferenceCardExample3() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex items-center gap-2.5">
        <BoxIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Total Orders</p>
          <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold text-white">1920</p>
        <p className="text-sm">
          <span className="font-medium text-emerald-400">+32.8%</span>{" "}
          <span className="text-neutral-400">vs last month</span>
        </p>
      </div>
    </div>
  )
}
