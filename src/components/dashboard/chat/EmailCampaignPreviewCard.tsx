"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { CheckIcon, CopyIcon, FlaskConicalIcon, LayersIcon, Loader2Icon, MailIcon, SendIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EmailCampaignPreviewBlock } from "@/types/ai-chat"

const MAX_BODY_HEIGHT = 420

// El HTML del correo va en un iframe aislado: sus estilos no se mezclan con el chat
// y, sin "allow-scripts", no puede ejecutar nada. "allow-same-origin" solo sirve
// para medir la altura del contenido desde afuera.
// En oscuro el fondo queda transparente (el de la tarjeta): el iframe solo se pinta
// transparente si su color-scheme coincide con el de la página.
function buildDocument(html: string, dark: boolean) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="${dark ? "dark" : "light"}"><style>
    html, body { background: ${dark ? "transparent" : "#ffffff"}; }
    body { margin: 0; padding: 20px 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${dark ? "#e5e7eb" : "#1f2937"}; word-wrap: break-word; }
    a { color: ${dark ? "#93c5fd" : "#2563eb"}; }
    img { max-width: 100%; height: auto; }
    p { margin: 0 0 12px; }
  </style></head><body>${html}</body></html>`
}

function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, "\n"), "text/html")
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim()
}

interface EmailCampaignPreviewCardProps {
  block: EmailCampaignPreviewBlock
  busy?: boolean
  disabled?: boolean
  onSend: () => void
  onSendTest: () => void
}

export function EmailCampaignPreviewCard({ block, busy = false, disabled = false, onSend, onSendTest }: EmailCampaignPreviewCardProps) {
  const { data, status } = block
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [bodyHeight, setBodyHeight] = React.useState(160)
  const [copied, setCopied] = React.useState(false)

  const pending = status === "pending"
  const moreRecipients = data.recipientCount - data.recipients.length

  function measure() {
    const doc = iframeRef.current?.contentDocument
    if (doc) setBodyHeight(Math.min(doc.documentElement.scrollHeight, MAX_BODY_HEIGHT))
  }

  async function copy() {
    await navigator.clipboard.writeText(`Asunto: ${data.subject}\n\n${htmlToText(data.html)}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn("mt-3 overflow-hidden rounded-xl border bg-card", !pending && "opacity-80")}>
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <MailIcon className="size-3.5 shrink-0" />
        <span className="truncate">Campaña · {data.name}</span>
        <StatusLabel status={status} campaignId={data.campaignId} />
      </div>

      <div className="flex items-baseline gap-3 border-b px-4 py-2.5">
        <span className="w-14 shrink-0 text-xs text-muted-foreground">Asunto</span>
        <span className="text-sm font-medium">{data.subject}</span>
      </div>

      <iframe
        ref={iframeRef}
        title={`Vista previa: ${data.subject}`}
        sandbox="allow-same-origin"
        srcDoc={buildDocument(data.html, dark)}
        onLoad={measure}
        style={{ height: bodyHeight, colorScheme: dark ? "dark" : "light" }}
        className="block w-full border-0"
      />

      <div className="space-y-1.5 border-t px-4 py-2.5 text-xs">
        <div className="flex gap-3">
          <span className="w-14 shrink-0 text-muted-foreground">Para</span>
          <span className="min-w-0 wrap-break-word">
            {data.recipients.join(", ")}
            {moreRecipients > 0 && <span className="text-muted-foreground"> y {moreRecipients.toLocaleString("es-CL")} más</span>}
            <span className="text-muted-foreground"> · {data.recipientCount.toLocaleString("es-CL")} en total</span>
          </span>
        </div>
        {(data.warnings || data.excluded) && (
          <div className="flex gap-3 text-amber-600 dark:text-amber-400">
            <span className="w-14 shrink-0"><TriangleAlertIcon className="size-3.5" /></span>
            <span>{[data.excluded && `No se envía a: ${data.excluded}`, data.warnings].filter(Boolean).join(" · ")}</span>
          </div>
        )}
      </div>

      {data.batch && <BatchPlan batch={data.batch} />}

      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        {pending && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onSendTest} disabled={disabled}>
              <FlaskConicalIcon data-icon="inline-start" />
              Enviar prueba
            </Button>
            <Button type="button" size="sm" onClick={onSend} disabled={disabled}>
              {busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
              {data.batch ? `Enviar tanda ${data.batch.index}` : "Enviar campaña"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Plan del envío masivo: qué tandas ya salieron, cuál es esta y cuáles faltan.
function BatchPlan({ batch }: { batch: NonNullable<EmailCampaignPreviewBlock["data"]["batch"]> }) {
  return (
    <div className="border-t px-4 py-2.5 text-xs">
      <div className="mb-1.5 flex items-center gap-2 text-muted-foreground">
        <LayersIcon className="size-3.5" />
        <span>Envío en {batch.total} tandas · {batch.seriesTotal.toLocaleString("es-CL")} destinatarios en total</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {batch.plan.map((p) => (
          <div
            key={p.index}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md px-2 py-1",
              p.index === batch.index ? "bg-primary/10 font-medium" : "text-muted-foreground"
            )}
          >
            <span>Tanda {p.index}</span>
            <span className="tabular-nums">
              {p.sent ? <CheckIcon className="inline size-3 text-emerald-600" /> : null} {p.size.toLocaleString("es-CL")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusLabel({ status, campaignId }: { status: EmailCampaignPreviewBlock["status"]; campaignId?: number }) {
  if (status === "pending") return null
  if (status === "sent") {
    return (
      <Link href="/marketing/campaigns" className="ml-auto shrink-0 font-medium text-emerald-600 hover:underline dark:text-emerald-400">
        Enviada{campaignId ? ` · #${campaignId}` : ""} · ver en Campañas
      </Link>
    )
  }
  return (
    <span className="ml-auto shrink-0">
      {status === "superseded" ? "Reemplazada por una versión más nueva" : "Cancelada"}
    </span>
  )
}
