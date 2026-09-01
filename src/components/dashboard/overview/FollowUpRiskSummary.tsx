"use client"

import * as React from "react"
import { ShieldAlertIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { followUpService } from "@/services/follow-up.service"
import type { FollowUpStats } from "@/types/follow-up"

// Réplica del anillo de FunnelTotalsCard ("Totales del Embudo") — mismo esqueleto (anillo +
// centro + desglose con badge/cantidad/%), pero las categorías pasan a ser Al día/En
// riesgo/Crítico (mismos umbrales y colores de alerta que ya usa FollowUpTableCard) en vez
// de Abiertas/Ganadas/Perdidas. Comparte "Días sin Contacto" en la misma fila — el detalle
// por oportunidad vive en la tabla, el resumen visual acá.
const TICK_COUNT = 48
const R_INNER = 39
const R_OUTER = 47

const ROW_BADGE_CLASS = [
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
  "border-red-200 bg-red-50 text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300",
]
const ROW_PERCENT_CLASS = [
  "text-emerald-600 dark:text-emerald-400",
  "text-amber-600 dark:text-amber-400",
  "text-red-600 dark:text-red-400",
]

export function FollowUpRiskSummary() {
  const [stats, setStats] = React.useState<FollowUpStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    followUpService.getStats()
      .then((res) => { if (!cancelled) setStats(res) })
      .catch(() => { if (!cancelled) setStats(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const breakdown = stats?.riskBreakdown ?? { onTrack: 0, atRisk: 0, critical: 0 }
  const total = breakdown.onTrack + breakdown.atRisk + breakdown.critical

  const rows = [
    { label: "Al día", value: breakdown.onTrack },
    { label: "En riesgo", value: breakdown.atRisk },
    { label: "Crítico", value: breakdown.critical },
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <ShieldAlertIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Resumen de Riesgo</p>
            <p className="text-base font-semibold">Oportunidades Abiertas</p>
          </div>
        </div>

        {loading ? (
          <div className="mx-auto size-48 animate-pulse rounded-full bg-muted" />
        ) : (
          <div className="relative mx-auto flex size-48 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
              {Array.from({ length: TICK_COUNT }).map((_, i) => {
                const angle = (i / TICK_COUNT) * 2 * Math.PI
                const x1 = 50 + R_INNER * Math.sin(angle)
                const y1 = 50 - R_INNER * Math.cos(angle)
                const x2 = 50 + R_OUTER * Math.sin(angle)
                const y2 = 50 - R_OUTER * Math.cos(angle)
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-foreground" strokeWidth={2} strokeLinecap="round" />
                )
              })}
            </svg>
            <div className="relative flex size-24 flex-col items-center justify-center gap-1 rounded-full bg-muted">
              <div className="flex size-7 items-center justify-center rounded-full bg-background">
                <ShieldAlertIcon className="size-3.5 text-foreground" />
              </div>
              <p className="text-[10px] tracking-wide text-muted-foreground">TOTAL ABIERTAS</p>
              <p className="text-lg font-bold">{total}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={row.label} className="flex items-center gap-2.5">
              <div className="flex-1">
                <Badge variant="outline" className={ROW_BADGE_CLASS[i]}>{row.label}</Badge>
              </div>
              <span className="text-sm font-medium">{loading ? "…" : row.value}</span>
              <span className={cn("w-12 shrink-0 text-right text-sm", ROW_PERCENT_CLASS[i])}>
                {loading || total === 0 ? "—" : `${Math.round((row.value / total) * 100)}%`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
