"use client"

import * as React from "react"
import { Loader2Icon, MessageCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { WhatsAppTemplatePreview, parseTemplateForPreview } from "@/components/settings/whatsapp-templates/WhatsAppTemplatePreview"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { useSendActions } from "@/hooks/useSendActions"
import { formService } from "@/services/form.service"
import type { FormRaw } from "@/types/form"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"

function bodyTextOf(t: WhatsappTemplateRaw): string {
  if (t.body_text) return t.body_text
  return t.components?.find((c) => c.type === "BODY")?.text ?? ""
}

interface FormAutoReplySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: FormRaw | null
  onSuccess?: (updated: FormRaw) => void
}

export function FormAutoReplySheet({ open, onOpenChange, form, onSuccess }: FormAutoReplySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 480, padding: 0, gap: 0 }} className="w-full!">
        {open && form && <FormAutoReplyBody form={form} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </SheetContent>
    </Sheet>
  )
}

function FormAutoReplyBody({ form, onClose, onSuccess }: {
  form: FormRaw
  onClose: () => void
  onSuccess?: (updated: FormRaw) => void
}) {
  const { canSendTemplate, approvedTemplates } = useSendActions()
  const [enabled, setEnabled] = React.useState(form.whatsapp_auto_reply_enabled)
  const [selectedTemplate, setSelectedTemplate] = React.useState<WhatsappTemplateRaw | null>(
    approvedTemplates.find((t) => t.id === form.whatsapp_template_id) ?? null
  )
  const [saving, setSaving] = React.useState(false)

  // approvedTemplates llega async (useSendActions pide a la API al montar) — una vez
  // que está la lista, recién ahí se puede matchear el template ya guardado del formulario.
  React.useEffect(() => {
    if (form.whatsapp_template_id && !selectedTemplate) {
      const match = approvedTemplates.find((t) => t.id === form.whatsapp_template_id)
      if (match) setSelectedTemplate(match)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedTemplates])

  const canSave = !enabled || selectedTemplate !== null

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const updated = await formService.updateWhatsAppAutoReply(form.id, {
        whatsapp_auto_reply_enabled: enabled,
        whatsapp_template_id: enabled ? (selectedTemplate?.id ?? null) : null,
      })
      notify.success({ title: "Guardado", description: "La respuesta automática se actualizó correctamente." })
      onSuccess?.(updated)
      onClose()
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo guardar la configuración." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle className="text-base leading-snug">Respuesta automática</SheetTitle>
          <SheetDescription className="text-xs">
            Envía un WhatsApp apenas alguien completa &quot;{form.name}&quot;.
          </SheetDescription>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
          <XIcon />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {!canSendTemplate ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <MessageCircleIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">WhatsApp no está disponible en este workspace</p>
            <p className="text-xs text-muted-foreground">
              Necesitas la integración de WhatsApp conectada y al menos un template aprobado por Meta.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-3.5">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Activar respuesta automática</p>
                <p className="text-xs text-muted-foreground">Se manda solo si quien respondió dejó un teléfono.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={(v) => setEnabled(!!v)} />
            </div>

            {enabled && (
              <Section title="Template" description="Solo se listan los aprobados por Meta.">
                <div className="space-y-2">
                  {approvedTemplates.map((t) => (
                    <button
                      key={t.id ?? t.name}
                      type="button"
                      onClick={() => setSelectedTemplate(t)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                        selectedTemplate?.name === t.name ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{bodyTextOf(t)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {enabled && selectedTemplate && (
              <Section title="Vista previa" description="Con el nombre de quien completó el formulario.">
                <WhatsAppTemplatePreview
                  {...parseTemplateForPreview(selectedTemplate)}
                  bodyText={bodyTextOf(selectedTemplate).replace(/\{\{1\}\}/g, "Juan Pérez")}
                />
              </Section>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-5 py-3.5">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave} disabled={!canSave || saving || !canSendTemplate}>
          {saving ? <><Loader2Icon className="size-4 animate-spin" /> Guardando...</> : "Guardar"}
        </Button>
      </div>
    </div>
  )
}
