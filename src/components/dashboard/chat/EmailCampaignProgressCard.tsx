"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2Icon, Loader2Icon, SendIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { campaignService } from "@/services/campaign.service"
import { whatsappCampaignService } from "@/services/whatsappCampaign.service"
import type { EmailCampaignProgressBlock } from "@/types/ai-chat"

const POLL_MS = 2000
// Mismo ritmo que el backend: correo en lotes de 50/s; WhatsApp en lotes de 20 cada 1,5 s.
const SEND_RATE_PER_SEC = { email: 50, whatsapp: 13 }

type CampaignStatus = "processing" | "sent" | "partial" | "failed"

interface EmailCampaignProgressCardProps {
  block: EmailCampaignProgressBlock
  busy?: boolean
  disabled?: boolean
  onSendNextBatch: () => void
}

// Consulta el avance de la campaña hasta que termina (igual que el aviso de la pantalla
// de Campañas). Al recargar la conversación consulta una vez y muestra el estado final.
export function EmailCampaignProgressCard({ block, busy = false, disabled = false, onSendNextBatch }: EmailCampaignProgressCardProps) {
  const { data } = block
  const channel = data.channel ?? "email"
  const [sent, setSent] = React.useState(0)
  const [status, setStatus] = React.useState<CampaignStatus>("processing")

  React.useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      try {
        const c = channel === "whatsapp"
          ? await whatsappCampaignService.getById(data.campaignId)
          : await campaignService.getById(data.campaignId)
        if (!active) return
        setSent(c.sent_count)
        setStatus(c.status as CampaignStatus)
        if (c.status === "processing") timer = setTimeout(poll, POLL_MS)
      } catch {
        if (active) timer = setTimeout(poll, POLL_MS * 2)
      }
    }

    poll()
    return () => { active = false; clearTimeout(timer) }
  }, [data.campaignId, channel])

  const done = status !== "processing"
  const pct = data.total > 0 ? Math.min(100, Math.round((sent / data.total) * 100)) : 0
  const secondsLeft = Math.ceil((data.total - sent) / SEND_RATE_PER_SEC[channel])
  const title = data.batch
    ? `tanda ${data.batch.index} de ${data.batch.total}`
    : channel === "whatsapp" ? "campaña de WhatsApp" : "campaña"
  const hasNext = !!data.batch && data.batch.index < data.batch.total

  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 text-sm">
        {!done && <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        {status === "sent" && <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
        {(status === "partial" || status === "failed") && <TriangleAlertIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />}
        <span className="font-medium">
          {!done && `Enviando ${title}…`}
          {status === "sent" && `${capitalize(title)} enviada`}
          {status === "partial" && `${capitalize(title)} enviada con errores`}
          {status === "failed" && `No se pudo enviar la ${title}`}
        </span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">#{data.campaignId}</span>
      </div>

      <div className="px-4 pb-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              status === "sent" ? "bg-emerald-500" : status === "processing" ? "bg-primary" : "bg-amber-500"
            )}
            style={{ width: `${done ? 100 : pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            {sent.toLocaleString("es-CL")} / {data.total.toLocaleString("es-CL")}
            {status === "partial" && ` · ${(data.total - sent).toLocaleString("es-CL")} fallidos`}
          </span>
          {!done && secondsLeft > 0 && <span>~{secondsLeft < 60 ? `${secondsLeft} s` : `${Math.ceil(secondsLeft / 60)} min`} restante</span>}
        </div>
      </div>

      {done && (
        <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/marketing/campaigns" />}>
            Ver en Campañas
          </Button>
          {hasNext && (
            <Button type="button" size="sm" onClick={onSendNextBatch} disabled={disabled}>
              {busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
              Enviar tanda {data.batch!.index + 1}
              {data.batch!.nextSize ? ` (${data.batch!.nextSize.toLocaleString("es-CL")})` : ""}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
