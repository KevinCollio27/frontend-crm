"use client"

import { InfoIcon, LayersIcon } from "lucide-react"
import { STATUS_CONFIG } from "@/components/dashboard/funnels/shared/status"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { DashboardStatsRaw } from "@/types/dashboard"

// Adaptación real de la Referencia 11 ("Sales Distribution") — mismo esqueleto (anillo +
// centro + desglose), pero el centro pasa a ser el total de oportunidades del embudo
// elegido y la lista a ser Abiertas/Ganadas/Perdidas. En vez de un trend inventado, cada
// fila muestra el % que representa del total — no hay histórico por categoría todavía
// para un trend real. Comparte flowId/stages con FunnelPipelineChart (mismo selector).
// Colores: mismos de STATUS_CONFIG (fuente única del color de Estado en toda la app).
const TICK_COUNT = 48
const R_INNER = 39
const R_OUTER = 47

const ROW_BADGE_CLASS = [
  STATUS_CONFIG.en_progreso.badge,
  STATUS_CONFIG.ganada.badge,
  STATUS_CONFIG.perdida.badge,
]
const ROW_PERCENT_CLASS = [
  "text-blue-600 dark:text-blue-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-red-600 dark:text-red-400",
]

interface Props {
  flowName: string
  stages: DashboardStatsRaw["pipelineByStage"]
  loading: boolean
}

export function FunnelTotalsCard({ flowName, stages, loading }: Props) {
  const totalAbiertas = stages.reduce((sum, s) => sum + s.abiertas, 0)
  const totalGanadas  = stages.reduce((sum, s) => sum + s.ganadas, 0)
  const totalPerdidas = stages.reduce((sum, s) => sum + s.perdidas, 0)
  const total = totalAbiertas + totalGanadas + totalPerdidas

  const rows = [
    { label: "Abiertas", value: totalAbiertas },
    { label: "Ganadas",  value: totalGanadas  },
    { label: "Perdidas", value: totalPerdidas },
  ]

  return (
    <TooltipProvider>
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <LayersIcon className="size-8 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Totales del Embudo</p>
              <p className="text-base font-semibold">{flowName}</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger render={<InfoIcon className="size-4 shrink-0 text-muted-foreground" />} />
            <TooltipContent side="left" className="flex-col items-start gap-1 max-w-64 text-left">
              <p><span className="font-semibold">Abiertas</span>: oportunidades en curso, sin cerrar.</p>
              <p><span className="font-semibold">Ganadas</span>: oportunidades cerradas como venta.</p>
              <p><span className="font-semibold">Perdidas</span>: oportunidades cerradas sin venta.</p>
            </TooltipContent>
          </Tooltip>
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
                <LayersIcon className="size-3.5 text-foreground" />
              </div>
              <p className="text-[10px] tracking-wide text-muted-foreground">TOTAL OPORTUNIDADES</p>
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
    </TooltipProvider>
  )
}
