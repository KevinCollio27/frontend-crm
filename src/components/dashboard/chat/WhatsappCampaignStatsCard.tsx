"use client"

import Link from "next/link"
import { ChevronDownIcon, ClockIcon, MessageCircleIcon, RepeatIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { WhatsappCampaignStatsBlock, WhatsappSegmentKey } from "@/types/ai-chat"

const SEGMENT_LABEL: Record<WhatsappSegmentKey, string> = {
  read: "Leyeron",
  not_read: "No leyeron",
  replied: "Respondieron",
  not_replied: "No respondieron",
  failed: "Fallaron",
}

const FOLLOW_UP: { key: WhatsappSegmentKey; phrase: string }[] = [
  { key: "not_read", phrase: "los que no la leyeron" },
  { key: "not_replied", phrase: "los que no respondieron" },
  { key: "read", phrase: "los que la leyeron" },
  { key: "failed", phrase: "los que fallaron" },
]

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

interface WhatsappCampaignStatsCardProps {
  block: WhatsappCampaignStatsBlock
  disabled?: boolean
  // Escribe el pedido en el chat: la IA pregunta qué decir y recomienda una plantilla.
  onFollowUp: (prompt: string) => void
}

export function WhatsappCampaignStatsCard({ block, disabled = false, onFollowUp }: WhatsappCampaignStatsCardProps) {
  const { data } = block
  const fmt = (n: number) => n.toLocaleString("es-CL")

  const kpis = [
    { label: "Enviados", value: fmt(data.sent), sub: `de ${fmt(data.total)}` },
    { label: "Entregados", value: fmt(data.delivered), sub: `${data.deliveryRate}%` },
    { label: "Leídos", value: `${data.readRate}%`, sub: `${fmt(data.read)} leyeron` },
    { label: "Respondieron", value: `${data.replyRate}%`, sub: `${fmt(data.replied)} contestaron` },
  ]

  const segments = (["read", "not_read", "replied", "failed"] as WhatsappSegmentKey[])
    .filter((key) => key !== "failed" || data.segments.failed.count > 0)
  const followUps = FOLLOW_UP.filter((f) => data.segments[f.key].count > 0)

  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <MessageCircleIcon className="size-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">WhatsApp #{data.id} · {data.name}</span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px]">{data.templateName}</span>
        <span className="ml-auto shrink-0">{formatSentAt(data.sentAt)}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y border-b sm:grid-cols-4 sm:divide-y-0">
        {kpis.map((k) => (
          <div key={k.label} className="px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
            <div className="text-lg font-semibold tabular-nums">{k.value}</div>
            <div className="text-[11px] text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      {data.failed > 0 && (
        <div className="flex gap-2 border-b bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          <div className="space-y-0.5">
            <div className="font-medium">{fmt(data.failed)} no se enviaron</div>
            {data.failureReasons.map((f) => (
              <div key={f.reason} className="wrap-break-word">
                {f.reason}{data.failureReasons.length > 1 && ` (${fmt(f.count)})`}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5 px-4 py-3 text-xs">
        {segments.map((key) => {
          const s = data.segments[key]
          const more = s.count - s.sample.length
          return (
            <div key={key} className="flex gap-3">
              <span className={cn("w-24 shrink-0 text-muted-foreground", key === "failed" && "text-red-600 dark:text-red-400")}>
                {SEGMENT_LABEL[key]}
              </span>
              <span className="min-w-0 wrap-break-word">
                {s.count === 0 ? "—" : s.sample.join(", ")}
                {more > 0 && <span className="text-muted-foreground"> y {fmt(more)} más</span>}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-1.5 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <ClockIcon className="mt-0.5 size-3 shrink-0" />
        <span>{data.freshnessNote}</span>
      </div>

      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/marketing/campaigns" />}>
          Ver en Campañas
        </Button>
        {followUps.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" disabled={disabled} />}>
              <RepeatIcon data-icon="inline-start" />
              Hacer seguimiento
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {followUps.map((f) => (
                  <DropdownMenuItem
                    key={f.key}
                    onClick={() => onFollowUp(`Quiero hacer un seguimiento por WhatsApp de la campaña #${data.id} a ${f.phrase}`)}
                  >
                    A {f.phrase} ({fmt(data.segments[f.key].count)})
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
