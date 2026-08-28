"use client"

import * as React from "react"
import { BriefcaseIcon } from "lucide-react"
import { dashboardService } from "@/services/dashboard.service"
import type { DashboardStatsRaw } from "@/types/dashboard"
import { Sparkline } from "./Sparkline"

// Componente dedicado para Oportunidades Abiertas — mismo layout/espaciado/tamaños que
// ReferenceCardExample (Ref 1) exactamente, solo con contenido real en vez de placeholders.
// Fondo oscuro fijo por ahora (como la referencia) para poder validar el look 1 a 1 antes
// de decidir cómo se adapta a modo claro — eso queda pendiente, no es parte de este paso.
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
    <div className="flex items-center justify-between gap-6 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <BriefcaseIcon className="size-8 text-neutral-400" />
          <div>
            <p className="text-sm text-neutral-400">Oportunidades Abiertas</p>
            <p className="text-base font-semibold text-white">{loading ? "…" : (kpi?.description ?? "Pipeline vigente")}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-white">{loading ? "…" : (kpi?.value ?? "0")}</p>
          <p className="text-sm">
            {!loading && kpi && (
              <span className={sign === "-" ? "font-medium text-red-400" : "font-medium text-emerald-400"}>
                {sign}{kpi.trend.value}
              </span>
            )}{" "}
            <span className="text-neutral-400">vs. mes anterior</span>
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
