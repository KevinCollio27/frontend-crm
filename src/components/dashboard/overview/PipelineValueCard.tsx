"use client"

import * as React from "react"
import { WalletIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { dashboardService } from "@/services/dashboard.service"
import type { DashboardStatsRaw } from "@/types/dashboard"

// Adaptación de la referencia "Total Assets" — el desglose de la imagen (Product Sales/
// Service Revenue/Other Income) no calza con una sola oportunidad: ni opportunity_net_sales
// ni opportunity_net_cost tienen más de 1 fila por oportunidad (validado con MCP), así que
// no hay líneas internas que desglosar ahí. En cambio, el mismo patrón visual sí funciona
// agregando a nivel workspace: hero = valor total de oportunidades abiertas (mismo fallback
// net_sales→net_cost que usa "Ganadas"), desglose = top 3 oportunidades por valor. La barra
// de "Distribución" refleja el % real de la oportunidad top 1, no es decorativa.
const TICKS = 28

function currency(value: number) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 })
}

function DistributionBar({ percent }: { percent: number }) {
  const filled = Math.round((percent / 100) * TICKS)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: TICKS }).map((_, i) => (
        <span key={i} className={cn("h-4 w-1 rounded-full", i < filled ? "bg-foreground" : "bg-muted")} />
      ))}
    </div>
  )
}

export function PipelineValueCard() {
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

  const pv = stats?.pipelineValue
  const sign = pv ? (pv.trend.state === "up" ? "+" : pv.trend.state === "down" ? "-" : "") : ""
  const trendColorClass = !pv || pv.trend.state === "flat" ? "text-muted-foreground" : pv.trend.state === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
  const topPercent = pv?.topOpportunities[0]?.percent ?? 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <WalletIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Valor en Pipeline</p>
            <p className="text-base font-semibold">Oportunidades Abiertas</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold">{loading ? "…" : (pv?.totalFormatted ?? currency(0))}</p>
          <p className="text-sm">
            {!loading && pv && (
              <span className={cn("font-medium", trendColorClass)}>{sign}{pv.trend.value}</span>
            )}{" "}
            <span className="text-muted-foreground">vs. mes anterior</span>
          </p>
        </div>

        {!loading && pv && pv.topOpportunities.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Distribución</p>
            <DistributionBar percent={topPercent} />
          </div>
        )}

        <div className="flex flex-col divide-y">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : pv && pv.topOpportunities.length > 0 ? (
            pv.topOpportunities.map((op) => (
              <div key={op.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <span className="truncate text-sm" title={op.name}>{op.name}</span>
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {currency(op.value)} <span className="text-muted-foreground">({op.percent}%)</span>
                </span>
              </div>
            ))
          ) : (
            <p className="py-2.5 text-sm text-muted-foreground">Sin oportunidades abiertas con valor asignado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
