"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { niceStep } from "@/lib/chart-utils"
import type { Flow } from "@/types/flow"

// Chart genérico "X por Mes" (barras, monto + cantidad como etiqueta) — extraído de
// NewOpportunitiesChart al construir el mismo gráfico para Cotizaciones. Mismo truco visual
// que ReferenceCardExample17 (barra pico resaltada) con el selector de embudo real.
//
// Modo "cantidad": algunos embudos tienen registros reales pero sin monto asignado (ej.
// Prohabla — postulaciones a feria, sin plata de por medio; o un mes con cotizaciones
// solo en moneda secundaria, filtradas por mainCurrencyFilter en el backend). Si el año
// completo no tiene NINGÚN monto, el eje/barras/mini-stats pasan a graficar cantidad en
// vez de quedarse "vacíos" con data real adentro.
const CHART_H = 260
const PAD_LEFT = 44
const PAD_RIGHT = 8
const PAD_TOP = 28
const PAD_BOTTOM = 26
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM
const BAR_GAP = 14

function fmtCurrency(value: number) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, notation: value >= 1_000_000 ? "compact" : "standard" })
}

function fmtCount(value: number) {
  return value.toLocaleString("es-CL")
}

export interface MonthlyBarDatum {
  month: string
  count: number
  monto: number
}

interface Props {
  icon: React.ComponentType<{ className?: string }>
  kicker: string
  title: string
  itemNamePlural: string
  flows: Flow[]
  flowId: number | null
  onFlowIdChange: (id: number) => void
  data: MonthlyBarDatum[]
  loading: boolean
}

export function MonthlyBarChart({ icon: Icon, kicker, title, itemNamePlural, flows, flowId, onFlowIdChange, data, loading }: Props) {
  const patternId = React.useId().replace(/:/g, "")

  const totalMonto = data.reduce((sum, d) => sum + d.monto, 0)
  const totalCount = data.reduce((sum, d) => sum + d.count, 0)
  const mode: "monto" | "count" | "empty" = totalMonto > 0 ? "monto" : totalCount > 0 ? "count" : "empty"

  const valueOf = (d: MonthlyBarDatum) => (mode === "count" ? d.count : d.monto)
  const fmtValue = mode === "count" ? fmtCount : fmtCurrency

  const maxValue = Math.max(1, ...data.map(valueOf))
  const step = niceStep(maxValue)
  const yMax = Math.ceil(maxValue / step) * step
  const yTicks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step)
  const peakMonth = data.reduce((max, d) => (valueOf(d) > valueOf(max) ? d : max), data[0])
  const total = mode === "count" ? totalCount : totalMonto
  const avg = data.length > 0 ? Math.round(total / data.length) : 0

  const chartW = 900
  const innerW = chartW - PAD_LEFT - PAD_RIGHT
  const bandWidth = data.length > 0 ? innerW / data.length : innerW
  const barWidth = Math.max(12, bandWidth - BAR_GAP)

  function scaleY(v: number) {
    return PAD_TOP + INNER_H - (yMax > 0 ? (v / yMax) * INNER_H : 0)
  }

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Icon className="size-8 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{kicker}</p>
              <p className="text-base font-semibold">{title}</p>
            </div>
          </div>
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

        {mode === "count" && (
          <p className="text-xs text-muted-foreground">Este embudo no tiene monto asignado — mostrando cantidad de {itemNamePlural}.</p>
        )}

        {loading ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
            <div className="min-h-65 flex-1 w-full animate-pulse rounded-lg bg-muted" />
          </>
        ) : mode === "empty" ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Sin {itemNamePlural} nuevas este año.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="text-xs text-muted-foreground">Mes Pico</p>
                <p className="text-sm font-semibold">{peakMonth.month} · {fmtValue(valueOf(peakMonth))}</p>
              </div>
              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="text-xs text-muted-foreground">Promedio Mensual</p>
                <p className="text-sm font-semibold">{fmtValue(avg)}</p>
              </div>
              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="text-xs text-muted-foreground">Total del Año</p>
                <p className="text-sm font-semibold">{fmtValue(total)}</p>
              </div>
            </div>

            <div className="min-h-65 flex-1">
              <svg viewBox={`0 0 ${chartW} ${CHART_H}`} preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <pattern id={patternId} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                    <rect width="6" height="6" className="fill-muted" />
                    <line x1="0" y1="0" x2="0" y2="6" className="stroke-muted-foreground/50" strokeWidth={2} />
                  </pattern>
                </defs>

                {yTicks.map((tick) => {
                  const y = scaleY(tick)
                  return (
                    <g key={tick}>
                      <line x1={PAD_LEFT} y1={y} x2={chartW - PAD_RIGHT} y2={y} className="stroke-muted-foreground/20" strokeWidth={1} strokeDasharray="4 4" />
                      <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                        {tick === 0 ? "0" : fmtValue(tick)}
                      </text>
                    </g>
                  )
                })}

                {data.map((d, i) => {
                  const x = PAD_LEFT + i * bandWidth + (bandWidth - barWidth) / 2
                  const v = valueOf(d)
                  const y = scaleY(v)
                  const isPeak = peakMonth && d.month === peakMonth.month && v > 0
                  return (
                    <g key={d.month}>
                      {mode === "monto" && d.count > 0 && (
                        <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
                          {d.count}
                        </text>
                      )}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(0, CHART_H - PAD_BOTTOM - y)}
                        rx={4}
                        fill={isPeak ? undefined : `url(#${patternId})`}
                        className={isPeak ? "fill-foreground" : undefined}
                      />
                      <text x={x + barWidth / 2} y={CHART_H - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                        {d.month}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
