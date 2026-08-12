"use client"

import * as React from "react"
import { BlocksIcon, FileTextIcon, XIcon } from "lucide-react"
import { notify } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { Switch } from "@/components/ui/switch"
import { pdfTemplateService } from "@/services/pdfTemplate.service"
import type { PdfTemplate, PdfTemplateBlockDraft } from "@/types/pdfTemplate"
import { BlockSection, type BlockDraft } from "./BlockSection"

const STEPS: StepperStep[] = [
  { id: 1, label: "Información", icon: FileTextIcon },
  { id: 2, label: "Bloques",     icon: BlocksIcon    },
]

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  entity?:      PdfTemplate
  onSuccess?:   (result: PdfTemplate, mode: "create" | "update") => void
}

export function CreatePdfTemplateSheet({ open, onOpenChange, entity, onSuccess }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 1400, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && (
          <TemplateWizard
            onClose={() => onOpenChange(false)}
            entity={entity}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function blocksToDrafts(template: PdfTemplate | undefined, position: "before" | "after"): BlockDraft[] {
  if (!template) return []
  return template.blocks
    .filter((b) => b.position === position)
    .sort((a, b) => a.order - b.order)
    .map((b) => ({ id: String(b.id), title: b.title, content: b.content }))
}

interface WizardProps {
  onClose:    () => void
  entity?:    PdfTemplate
  onSuccess?: (result: PdfTemplate, mode: "create" | "update") => void
}

function TemplateWizard({ onClose, entity, onSuccess }: WizardProps) {
  const isEdit = !!entity

  const [step, setStep]             = React.useState(1)
  const [submitting, setSubmitting] = React.useState(false)
  const [name, setName]             = React.useState(entity?.name ?? "")
  const [isDefault, setIsDefault]   = React.useState(entity?.is_default ?? false)
  const [beforeBlocks, setBeforeBlocks] = React.useState<BlockDraft[]>(() => blocksToDrafts(entity, "before"))
  const [afterBlocks, setAfterBlocks]   = React.useState<BlockDraft[]>(() => blocksToDrafts(entity, "after"))

  const canNext = name.trim().length > 0
  const title       = isEdit ? `Editar Plantilla — ${entity!.name}` : "Nueva Plantilla"
  const description = isEdit ? "Modifica el nombre y los bloques de esta plantilla." : "Crea una plantilla con bloques antes y después de la cotización."
  const submitLabel = isEdit ? "Guardar Cambios" : "Crear Plantilla"
  const savingLabel = isEdit ? "Guardando..." : "Creando..."

  async function handleSubmit() {
    if (!canNext) return
    setSubmitting(true)

    const blocks: PdfTemplateBlockDraft[] = [
      ...beforeBlocks.map((b, i) => ({ title: b.title, content: b.content, position: "before" as const, order: i })),
      ...afterBlocks.map((b, i) => ({ title: b.title, content: b.content, position: "after" as const, order: i })),
    ]
    const payload = { name: name.trim(), is_default: isDefault, blocks }

    try {
      const result = isEdit
        ? await pdfTemplateService.update(entity!.id, payload)
        : await pdfTemplateService.create(payload)
      notify.success({
        title: isEdit ? "Plantilla actualizada" : "Plantilla creada",
        description: `"${result.name}" se guardó correctamente.`,
      })
      onSuccess?.(result, isEdit ? "update" : "create")
      onClose()
    } catch (error) {
      notify.error({
        title: "Algo salió mal",
        description: (error as { message?: string })?.message ?? (isEdit ? "No se pudo actualizar la plantilla." : "No se pudo crear la plantilla."),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        {step === 1 && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section title="Información General" description="Nombra la plantilla para identificarla luego.">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cotización Negociación"
                  autoFocus
                />
              </div>
            </Section>

            <Section title="Configuración" description="Define si esta plantilla debe usarse por defecto.">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <div>
                  <p className="text-sm font-medium">Marcar como predeterminada del workspace</p>
                  <p className="text-xs text-muted-foreground">
                    Se usa cuando una cotización o una oportunidad no tiene una plantilla propia asignada.
                  </p>
                </div>
              </label>
            </Section>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section title="Antes de la base" description="Saludo o introducción que aparece antes de los datos de la cotización.">
              <BlockSection blocks={beforeBlocks} onChange={setBeforeBlocks} />
            </Section>

            <div className="rounded-lg border border-dashed py-3 text-center">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Base</p>
              <p className="text-xs text-muted-foreground">
                Datos de cliente · Detalle de servicios · Total final — fijo, no editable
              </p>
            </div>

            <Section title="Después de la base" description="Condiciones, cierre y demás contenido que aparece después de la cotización.">
              <BlockSection blocks={afterBlocks} onChange={setAfterBlocks} />
            </Section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
          >
            Anterior
          </Button>
          {step < 2 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? savingLabel : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
