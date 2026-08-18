"use client"

import * as React from "react"
import { SendIcon, XIcon } from "lucide-react"
import { notify } from "@/lib/notify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { whatsappService } from "@/services/whatsapp.service"
import { bodyTextOf, parseVarCount, previewBody } from "@/lib/whatsapp-template-utils"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: WhatsappTemplateRaw
}

export function SendWhatsappTemplateSheet({ open, onOpenChange, template }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full! sm:max-w-md" style={{ padding: 0, gap: 0 }}>
        {open && <SendForm template={template} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function SendForm({ template, onClose }: { template: WhatsappTemplateRaw; onClose: () => void }) {
  const bodyText = bodyTextOf(template)
  const varCount = parseVarCount(bodyText)

  const [phone, setPhone] = React.useState("")
  const [vars, setVars] = React.useState<Record<number, string>>({})
  const [sending, setSending] = React.useState(false)

  async function handleSend() {
    const to = phone.trim()
    if (!to) return

    setSending(true)
    try {
      const bodyVarValues = varCount > 0 ? Array.from({ length: varCount }, (_, i) => vars[i + 1] || "") : undefined
      await whatsappService.sendTemplateMessage(to, template.name, template.language, bodyVarValues)
      notify.success({ title: "Mensaje enviado", description: `Template "${template.name}" enviado a ${to}.` })
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
            <SheetTitle>Enviar mensaje de template</SheetTitle>
            <SheetDescription>Ingresa el número destino y completa las variables.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        <Section title={template.name} description="Vista previa del template a enviar.">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{template.language}</Badge>
            <Badge className="text-xs bg-green-600">{template.status}</Badge>
          </div>
          {bodyText && <p className="text-sm text-muted-foreground whitespace-pre-line">{bodyText}</p>}
        </Section>

        <Section title="Destinatario" description="Número en formato E.164, con código de país.">
          <div className="space-y-1.5">
            <Label>Número</Label>
            <Input
              placeholder="+56912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={sending}
              autoFocus
            />
          </div>
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
            {phone.trim() && (
              <p className="text-xs text-muted-foreground italic whitespace-pre-line">
                {previewBody(bodyText, vars)}
              </p>
            )}
          </Section>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={sending}>
          Cancelar
        </Button>
        <Button type="button" className="gap-1.5" onClick={handleSend} disabled={!phone.trim() || sending}>
          <SendIcon className="size-4" />
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  )
}
