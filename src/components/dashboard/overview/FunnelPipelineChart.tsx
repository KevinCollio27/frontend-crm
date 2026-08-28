"use client"

import { GitBranchIcon } from "lucide-react"
import { STATUS_CONFIG } from "@/components/dashboard/funnels/shared/status"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Flow } from "@/types/flow"
import type { DashboardStatsRaw } from "@/types/dashboard"

// Adaptación real de la Referencia 10 ("Revenue Overview") — mismo esqueleto (header,
// leyenda, selector, barras apiladas con ejes), pero el selector de "Last 30 Days" pasa
// a ser de Embudo, y las 3 series pasan a ser Abiertas/Ganadas/Perdidas por etapa
// (pipelineByStage, que el backend ya filtra por flowId — no hizo falta tocar nada ahí).
// Colores: los mismos de STATUS_CONFIG (fuente única del color de Estado en toda la
// app — FunnelTable, FunnelKanban, Col1Info) para que "azul/verde/rojo" signifique lo
// mismo acá que en el resto del CRM. Recibe flows/flowId/stages como props: el selector
// es compartido con FunnelTotalsCard (mismo embudo para las dos cards), así que el
// fetch vive en FunnelOverviewSection.
const LEGEND = [
  { label: "Abiertas", badgeClass: STATUS_CONFIG.en_progreso.badge },
  { label: "Ganadas",  badgeClass: STATUS_CONFIG.ganada.badge },
  { label: "Perdidas", badgeClass: STATUS_CONFIG.perdida.badge },
]
// El pastel tipo badge se veía lavado en modo oscuro (probado y descartado). El -500
// sólido después se sintió muy claro/neón contra el fondo oscuro — un paso más oscuro
// (-600) para que se vea más "de peso" en dark mode.
const SEGMENT_FILL_CLASS = [
  "fill-blue-600",
  "fill-emerald-600",
  "fill-red-600",
]

const CHART_H = 260
const PAD_LEFT = 30
const PAD_RIGHT = 50
const PAD_TOP = 10
const PAD_BOTTOM = 26
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM
const BAR_GAP = 16

// Paso "lindo" para el eje Y (1/2/5 × una potencia de 10) — el tope fijo anterior
// (nunca más de 20) se rompía con embudos grandes (ej. una feria con 920 postulaciones):
// terminaba generando ~47 marcas de "20 en 20" amontonadas e ilegibles. Este algoritmo
// escala sin límite apuntando a ~5 marcas, sea el máximo 11 o 920.
function niceStep(maxValue: number, targetTicks = 5): number {
  if (maxValue <= 0) return 1
  const roughStep = maxValue / targetTicks
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return niceNormalized * magnitude
}

interface Props {
  flows: Flow[]
  flowId: number | null
  onFlowIdChange: (id: number) => void
  flowName: string
  stages: DashboardStatsRaw["pipelineByStage"]
  loading: boolean
}

export function FunnelPipelineChart({ flows, flowId, onFlowIdChange, flowName, stages, loading }: Props) {
  const maxTotal = Math.max(1, ...stages.map((s) => s.abiertas + s.ganadas + s.perdidas))
  const step = niceStep(maxTotal)
  const yMax = Math.ceil(maxTotal / step) * step
  const yTicks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step)

  // chartW es solo el marco de referencia interno del viewBox — con preserveAspectRatio
  // "none" el SVG siempre se estira al 100% del contenedor real, así que no depende de
  // cuántas etapas haya (2 o 6, siempre reparte el ancho disponible entre ellas).
  const chartW = 800
  const innerW = chartW - PAD_LEFT - PAD_RIGHT
  const bandWidth = stages.length > 0 ? innerW / stages.length : innerW
  const barWidth = Math.max(16, bandWidth - BAR_GAP)

  function scaleY(v: number) {
    return PAD_TOP + INNER_H - (v / yMax) * INNER_H
  }

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GitBranchIcon className="size-8 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Pipeline por Etapa</p>
              <p className="text-base font-semibold">{flowName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {LEGEND.map((l) => (
              <Badge key={l.label} variant="outline" className={l.badgeClass}>{l.label}</Badge>
            ))}
            <Select value={flowId ? String(flowId) : ""} onValueChange={(v) => v && onFlowIdChange(Number(v))}>
              <SelectTrigger size="sm" className="w-44 border-none bg-muted">
                <SelectValue placeholder="Embudo">
                  {(v: string) => flows.find((f) => String(f.id) === v)?.name ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {flows.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="min-h-65 flex-1 w-full animate-pulse rounded-lg bg-muted" />
        ) : stages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Este embudo no tiene etapas.</p>
          </div>
        ) : (
          <div className="min-h-65 flex-1">
            <svg viewBox={`0 0 ${chartW} ${CHART_H}`} preserveAspectRatio="none" className="h-full w-full">
              {yTicks.map((tick) => {
                const y = scaleY(tick)
                return (
                  <g key={tick}>
                    <line x1={PAD_LEFT} y1={y} x2={chartW - PAD_RIGHT} y2={y} className="stroke-muted-foreground/20" strokeWidth={1} strokeDasharray="4 4" />
                    <text x={PAD_LEFT - 6} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{tick}</text>
                  </g>
                )
              })}

              {stages.map((stage, i) => {
                const x = PAD_LEFT + i * bandWidth + (bandWidth - barWidth) / 2
                const values = [stage.abiertas, stage.ganadas, stage.perdidas]
                let acc = 0
                return (
                  <g key={stage.stage}>
                    {values.map((v, si) => {
                      const yTop = scaleY(acc + v)
                      const yBottom = scaleY(acc)
                      acc += v
                      if (v === 0) return null
                      return (
                        <rect
                          key={si}
                          x={x}
                          y={yTop}
                          width={barWidth}
                          height={Math.max(0, yBottom - yTop)}
                          className={SEGMENT_FILL_CLASS[si]}
                          rx={si === values.length - 1 ? 6 : 0}
                        />
                      )
                    })}
                    <text x={x + barWidth / 2} y={CHART_H - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                      {stage.stage}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
