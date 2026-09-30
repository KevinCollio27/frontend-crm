"use client"

import Link from "next/link"
import { CheckIcon, FlaskConicalIcon, Loader2Icon, MessageCircleIcon, RepeatIcon, SendIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WhatsAppTemplatePreview } from "@/components/settings/whatsapp-templates/WhatsAppTemplatePreview"
import { WhatsappTemplateCarousel, withDefaults } from "./WhatsappTemplateCarousel"
import { BatchPlan } from "./EmailCampaignPreviewCard"
import { cn } from "@/lib/utils"
import type { WhatsappCampaignPreviewBlock } from "@/types/ai-chat"

interface WhatsappCampaignPreviewCardProps {
  block: WhatsappCampaignPreviewBlock
  busy?: boolean
  disabled?: boolean
  onSend: () => void
  // La prueba necesita un número: se lo pide la IA en el chat.
  onSendTest: () => void
  // Carrusel: elegir otra plantilla le pide a la IA que la use (completa las variables de nuevo).
  onChooseTemplate: (templateName: string) => void
}

export function WhatsappCampaignPreviewCard({ block, busy = false, disabled = false, onSend, onSendTest, onChooseTemplate }: WhatsappCampaignPreviewCardProps) {
  const { data, status } = block
  const pending = status === "pending"
  // Tarjetas antiguas no traen `template`: se arma con el cuerpo que sí tenían.
  const template = withDefaults(data.template ?? { name: data.templateName, category: data.category, body: data.body })
  const more = data.recipientCount - data.recipients.length

  return (
    <div className={cn("mt-3 overflow-hidden rounded-xl border bg-card", !pending && "opacity-80")}>
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <MessageCircleIcon className="size-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">WhatsApp · plantilla <span className="font-medium text-foreground">{data.templateName}</span></span>
        {data.category && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase">{data.category}</span>}
        <StatusLabel status={status} campaignId={data.campaignId} />
      </div>

      {/* Plantilla completa (imagen, pie y botones), igual que en la pantalla de Plantillas */}
      <div className="px-4 py-3">
        <div className="mx-auto max-w-sm">
          <WhatsAppTemplatePreview
            headerMode={template.headerMode}
            headerText={template.headerText}
            headerImageUrl={template.headerImageUrl}
            bodyText={template.body}
            footerText={template.footerText}
            buttons={template.buttons}
          />
        </div>
      </div>

      <div className="space-y-1.5 border-t px-4 py-2.5 text-xs">
        <div className="flex gap-3">
          <span className="w-14 shrink-0 text-muted-foreground">Para</span>
          <span className="min-w-0 wrap-break-word">
            {data.recipients.join(", ")}
            {more > 0 && <span className="text-muted-foreground"> y {more.toLocaleString("es-CL")} más</span>}
            <span className="text-muted-foreground"> · {data.recipientCount.toLocaleString("es-CL")} en total</span>
          </span>
        </div>
        {data.testSentTo && (
          <div className="flex gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="w-14 shrink-0"><FlaskConicalIcon className="size-3.5" /></span>
            <span>Prueba enviada a {data.testSentTo}</span>
          </div>
        )}
        {data.excluded && (
          <div className="flex gap-3 text-amber-600 dark:text-amber-400">
            <span className="w-14 shrink-0"><TriangleAlertIcon className="size-3.5" /></span>
            <span>No se envía a: {data.excluded}</span>
          </div>
        )}
      </div>

      {data.batch && <BatchPlan batch={data.batch} />}

      {pending && data.alternatives.length > 0 && (
        <details className="group border-t">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">
            <RepeatIcon className="size-3.5" />
            Cambiar plantilla ({data.alternatives.length} disponibles)
          </summary>
          <WhatsappTemplateCarousel
            templates={data.alternatives}
            actionLabel="Usar esta en su lugar"
            disabled={disabled}
            onChoose={onChooseTemplate}
          />
        </details>
      )}

      {pending && (
        <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
          <Button type="button" variant="outline" size="sm" onClick={onSendTest} disabled={disabled}>
            <FlaskConicalIcon data-icon="inline-start" />
            Enviar prueba
          </Button>
          <Button type="button" size="sm" onClick={onSend} disabled={disabled}>
            {busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
            {data.batch ? `Enviar tanda ${data.batch.index}` : "Enviar por WhatsApp"}
          </Button>
        </div>
      )}
    </div>
  )
}

function StatusLabel({ status, campaignId }: { status: WhatsappCampaignPreviewBlock["status"]; campaignId?: number }) {
  if (status === "pending") return null
  if (status === "sent") {
    return (
      <Link href="/marketing/campaigns" className="ml-auto flex shrink-0 items-center gap-1 font-medium text-emerald-600 hover:underline dark:text-emerald-400">
        <CheckIcon className="size-3" /> Enviada{campaignId ? ` · #${campaignId}` : ""}
      </Link>
    )
  }
  return (
    <span className="ml-auto shrink-0">
      {status === "superseded" ? "Reemplazada por una versión más nueva" : "Cancelada"}
    </span>
  )
}
