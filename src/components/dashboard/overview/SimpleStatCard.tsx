"use client"

import * as React from "react"
import { dashboardService } from "@/services/dashboard.service"
import { cn } from "@/lib/utils"
import type { DashboardStatsRaw } from "@/types/dashboard"

interface Props {
  title: string
  kpiKey: keyof DashboardStatsRaw["kpis"]
  icon: React.ComponentType<{ className?: string }>
  goodDirection: "up" | "down"
  // Cuando se pasa (Contactos/Organizaciones/Cotizaciones), el trend se lee como
  // "5 Nuevos" en vez de "+5 vs. mes anterior" — son conteos que solo suben, comparar
  // contra el mes anterior no aporta como en Ganadas/Perdidas/Actividades.
  trendLabel?: string
}

// Mismo layout que OpenOpportunitiesCard/DotMatrixStatCard (Ref 1/2) pero sin gráfico —
// Ref 3. Reutilizable para Contactos, Organizaciones, Cotizaciones y Actividades.
export function SimpleStatCard({ title, kpiKey, icon: Icon, goodDirection, trendLabel }: Props) {
  const [stats, setStats] = React.useState<DashboardStatsRaw | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    dashboardService.getStats()
      .then((res) => { if (!cancelled) setStats(res) })
      .catch(() => { if (!cancelled) setStats(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const kpi = stats?.kpis[kpiKey]
  const isFlat = !kpi || kpi.trend.state === "flat"
  const isGoodNews = kpi?.trend.state === goodDirection
  const sign = trendLabel ? "" : kpi ? (kpi.trend.state === "up" ? "+" : kpi.trend.state === "down" ? "-" : "") : ""
  const trendColorClass = isFlat ? "text-neutral-400" : isGoodNews ? "text-emerald-400" : "text-red-400"

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex items-center gap-2.5">
        <Icon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">{title}</p>
          <p className="text-base font-semibold text-white">{loading ? "…" : (kpi?.description ?? "")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold text-white">{loading ? "…" : (kpi?.value ?? "0")}</p>
        <p className="text-sm">
          {!loading && kpi && (
            <span className={cn("font-medium", trendColorClass)}>
              {sign}{kpi.trend.value}{trendLabel ? ` ${trendLabel}` : ""}
            </span>
          )}
          {!trendLabel && <span className="text-neutral-400"> vs. mes anterior</span>}
        </p>
      </div>
    </div>
  )
}
