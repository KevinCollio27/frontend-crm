"use client"

import Link from "next/link"
import { ChevronDownIcon, ClockIcon, LayersIcon, RepeatIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { EmailCampaignSeriesStatsBlock } from "@/types/ai-chat"

// Mismo umbral que el backend para marcar una tanda con rebotes altos.
const HIGH_BOUNCE_RATE = 10

const FOLLOW_UP: { key: keyof EmailCampaignSeriesStatsBlock["data"]["segments"]; phrase: string }[] = [
  { key: "not_opened", phrase: "los que no abrieron" },
  { key: "not_clicked", phrase: "los que abrieron pero no hicieron clic" },
  { key: "opened", phrase: "los que abrieron" },
  { key: "clicked", phrase: "los que hicieron clic" },
]

const fmt = (n: number) => n.toLocaleString("es-CL")

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" })
}

interface EmailCampaignSeriesStatsCardProps {
  block: EmailCampaignSeriesStatsBlock
  disabled?: boolean
  onPrompt: (prompt: string) => void
}

export function EmailCampaignSeriesStatsCard({ block, disabled = false, onPrompt }: EmailCampaignSeriesStatsCardProps) {
  const { data } = block
  const maxOpen = Math.max(1, ...data.batches.map((b) => b.openRate))
  const followUps = FOLLOW_UP.filter((f) => data.segments[f.key] > 0)
  const idsText = data.campaignIds.map((id) => `#${id}`).join(", ")

  const kpis = [
    { label: "Enviados", value: fmt(data.totals.sent), sub: `${data.batches.length} tandas` },
    { label: "Entregados", value: fmt(data.totals.delivered), sub: `${data.totals.deliveryRate}%` },
    { label: "Apertura", value: `${data.totals.openRate}%`, sub: `${fmt(data.totals.opened)} abrieron` },
    { label: "Clics", value: `${data.totals.clickRate}%`, sub: `${fmt(data.totals.clicked)} de los que abrieron` },
    { label: "Rebotes", value: fmt(data.totals.bounced), sub: null },
  ]

  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <LayersIcon className="size-3.5 shrink-0" />
        <span className="truncate">{data.name} · {data.batches.length} tandas</span>
        <span className="ml-auto shrink-0">{formatDate(data.sentAt)}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y border-b sm:grid-cols-5 sm:divide-y-0">
        {kpis.map((k) => (
          <div key={k.label} className="px-3 py-3">
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
            <div className="text-lg font-semibold tabular-nums">{k.value}</div>
            {k.sub && <div className="text-[11px] text-muted-foreground">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto px-4 py-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-1.5 font-normal">Tanda</th>
              <th className="pb-1.5 text-right font-normal">Enviados</th>
              <th className="pb-1.5 text-right font-normal">Entrega</th>
              <th className="pb-1.5 pl-4 font-normal">Apertura</th>
              <th className="pb-1.5 text-right font-normal">Clics</th>
              <th className="pb-1.5 text-right font-normal">Rebotes</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.batches.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="py-1.5">
                  <span className="font-medium">{b.index}</span> <span className="text-muted-foreground">#{b.id}</span>
                </td>
                <td className="py-1.5 text-right">{fmt(b.sent)}</td>
                <td className="py-1.5 text-right">{b.deliveryRate}%</td>
                <td className="py-1.5 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${(b.openRate / maxOpen) * 100}%` }} />
                    </div>
                    <span>{b.openRate}%</span>
                  </div>
                </td>
                <td className="py-1.5 text-right">{fmt(b.clicked)}</td>
                <td className={cn("py-1.5 text-right", b.bounceRate >= HIGH_BOUNCE_RATE && "text-amber-600 dark:text-amber-400")}>
                  {fmt(b.bounced)}
                  {b.bounceRate >= HIGH_BOUNCE_RATE && <TriangleAlertIcon className="ml-1 inline size-3" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.followUps.length > 0 && (
        <div className="border-t px-4 py-2.5 text-xs">
          <span className="text-muted-foreground">Seguimientos: </span>
          {data.followUps.map((f, i) => (
            <span key={f.id}>
              {i > 0 && " · "}#{f.id} ({formatDate(f.sentAt)}) · {fmt(f.sent)} · apertura {f.openRate}%
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-1.5 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <ClockIcon className="mt-0.5 size-3 shrink-0" />
        <span>{data.freshnessNote}</span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/marketing/campaigns" />}>
          Ver en Campañas
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" disabled={disabled} />}>
            Ver tanda
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {data.batches.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => onPrompt(`Muéstrame las métricas de la campaña #${b.id}`)}>
                  Tanda {b.index} (#{b.id})
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {followUps.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" disabled={disabled} />}>
              <RepeatIcon data-icon="inline-start" />
              Seguimiento a la serie
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {followUps.map((f) => (
                  <DropdownMenuItem
                    key={f.key}
                    onClick={() => onPrompt(`Quiero hacer un seguimiento de toda la serie "${data.name}" (campañas ${idsText}) a ${f.phrase}`)}
                  >
                    A {f.phrase} ({fmt(data.segments[f.key])})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
