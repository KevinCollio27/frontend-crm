"use client"

import * as React from "react"
import { FileTextIcon, InfoIcon, LoaderCircleIcon, LockIcon, UploadCloudIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/notify"
import { aiChatConfigService } from "@/services/ai-chat-config.service"
import type { AiChatConfigDocument } from "@/types/ai-chat-config"
import { UploadDocumentSheet } from "@/components/dashboard/documents/UploadDocumentSheet"
import { DocumentPickerDialog } from "./DocumentPickerDialog"

const INSTRUCTIONS_MAX_LENGTH = 8000

const INSTRUCTION_PRESETS: { key: string; prompt: string }[] = [
  {
    key: "Comercial",
    prompt:
      "Responde siempre con enfoque comercial: prioriza cerrar oportunidades, destaca beneficios y propone el siguiente paso de venta cuando corresponda.",
  },
  {
    key: "Logístico",
    prompt:
      "Responde con enfoque logístico y operativo: prioriza tiempos, rutas, disponibilidad y estado de despachos por sobre aspectos comerciales.",
  },
  {
    key: "Soporte",
    prompt:
      "Responde con enfoque de soporte al cliente: sé empático, resuelve dudas paso a paso y escala a un humano si el problema lo requiere.",
  },
]

interface ChatContextSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatContextSheet({ open, onOpenChange }: ChatContextSheetProps) {
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [instructions, setInstructions] = React.useState("")
  const [documents, setDocuments] = React.useState<AiChatConfigDocument[]>([])
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    aiChatConfigService
      .get()
      .then((config) => {
        setInstructions(config.instructions)
        setDocuments(config.documents)
      })
      .catch(() => notify.error({ title: "No se pudo cargar el contexto", description: "Intenta de nuevo." }))
      .finally(() => setLoading(false))
  }, [open])

  function handleClose() {
    onOpenChange(false)
  }

  function addDocument(doc: AiChatConfigDocument) {
    setDocuments((prev) => (prev.some((d) => d.id === doc.id) ? prev : [...prev, doc]))
  }

  function removeDocument(id: number) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await aiChatConfigService.update({
        instructions,
        documentIds: documents.map((d) => d.id),
      })
      notify.success({ title: "Contexto guardado", description: "El Chat IA usará este contexto en todo el workspace." })
      handleClose()
    } catch {
      notify.error({ title: "No se pudo guardar el contexto", description: "Intenta de nuevo." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 640, padding: 0, gap: 0 }} className="w-full!">
          {/* Header */}
          <div className="flex items-start justify-between border-b p-5">
            <div className="space-y-0.5">
              <SheetTitle>Contexto del agente IA</SheetTitle>
              <SheetDescription>
                Agrega contexto para que tú y tu equipo tengan respuestas personalizadas.
              </SheetDescription>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={handleClose} aria-label="Cerrar">
              <XIcon />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-5 p-5">
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                    <InfoIcon className="size-3" /> Cómo funciona
                  </p>
                  <p className="text-sm">
                    Esta configuración es única por workspace y aplica a todas las conversaciones del equipo en el Chat IA.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-wider text-muted-foreground">Instrucciones (opcional)</p>
                  <div className="flex flex-wrap gap-2">
                    {INSTRUCTION_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setInstructions(preset.prompt)}
                        className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {preset.key}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    rows={5}
                    maxLength={INSTRUCTIONS_MAX_LENGTH}
                    placeholder="Ej: Responde siempre como un agente comercial, cercano y orientado a cerrar oportunidades..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <span
                      className={`text-xs ${
                        instructions.length >= INSTRUCTIONS_MAX_LENGTH * 0.9 ? "text-amber-600" : "text-muted-foreground"
                      }`}
                    >
                      {instructions.length}/{INSTRUCTIONS_MAX_LENGTH} caracteres
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-wider text-muted-foreground">Fuentes</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
                      <UploadCloudIcon className="size-4" /> Cargar archivo
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                      <FileTextIcon className="size-4" /> Seleccionar documento
                    </Button>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium tracking-wider text-muted-foreground">
                      Fuentes agregadas ({documents.length})
                    </p>
                    <div className="space-y-1.5">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-sm">{doc.name}</span>
                            {doc.visibility === "private" && (
                              <LockIcon className="size-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeDocument(doc.id)}>
                            <XIcon className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || loading}>
              {saving && <LoaderCircleIcon className="mr-1 size-4 animate-spin" />}
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <UploadDocumentSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => {
          notify.info({ title: "Documento subido", description: "Ábrelo desde \"Seleccionar documento\" para agregarlo como contexto." })
        }}
      />

      <DocumentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        alreadySelectedIds={documents.map((d) => d.id)}
        onConfirm={(selected) => selected.forEach(addDocument)}
      />
    </>
  )
}
