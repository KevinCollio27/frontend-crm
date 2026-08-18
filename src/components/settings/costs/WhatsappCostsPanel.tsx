"use client"

import * as React from "react"
import { InfoIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { notify } from "@/lib/notify"
import { whatsappService } from "@/services/whatsapp.service"
import type { WhatsappCostAnalyticsRaw } from "@/types/whatsappCosts"

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: "Marketing",
  UTILITY: "Utility",
  AUTHENTICATION: "Autenticación",
  SERVICE: "Servicio",
  OTHER: "Otro",
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  MARKETING: "Plantilla que tú envías para iniciar contacto (promociones, campañas). La categoría más cara.",
  UTILITY: "Plantilla transaccional (confirmaciones, avisos de pedido). Más barata que Marketing.",
  AUTHENTICATION: "Plantilla de código de verificación (OTP).",
  SERVICE: "El cliente te escribió primero y respondiste dentro de la ventana de 24h con texto libre. Por lo general, gratis.",
  OTHER: "Categoría que Meta no clasificó en ninguna de las anteriores.",
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
}

export function WhatsappCostsPanel() {
  const [from, setFrom] = React.useState(isoDaysAgo(30))
  const [to, setTo] = React.useState(isoDaysAgo(0))
  const [data, setData] = React.useState<WhatsappCostAnalyticsRaw | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await whatsappService.getCostAnalytics({ from, to })
      setData(res)
    } catch {
      notify.error({ title: "Error al cargar costos", description: "No se pudo obtener el gasto de WhatsApp desde Meta." })
    } finally {
      setLoading(false)
    }
  }, [from, to])

  React.useEffect(() => {
    fetchData()
  }, [])

  const currency = data?.currency ?? "USD"

  return (
    <TooltipProvider>
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input type="date" className="h-8 text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input type="date" className="h-8 text-xs" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button size="sm" className="h-8" disabled={loading} onClick={fetchData}>
          <RefreshCwIcon className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
          Aplicar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Conversaciones</p>
            <p className="text-xl font-semibold tabular-nums">
              {loading ? "…" : (data?.totals.conversations ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Costo total</p>
            <p className="text-xl font-semibold tabular-nums">
              {loading ? "…" : formatMoney(data?.totals.cost ?? 0, currency)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Promedio por conversación</p>
            <p className="text-xl font-semibold tabular-nums">
              {loading
                ? "…"
                : formatMoney(
                    data && data.totals.conversations > 0 ? data.totals.cost / data.totals.conversations : 0,
                    currency,
                  )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Conversaciones</TableHead>
              <TableHead>Costo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-sm text-muted-foreground">Cargando…</TableCell>
              </TableRow>
            ) : !data?.byCategory.length ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-sm text-muted-foreground">Sin conversaciones en el período.</TableCell>
              </TableRow>
            ) : (
              data.byCategory.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {CATEGORY_LABELS[row.category] ?? row.category}
                      <Tooltip>
                        <TooltipTrigger render={<InfoIcon className="size-3.5 text-muted-foreground" />} />
                        <TooltipContent side="right">
                          {CATEGORY_DESCRIPTIONS[row.category] ?? "Sin descripción disponible."}
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{row.conversations.toLocaleString()}</TableCell>
                  <TableCell className="text-sm tabular-nums">{formatMoney(row.cost, currency)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Conversaciones</TableHead>
              <TableHead>Costo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-sm text-muted-foreground">Cargando…</TableCell>
              </TableRow>
            ) : !data?.byDay.length ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-sm text-muted-foreground">Sin conversaciones en el período.</TableCell>
              </TableRow>
            ) : (
              data.byDay.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(row.date)}</TableCell>
                  <TableCell className="text-sm tabular-nums">{row.conversations.toLocaleString()}</TableCell>
                  <TableCell className="text-sm tabular-nums">{formatMoney(row.cost, currency)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    </TooltipProvider>
  )
}
