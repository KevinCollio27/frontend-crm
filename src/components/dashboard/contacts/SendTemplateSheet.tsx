"use client"

import * as React from "react"
import { LoaderCircleIcon, SendIcon, UserRoundIcon, XIcon } from "lucide-react"
import { notify } from "@/lib/notify"
import { bodyTextOf, parseVarCount, previewBody } from "@/lib/whatsapp-template-utils"
import { normalizeWhatsAppRecipient } from "@/lib/whatsapp-phone"
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
  contactName: string
  phone: string
  country: string
  templates: WhatsappTemplateRaw[]
}

export function SendTemplateSheet({ open, onOpenChange, contactName, phone, country, templates }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full! sm:max-w-md" style={{ padding: 0, gap: 0 }}>
        {open && (
          <Form
            contactName={contactName}
            phone={phone}
            country={country}
            templates={templates}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Form({
  contactName,
  phone,
  country,
  templates,
  onClose,
}: {
  contactName: string
  phone: string
  country: string
  templates: WhatsappTemplateRaw[]
  onClose: () => void
}) {
  const recipient = React.useMemo(() => normalizeWhatsAppRecipient(phone, country), [phone, country])
  const [templateName, setTemplateName] = React.useState(templates[0]?.name ?? "")
  const template = templates.find((t) => t.name === templateName)
  const bodyText = template ? bodyTextOf(template) : ""
  const varCount = parseVarCount(bodyText)

  const [vars, setVars] = React.useState<Record<number, string>>({})
  const [sending, setSending] = React.useState(false)

  function handleTemplateChange(name: string) {
    setTemplateName(name)
    setVars({})
  }

  async function handleSend() {
    if (!template || !recipient) return
    setSending(true)
    try {
      const bodyVarValues = varCount > 0 ? Array.from({ length: varCount }, (_, i) => vars[i + 1] || "") : undefined
      await whatsappService.sendTemplateMessage(recipient, template.name, template.language, bodyVarValues)
      notify.success({ title: "Plantilla enviada", description: `"${template.name}" enviada a ${contactName}.` })
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
            <SheetTitle>Enviar plantilla</SheetTitle>
            <SheetDescription>Elige una plantilla aprobada para enviársela a este contacto.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
        <Section title="Destinatario">
          <div className="flex items-center gap-2.5 rounded-lg border p-2.5">
            <UserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{contactName}</p>
              <p className="text-xs text-muted-foreground">{phone}{recipient && recipient !== phone.replace(/\D/g, "") ? ` → se envía como +${recipient}` : ""}</p>
            </div>
          </div>
          {!recipient && (
            <p className="text-xs text-destructive">
              Este teléfono no tiene un formato reconocible (le falta el código de país) — no se puede enviar hasta corregirlo en el contacto.
            </p>
          )}
        </Section>

        <Section title="Plantilla" description="Solo se muestran las aprobadas por Meta.">
          <Select value={templateName} onValueChange={(v) => { if (v) handleTemplateChange(v) }} disabled={sending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una plantilla" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
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
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={sending}>
          Cancelar
        </Button>
        <Button type="button" className="gap-1.5" onClick={handleSend} disabled={!template || !recipient || sending}>
          {sending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  )
}
