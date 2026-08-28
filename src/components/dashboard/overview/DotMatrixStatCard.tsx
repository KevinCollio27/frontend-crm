"use client"

import * as React from "react"
import { dashboardService } from "@/services/dashboard.service"
import { cn } from "@/lib/utils"
import type { DashboardStatsRaw } from "@/types/dashboard"

const ROWS = 6

interface Props {
  title: string
  kpiKey: "wonOpportunities" | "lostOpportunities"
  icon: React.ComponentType<{ className?: string }>
  goodDirection: "up" | "down"
  // Patrón decorativo — no hay una serie semanal real de ganadas/perdidas en el backend
  // todavía (solo existe para "nuevas oportunidades", que ya usa OpenOpportunitiesCard).
  // El valor y el trend de arriba SÍ son reales; estas barras son solo forma.
  barHeights: number[]
}

// Mismo layout que OpenOpportunitiesCard (Ref 1) pero con el gráfico de dot-matrix de
// Ref 2 en vez del sparkline — reutilizable para Ganadas y Perdidas, que comparten
// estructura y solo cambian ícono/color/dirección.
export function DotMatrixStatCard({ title, kpiKey, icon: Icon, goodDirection, barHeights }: Props) {
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
  const isGoodNews = kpi?.trend.state === goodDirection
  const sign = kpi ? (kpi.trend.state === "up" ? "+" : kpi.trend.state === "down" ? "-" : "") : ""
  const trendColorClass = !kpi || kpi.trend.state === "flat" ? "text-neutral-400" : isGoodNews ? "text-emerald-400" : "text-red-400"

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#131313] px-6 py-5">
      <div className="flex flex-col gap-4">
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
              <span className={cn("font-medium", trendColorClass)}>{sign}{kpi.trend.value}</span>
            )}{" "}
            <span className="text-neutral-400">vs. mes anterior</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-end gap-1">
        {barHeights.map((filled, colIdx) => (
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
