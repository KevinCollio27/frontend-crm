"use client"

import * as React from "react"
import { BriefcaseIcon } from "lucide-react"
import { dashboardService } from "@/services/dashboard.service"
import type { DashboardStatsRaw } from "@/types/dashboard"
import { Sparkline } from "./Sparkline"

// Componente dedicado para Oportunidades Abiertas — mismo layout/espaciado/tamaños que
// ReferenceCardExample (Ref 1). El modo oscuro queda pixel-idéntico al de la referencia
// original (#131313 exacto, no el token compartido de Card, que es un poco más claro) —
// decisión explícita del usuario; el modo claro sí usa los tokens reales de la app.
export function OpenOpportunitiesCard() {
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

  const kpi = stats?.kpis.openOpportunities
  const sparklineData = stats?.newOpportunitiesWeekly?.map((w) => ({ label: w.week, value: w.count }))
  const sign = kpi ? (kpi.trend.state === "up" ? "+" : kpi.trend.state === "down" ? "-" : "") : ""

  return (
    <div className="flex items-center justify-between gap-6 rounded-xl bg-white px-6 py-5 ring-1 ring-foreground/10 dark:bg-[#131313] dark:ring-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <BriefcaseIcon className="size-8 text-muted-foreground dark:text-neutral-400" />
          <div>
            <p className="text-sm text-muted-foreground dark:text-neutral-400">Oportunidades Abiertas</p>
            <p className="text-base font-semibold text-foreground dark:text-white">{loading ? "…" : (kpi?.description ?? "Pipeline vigente")}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-foreground dark:text-white">{loading ? "…" : (kpi?.value ?? "0")}</p>
          <p className="text-sm">
            {!loading && kpi && (
              <span className={sign === "-" ? "font-medium text-red-600 dark:text-red-400" : "font-medium text-emerald-600 dark:text-emerald-400"}>
                {sign}{kpi.trend.value}
              </span>
            )}{" "}
            <span className="text-muted-foreground dark:text-neutral-400">vs. mes anterior</span>
          </p>
        </div>
      </div>
      {!loading && sparklineData && sparklineData.length >= 2 && (
        <Sparkline
          data={sparklineData}
          trendState={kpi!.trend.state}
          goodDirection="up"
          className="h-16 w-28 shrink-0"
        />
      )}
    </div>
  )
}
