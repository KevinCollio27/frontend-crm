"use client"

import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"
import { WhatsAppTemplatePreview, parseTemplateForPreview } from "./WhatsAppTemplatePreview"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: WhatsappTemplateRaw
}

export function PreviewWhatsappTemplateSheet({ open, onOpenChange, template }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <div className="flex h-full flex-col">
          <div className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <SheetTitle className="font-mono">{template.name}</SheetTitle>
              <Badge className="text-xs bg-green-600">{template.status}</Badge>
            </div>
            <SheetDescription>Así se ve el mensaje que reciben tus contactos.</SheetDescription>
          </div>
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <WhatsAppTemplatePreview {...parseTemplateForPreview(template)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
