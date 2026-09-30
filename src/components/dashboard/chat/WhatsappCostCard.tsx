"use client"

import Link from "next/link"
import { InfoIcon, WalletIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WhatsappCostBlock } from "@/types/ai-chat"

function formatMoney(value: number, currency: string, maximumFractionDigits = 2) {
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency, maximumFractionDigits }).format(value)
  } catch {
    return `$${value.toFixed(maximumFractionDigits)}`
  }
}

export function WhatsappCostCard({ block }: { block: WhatsappCostBlock }) {
  const { data } = block
  const approx = data.estimated ? "≈ " : ""

  const kpis = [
    { label: data.estimated ? "Costo estimado" : "Gasto total", value: `${approx}${formatMoney(data.total, data.currency)}` },
    { label: "Mensajes cobrados", value: data.messages.toLocaleString("es-CL") },
    {
      label: "Por mensaje",
      value: data.perMessage !== undefined ? `${approx}${formatMoney(data.perMessage, data.currency)}` : "—",
    },
  ]

  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <WalletIcon className="size-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">Costos WhatsApp · {data.title}</span>
        {data.subtitle && <span className="ml-auto shrink-0">{data.subtitle}</span>}
      </div>

      <div className="grid grid-cols-3 divide-x border-b">
        {kpis.map((k) => (
          <div key={k.label} className="px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
            <div className="text-lg font-semibold tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      {data.rows.length > 0 && (
        <div className="space-y-1 px-4 py-3 text-xs">
          {data.rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="flex-1 text-muted-foreground">{r.label}</span>
              <span className="w-20 text-right tabular-nums">{r.count.toLocaleString("es-CL")}</span>
              <span className="w-24 text-right font-medium tabular-nums">{formatMoney(r.cost, data.currency)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-1.5 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3 shrink-0" />
        <span>{data.note}</span>
      </div>

      <div className="flex items-center justify-end border-t bg-muted/30 px-3 py-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/settings/costs" />}>
          Ver en Costos
        </Button>
      </div>
    </div>
  )
}
