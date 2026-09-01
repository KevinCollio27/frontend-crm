import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon, ShoppingBagIcon, StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Réplica de la treceava card de referencia ("Top Selling Products", tabla con
// checkbox + paginación) — header con el mismo tratamiento del resto de referencias.
// Datos hardcodeados, sin conectar; checkbox/paginación son puramente visuales (sin
// estado real), tal cual la imagen.
type Demand = "high" | "low"

interface ProductRow {
  name: string
  subtitle: string
  rating: number
  price: string
  demand: Demand
}

const PRODUCTS: ProductRow[] = [
  { name: "AeroBeat X9 Earbuds", subtitle: "High resolution drone",   rating: 4, price: "$1,499.00", demand: "high" },
  { name: "DataDrive Secure X",  subtitle: "External SSD 2TB",        rating: 4, price: "$199.00",    demand: "low"  },
  { name: "FlexBook Infinity",   subtitle: "Convertible laptop",      rating: 4, price: "$1,499.00",  demand: "high" },
  { name: "PulseFit Tracker 2",  subtitle: "Advanced fitness watch",  rating: 3, price: "$1,499.00",  demand: "low"  },
]

const DEMAND_LABEL: Record<Demand, string> = { high: "High Demand", low: "Low Demand" }
const DEMAND_CLASS: Record<Demand, string> = {
  high: "bg-emerald-500/15 text-emerald-400",
  low:  "bg-red-500/15 text-red-400",
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn("size-3.5", i < rating ? "fill-orange-400 text-orange-400" : "fill-neutral-700 text-neutral-700")}
        />
      ))}
    </div>
  )
}

export function ReferenceCardExample13() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
        <ShoppingBagIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Top Selling Products</p>
          <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
        </div>
      </div>

      <table className="w-full border-t border-neutral-800 text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500">
            <th className="w-10 px-6 py-3 text-left">
              <span className="block size-4 rounded border border-neutral-600" />
            </th>
            <th className="px-3 py-3 text-left">Item</th>
            <th className="px-3 py-3 text-left">Rating</th>
            <th className="px-3 py-3 text-left">Price</th>
            <th className="px-3 py-3 text-left">Status</th>
            <th className="w-14 px-6 py-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {PRODUCTS.map((p) => (
            <tr key={p.name}>
              <td className="px-6 py-3.5">
                <span className="block size-4 rounded border border-neutral-600" />
              </td>
              <td className="px-3 py-3.5">
                <p className="font-medium text-white">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.subtitle}</p>
              </td>
              <td className="px-3 py-3.5"><Stars rating={p.rating} /></td>
              <td className="px-3 py-3.5 text-neutral-300">{p.price}</td>
              <td className="px-3 py-3.5">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", DEMAND_CLASS[p.demand])}>
                  {DEMAND_LABEL[p.demand]}
                </span>
              </td>
              <td className="px-6 py-3.5">
                <MoreHorizontalIcon className="size-4 text-neutral-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-xs text-neutral-500">
        <span className="flex items-center gap-2">
          Show
          <span className="flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-1 text-neutral-300">
            5 <ChevronDownIcon className="size-3" />
          </span>
          per page
        </span>
        <div className="flex items-center gap-3">
          <span>1-4 of 4</span>
          <div className="flex items-center gap-1.5">
            <ChevronLeftIcon className="size-4 text-neutral-600" />
            <ChevronRightIcon className="size-4 text-neutral-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
