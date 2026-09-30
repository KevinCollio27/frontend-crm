"use client"

import { MessageCircleIcon } from "lucide-react"
import { WhatsappTemplateCarousel } from "./WhatsappTemplateCarousel"
import type { WhatsappTemplatePickerBlock } from "@/types/ai-chat"

interface WhatsappTemplatePickerCardProps {
  block: WhatsappTemplatePickerBlock
  disabled?: boolean
  // Elegir una plantilla le pide a la IA que la use: completa sus variables y arma la vista previa.
  onChoose: (templateName: string) => void
}

export function WhatsappTemplatePickerCard({ block, disabled = false, onChoose }: WhatsappTemplatePickerCardProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <MessageCircleIcon className="size-3.5 shrink-0 text-emerald-600" />
        <span>Plantillas de WhatsApp aprobadas · {block.data.templates.length}</span>
      </div>
      <WhatsappTemplateCarousel
        templates={block.data.templates}
        recommended={block.data.recommended}
        actionLabel="Usar esta plantilla"
        disabled={disabled}
        onChoose={onChoose}
      />
    </div>
  )
}
