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
// Ref 3. Reutilizable para Contactos, Organizaciones, Cotizaciones y Actividades. Mismo
// criterio de tema: dark mode pixel-idéntico al #131313 original, light mode con los
// tokens reales de la app.
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
  const trendColorClass = isFlat
    ? "text-muted-foreground dark:text-neutral-400"
    : isGoodNews
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400"

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white px-6 py-5 ring-1 ring-foreground/10 dark:bg-[#131313] dark:ring-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-8 shrink-0 text-muted-foreground dark:text-neutral-400" />
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground dark:text-neutral-400">{title}</p>
          <p className="truncate text-base font-semibold text-foreground dark:text-white">{loading ? "…" : (kpi?.description ?? "")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold text-foreground dark:text-white">{loading ? "…" : (kpi?.value ?? "0")}</p>
        <p className="text-sm">
          {!loading && kpi && (
            <span className={cn("font-medium", trendColorClass)}>
              {sign}{kpi.trend.value}{trendLabel ? ` ${trendLabel}` : ""}
            </span>
          )}
          {!trendLabel && <span className="text-muted-foreground dark:text-neutral-400"> vs. mes anterior</span>}
        </p>
      </div>
    </div>
  )
}
