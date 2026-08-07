"use client"

import * as React from "react"
import { CheckCircle2Icon, Loader2Icon, XOctagonIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { campaignService } from "@/services/campaign.service"

interface CampaignProgressToastProps {
  campaignId: number
  campaignName: string
  total: number
  onDone?: () => void
}

export function CampaignProgressToast({ campaignId, campaignName, total, onDone }: CampaignProgressToastProps) {
  const [sent, setSent] = React.useState(0)
  const [status, setStatus] = React.useState<"processing" | "sent" | "partial" | "failed">("processing")

  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const c = await campaignService.getById(campaignId)
        setSent(c.sent_count)
        if (c.status !== "processing") {
          setStatus(c.status as any)
          clearInterval(interval)
          onDone?.()
        }
      } catch {
        // silencioso
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [campaignId, onDone])

  const pct = total > 0 ? Math.round((sent / total) * 100) : 0
  const done = status !== "processing"

  return (
    <div className="w-80 rounded-xl bg-zinc-900 p-4 shadow-2xl text-white">
      <div className="mb-2 flex items-center gap-2">
        {done ? (
          status === "failed"
            ? <XOctagonIcon className="size-4 shrink-0 text-red-400" />
            : <CheckCircle2Icon className="size-4 shrink-0 text-emerald-400" />
        ) : (
          <Loader2Icon className="size-4 shrink-0 animate-spin text-sky-400" />
        )}
        <span className="flex-1 truncate text-sm font-medium">{campaignName}</span>
        <span className="text-xs tabular-nums text-zinc-400">{pct}%</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            done
              ? status === "failed" ? "bg-red-500" : "bg-emerald-500"
              : "bg-sky-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-zinc-400">
        {done
          ? status === "failed"
            ? "La campaña falló al enviar."
            : `${sent.toLocaleString()} de ${total.toLocaleString()} emails enviados.`
          : `Enviando ${sent.toLocaleString()} / ${total.toLocaleString()}...`
        }
      </p>
    </div>
  )
}
