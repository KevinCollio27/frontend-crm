"use client"

import Link from "next/link"
import { ChartColumnIcon, ChevronDownIcon, ClockIcon, LayersIcon, RepeatIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { CampaignSegmentKey, EmailCampaignStatsBlock } from "@/types/ai-chat"

const SEGMENT_LABEL: Record<CampaignSegmentKey, string> = {
  opened: "Abrieron",
  clicked: "Hicieron clic",
  not_opened: "No abrieron",
  bounced: "Rebotaron",
}

// Grupos a los que tiene sentido hacer seguimiento (los rebotes nunca).
const FOLLOW_UP: { key: Exclude<CampaignSegmentKey, "bounced">; phrase: string }[] = [
  { key: "not_opened", phrase: "los que no abrieron" },
  { key: "opened", phrase: "los que abrieron" },
  { key: "clicked", phrase: "los que hicieron clic" },
]

function formatSentAt(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

interface EmailCampaignStatsCardProps {
  block: EmailCampaignStatsBlock
  disabled?: boolean
  // Escribe el pedido en el chat: la IA pregunta qué decir en el correo de seguimiento.
  onFollowUp: (prompt: string) => void
}

export function EmailCampaignStatsCard({ block, disabled = false, onFollowUp }: EmailCampaignStatsCardProps) {
  const { data } = block

  const kpis = [
    { label: "Enviados", value: data.sent.toLocaleString("es-CL"), sub: null },
    { label: "Entregados", value: data.delivered.toLocaleString("es-CL"), sub: `${data.deliveryRate}%` },
    { label: "Apertura", value: `${data.openRate}%`, sub: `${data.opened.toLocaleString("es-CL")} abrieron` },
    { label: "Clics", value: `${data.clickRate}%`, sub: `${data.clicked.toLocaleString("es-CL")} de los que abrieron` },
  ]

  const segments = (["opened", "clicked", "not_opened", "bounced"] as CampaignSegmentKey[])
    .filter((key) => key !== "bounced" || data.segments.bounced.count > 0)
  const followUps = FOLLOW_UP.filter((f) => data.segments[f.key].count > 0)

  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <ChartColumnIcon className="size-3.5 shrink-0" />
        <span className="truncate">Campaña #{data.id} · {data.name}</span>
        {data.series && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
            Tanda {data.series.index} de {data.series.total}
          </span>
        )}
        <span className="ml-auto shrink-0">{formatSentAt(data.sentAt)}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y border-b sm:grid-cols-4 sm:divide-y-0">
        {kpis.map((k) => (
          <div key={k.label} className="px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
            <div className="text-lg font-semibold tabular-nums">{k.value}</div>
            {k.sub && <div className="text-[11px] text-muted-foreground">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="space-y-1.5 px-4 py-3 text-xs">
        {segments.map((key) => {
          const s = data.segments[key]
          const more = s.count - s.sample.length
          return (
            <div key={key} className="flex gap-3">
              <span className={cn("w-24 shrink-0 text-muted-foreground", key === "bounced" && "text-red-600 dark:text-red-400")}>
                {SEGMENT_LABEL[key]}
              </span>
              <span className="min-w-0 wrap-break-word">
                {s.count === 0 ? "—" : s.sample.join(", ")}
                {more > 0 && <span className="text-muted-foreground"> y {more.toLocaleString("es-CL")} más</span>}
              </span>
            </div>
          )
        })}
        {data.topLinks.length > 0 && (
          <div className="flex gap-3">
            <span className="w-24 shrink-0 text-muted-foreground">Enlaces</span>
            <span className="min-w-0 space-y-0.5">
              {data.topLinks.slice(0, 3).map((l) => (
                <span key={l.url} className="block truncate">
                  {l.url} <span className="text-muted-foreground">· {l.clicks}</span>
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-1.5 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <ClockIcon className="mt-0.5 size-3 shrink-0" />
        <span>{data.freshnessNote}</span>
      </div>

      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/marketing/campaigns" />}>
          Ver en Campañas
        </Button>
        {data.series && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onFollowUp(`Muéstrame el rendimiento de toda la serie de la campaña #${data.id}`)}
          >
            <LayersIcon data-icon="inline-start" />
            Ver serie ({data.series.total} tandas)
          </Button>
        )}
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
                    onClick={() => onFollowUp(`Quiero hacer un seguimiento de la campaña #${data.id} a ${f.phrase}`)}
                  >
                    A {f.phrase} ({data.segments[f.key].count})
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
