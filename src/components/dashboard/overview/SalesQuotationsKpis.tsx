"use client"

import { CircleDollarSignIcon, ClockIcon, FileCheckIcon, ReceiptIcon } from "lucide-react"
import type { SalesKpi } from "@/types/sales"
import { StatTile, Tile, TileSkeleton } from "./SalesStatTile"

// 4 KPIs de la sub-tab "Ventas > Cotizaciones". A diferencia de Oportunidades, acá no hay un
// 4to KPI de "calidad" (no existe hoy dato de cotizaciones rechazadas/expiradas en la base —
// solo draft/sent/accepted — así que una "tasa de aceptación" no tendría con qué compararse
// todavía). En su lugar: Cotizaciones Pendientes (monto enviado sin resolver, análogo a
// Pipeline Abierto) y Cotizaciones Aceptadas (cantidad, análogo a "negocios ganados").
// Recibe los datos ya resueltos — SalesQuotationsSection posee el embudo elegido y hace el
// fetch compartido con QuotationsEvolutionChart (mismo patrón que SalesOpportunitiesSection).
interface Props {
  pendingValue: SalesKpi | null
  totalSales: SalesKpi | null
  avgDealValue: SalesKpi | null
  deals: SalesKpi | null
  loading: boolean
}

export function SalesQuotationsKpis({ pendingValue, totalSales, avgDealValue, deals, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={i} />)}
      </div>
    )
  }

  const tiles: Tile[] = [
    { icon: ClockIcon, title: "Cotizaciones Pendientes", subtitle: pendingValue?.description ?? "", value: pendingValue?.value ?? "$0", trend: pendingValue?.trend, trendFooter: "vs. periodo anterior" },
    { icon: CircleDollarSignIcon, title: "Ventas Aceptadas", subtitle: totalSales?.description ?? "", value: totalSales?.value ?? "$0", trend: totalSales?.trend, trendFooter: "vs. periodo anterior" },
    { icon: ReceiptIcon, title: "Ticket Promedio", subtitle: avgDealValue?.description ?? "", value: avgDealValue?.value ?? "$0", trend: avgDealValue?.trend, trendFooter: "vs. periodo anterior" },
    { icon: FileCheckIcon, title: "Cotizaciones Aceptadas", subtitle: deals?.description ?? "", value: deals?.value ?? "0", trend: deals?.trend, trendFooter: "vs. periodo anterior" },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => <StatTile key={tile.title} tile={tile} />)}
    </div>
  )
}
