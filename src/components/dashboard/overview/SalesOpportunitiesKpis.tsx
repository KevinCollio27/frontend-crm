"use client"

import { CircleDollarSignIcon, ReceiptIcon, TargetIcon, WalletIcon } from "lucide-react"
import type { SalesKpi } from "@/types/sales"
import { StatTile, Tile, TileSkeleton } from "./SalesStatTile"

// 4 KPIs de la sub-tab "Ventas > Oportunidades". Recibe los datos ya resueltos —
// SalesOpportunitiesSection es quien posee el embudo elegido y hace el fetch compartido
// con NewOpportunitiesChart (mismo patrón que FunnelOverviewSection en General).
interface Props {
  pipeline: SalesKpi | null
  totalSales: SalesKpi | null
  avgDealValue: SalesKpi | null
  conversionRate: SalesKpi | null
  loading: boolean
}

export function SalesOpportunitiesKpis({ pipeline, totalSales, avgDealValue, conversionRate, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={i} />)}
      </div>
    )
  }

  const tiles: Tile[] = [
    {
      icon: WalletIcon, title: "Pipeline Abierto", subtitle: pipeline?.description ?? "Oportunidades vigentes",
      value: pipeline?.value ?? "$0", trend: pipeline?.trend, trendFooter: "vs. mes anterior",
      tooltip: "Valor de las oportunidades abiertas ahora mismo — no depende del período seleccionado."
    },
    {
      icon: CircleDollarSignIcon, title: "Ventas Ganadas", subtitle: "Oportunidades ganadas",
      value: totalSales?.value ?? "$0", trend: totalSales?.trend, trendFooter: "vs. periodo anterior",
      tooltip: "Monto de las oportunidades cerradas como venta en el período seleccionado."
    },
    {
      icon: ReceiptIcon, title: "Ticket Promedio", subtitle: avgDealValue?.description ?? "",
      value: avgDealValue?.value ?? "$0", trend: avgDealValue?.trend, trendFooter: "vs. periodo anterior",
      tooltip: "Monto promedio por oportunidad ganada (ventas ÷ cantidad)."
    },
    {
      icon: TargetIcon, title: "Tasa de Conversión", subtitle: "Ganadas vs. perdidas",
      value: conversionRate?.value ?? "0,0%", trend: conversionRate?.trend, trendFooter: "vs. periodo anterior",
      tooltip: conversionRate?.description ? `${conversionRate.description} en el período.` : undefined
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => <StatTile key={tile.title} tile={tile} />)}
    </div>
  )
}
