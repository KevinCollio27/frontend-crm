"use client"

import * as React from "react"
import { SendIcon, XIcon } from "lucide-react"
import { notify } from "@/lib/notify"
import { bodyTextOf, parseVarCount, previewBody } from "@/lib/whatsapp-template-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { whatsappService } from "@/services/whatsapp.service"
import { parseTemplateForPreview, WhatsAppTemplatePreview } from "@/components/settings/whatsapp-templates/WhatsAppTemplatePreview"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: number
  templates: WhatsappTemplateRaw[]
  onSent: (content: string, template: { name: string; language: string; vars: string[] }) => void
}

export function SendTemplateToConversationSheet({ open, onOpenChange, conversationId, templates, onSent }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full! sm:max-w-md" style={{ padding: 0, gap: 0 }}>
        {open && (
          <Form
            conversationId={conversationId}
            templates={templates}
            onSent={onSent}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Form({
  conversationId,
  templates,
  onSent,
  onClose,
}: {
  conversationId: number
  templates: WhatsappTemplateRaw[]
  onSent: (content: string, template: { name: string; language: string; vars: string[] }) => void
  onClose: () => void
}) {
  const approved = React.useMemo(() => templates.filter((t) => t.status === "APPROVED"), [templates])
  const [templateName, setTemplateName] = React.useState(approved[0]?.name ?? "")
  const template = approved.find((t) => t.name === templateName)
  const bodyText = template ? bodyTextOf(template) : ""
  const varCount = parseVarCount(bodyText)

  const [vars, setVars] = React.useState<Record<number, string>>({})
  const [sending, setSending] = React.useState(false)

  function handleTemplateChange(name: string) {
    setTemplateName(name)
    setVars({})
  }

  async function handleSend() {
    if (!template) return
    setSending(true)
    try {
      const bodyVarValues = varCount > 0 ? Array.from({ length: varCount }, (_, i) => vars[i + 1] || "") : []
      await whatsappService.sendTemplateToConversation(conversationId, template.name, template.language, bodyVarValues.length ? bodyVarValues : undefined)
      notify.success({ title: "Plantilla enviada", description: `"${template.name}" enviada — la conversación quedó reabierta.` })
      onSent(previewBody(bodyText, vars), { name: template.name, language: template.language, vars: bodyVarValues })
      onClose()
    } catch (error) {
      notify.error({
        title: "No se pudo enviar",
        description: (error as { message?: string; extraMessage?: string })?.extraMessage
          ?? (error as { message?: string })?.message
          ?? "Intenta de nuevo.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>Reabrir con plantilla</SheetTitle>
            <SheetDescription>La ventana de 24h está cerrada — elige una plantilla para reabrir la conversación.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay plantillas aprobadas todavía. Crea una en Configuración → Plantillas.</p>
        ) : (
          <>
            <Section title="Plantilla" description="Solo se muestran las aprobadas por Meta.">
              <Select value={templateName} onValueChange={(v) => { if (v) handleTemplateChange(v) }} disabled={sending}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {approved.map((t) => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>

            {varCount > 0 && (
              <Section title="Variables" description="Se reemplazan en el orden que aparecen en el mensaje.">
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: varCount }, (_, i) => i + 1).map((n) => (
                    <div key={n} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{`{{${n}}}`}</Label>
                      <Input
                        placeholder={`Variable ${n}`}
                        value={vars[n] || ""}
                        onChange={(e) => setVars((prev) => ({ ...prev, [n]: e.target.value }))}
                        disabled={sending}
                      />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {template && (
              <Section title="Vista previa">
                <WhatsAppTemplatePreview
                  {...parseTemplateForPreview(template)}
                  bodyText={previewBody(bodyText, vars)}
                />
              </Section>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={sending}>
          Cancelar
        </Button>
        <Button type="button" className="gap-1.5" onClick={handleSend} disabled={!template || sending}>
          <SendIcon className="size-4" />
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  )
}
