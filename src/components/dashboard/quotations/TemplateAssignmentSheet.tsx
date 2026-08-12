"use client"

import * as React from "react"
import { CheckIcon, EyeIcon, FileTextIcon, InfoIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { pdfTemplateService } from "@/services/pdfTemplate.service"
import type { PdfTemplate } from "@/types/pdfTemplate"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { PdfTemplatePreviewSheet } from "@/components/settings/pdf-templates/PdfTemplatePreviewSheet"

interface Props {
  open:              boolean
  onOpenChange:      (open: boolean) => void
  title:             string
  description:       string
  note:              string
  currentTemplateId: number | null
  onSelect:          (id: number | null) => Promise<void>
}

interface Row {
  id:       number | null
  name:     string
  hint?:    string
  template?: PdfTemplate
}

export function TemplateAssignmentSheet({ open, onOpenChange, title, description, note, currentTemplateId, onSelect }: Props) {
  const [templates, setTemplates] = React.useState<PdfTemplate[]>([])
  const [loading, setLoading]     = React.useState(false)
  const [assigningId, setAssigningId] = React.useState<number | null | undefined>(undefined)
  const [previewTarget, setPreviewTarget] = React.useState<PdfTemplate | null>(null)

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    pdfTemplateService.getAll()
      .then((res) => { if (!cancelled) setTemplates(res) })
      .catch(() => { if (!cancelled) setTemplates([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

  async function handleSelect(id: number | null) {
    if (id === currentTemplateId || assigningId !== undefined) return
    setAssigningId(id)
    try {
      await onSelect(id)
      notify.success({ title: "Plantilla asignada", description: "La plantilla se actualizó correctamente." })
    } catch {
      notify.error({ title: "No se pudo asignar", description: "Ocurrió un error al asignar la plantilla." })
    } finally {
      setAssigningId(undefined)
    }
  }

  const workspaceDefault = templates.find((t) => t.is_default)
  const rows: Row[] = [
    { id: null, name: "Predeterminada del workspace", hint: workspaceDefault ? `Actualmente: ${workspaceDefault.name}` : undefined, template: workspaceDefault },
    ...templates.map((t) => ({ id: t.id, name: t.name, hint: t.is_default ? "Predeterminada del workspace" : undefined, template: t })),
  ]

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 520, padding: 0, gap: 0 }}
        className="flex w-full! flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="space-y-0.5">
            <SheetTitle className="flex items-center gap-2">
              <FileTextIcon className="size-4 text-muted-foreground" />
              {title}
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
            <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
              <InfoIcon className="size-3" /> Cómo funciona
            </p>
            <p className="text-sm">{note}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wider text-muted-foreground">Plantilla</p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              rows.map((row) => {
                const isSelected = row.id === currentTemplateId
                return (
                  <div
                    key={row.id ?? "default"}
                    className={cn(
                      "flex w-full items-center gap-1 rounded-lg border pr-2 transition-colors hover:bg-muted/30",
                      isSelected && "border-primary/40 bg-primary/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(row.id)}
                      disabled={assigningId !== undefined}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        {row.hint && (
                          <p className="truncate text-xs text-muted-foreground">{row.hint}</p>
                        )}
                      </div>
                    </button>
                    {row.template && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setPreviewTarget(row.template!)}
                        aria-label="Vista previa"
                      >
                        <EyeIcon className="size-4" />
                      </Button>
                    )}
                    <div className="flex size-8 shrink-0 items-center justify-center">
                      {assigningId === row.id ? (
                        <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
                      ) : isSelected ? (
                        <CheckIcon className="size-4 text-primary" />
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <PdfTemplatePreviewSheet
      open={!!previewTarget}
      onOpenChange={(open) => { if (!open) setPreviewTarget(null) }}
      template={previewTarget}
    />
    </>
  )
}
