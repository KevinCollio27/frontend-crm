import * as React from "react"
import { FileTextIcon, Loader2Icon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { widgetAIService } from "@/services/widget-ai.service"
import type { WidgetAIDocument } from "@/types/widget-ai"
import type { WidgetDocFile, WidgetFaq, WidgetFormState } from "../shared/form-state"

const PERSONALITIES: { key: string; prompt: string }[] = [
  {
    key: "Formal",
    prompt:
      "Eres un asistente virtual profesional y formal de nuestra empresa. Te diriges al visitante con cortesía, utilizas un lenguaje pulido y evitas modismos. Tu objetivo es brindar información precisa y guiar al usuario hacia el siguiente paso.",
  },
  {
    key: "Cercano",
    prompt:
      "Eres un asistente virtual cercano y conversacional. Hablas con el visitante de tú, con calidez y empatía. Buscas que se sienta escuchado y acompañado mientras resuelves sus dudas.",
  },
  {
    key: "Entusiasta",
    prompt:
      "¡Eres un asistente virtual enérgico y entusiasta! Transmites emoción por el producto, utilizas un lenguaje vibrante y motivas al visitante a dar el siguiente paso con confianza.",
  },
  {
    key: "Técnico",
    prompt:
      "Eres un asistente virtual con perfil técnico. Respondes con precisión, detalle y rigor. Citas especificaciones, integraciones y casos de uso cuando corresponde, asumiendo un visitante con conocimientos avanzados.",
  },
]

const ALLOWED_DOC_EXTENSIONS = ["pdf", "doc", "docx", "txt"]
const MAX_DOC_SIZE = 10 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Step2KnowledgeProps {
  form: WidgetFormState
  setForm: React.Dispatch<React.SetStateAction<WidgetFormState>>
  widgetId?: number
}

function ExistingDocsList({
  widgetId,
  existingDocs,
  onRemoved,
}: {
  widgetId: number
  existingDocs: WidgetAIDocument[]
  onRemoved: (id: number) => void
}) {
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  async function handleDelete(doc: WidgetAIDocument) {
    setDeletingId(doc.id)
    try {
      await widgetAIService.deleteDocument(widgetId, doc.id)
      onRemoved(doc.id)
    } catch {
      notify.error({ title: "No se pudo eliminar", description: `No se pudo eliminar "${doc.file_name}". Intenta de nuevo.` })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-1.5">
      {existingDocs.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm">{d.file_name}</span>
            <span className="text-xs text-muted-foreground">· {formatBytes(d.file_size)}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(d)}
            disabled={deletingId === d.id}
          >
            {deletingId === d.id ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
          </Button>
        </div>
      ))}
    </div>
  )
}

function DocumentsDropzone({
  docFiles,
  onAdd,
  onRemove,
}: {
  docFiles: WidgetDocFile[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
}) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleFiles(fileList: FileList | File[]) {
    const accepted: File[] = []
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
      if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
        notify.error({ title: "Formato no permitido", description: `"${file.name}" debe ser PDF, DOC, DOCX o TXT.` })
        continue
      }
      if (file.size > MAX_DOC_SIZE) {
        notify.error({ title: "Archivo muy grande", description: `"${file.name}" supera el máximo de 10MB.` })
        continue
      }
      accepted.push(file)
    }
    if (accepted.length > 0) onAdd(accepted)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "cursor-pointer rounded-lg border border-dashed p-8 text-center transition-colors hover:border-primary/60",
          dragging && "border-primary bg-primary/5"
        )}
      >
        <UploadIcon className="mx-auto mb-2 size-6 text-muted-foreground" />
        <div className="text-sm font-medium">Arrastra archivos o haz clic para subir</div>
        <div className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT · 10MB máx por archivo</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = "" }}
        />
      </div>
      {docFiles.length > 0 && (
        <div className="space-y-1.5">
          {docFiles.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{d.file.name}</span>
                <span className="text-xs text-muted-foreground">· {formatBytes(d.file.size)}</span>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onRemove(d.id)}>
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export function Step2Knowledge({ form, setForm, widgetId }: Step2KnowledgeProps) {
  function addDocs(files: File[]) {
    const newDocs: WidgetDocFile[] = files.map((file) => ({ id: `d${Date.now()}-${file.name}`, file }))
    setForm((f) => ({ ...f, docFiles: [...f.docFiles, ...newDocs] }))
  }

  function removeDoc(id: string) {
    setForm((f) => ({ ...f, docFiles: f.docFiles.filter((d) => d.id !== id) }))
  }

  function removeExistingDoc(id: number) {
    setForm((f) => ({ ...f, existingDocs: f.existingDocs.filter((d) => d.id !== id) }))
  }

  function addFaq() {
    const faq: WidgetFaq = { id: `f${Date.now()}`, question: "", answer: "" }
    setForm((f) => ({ ...f, faqs: [...f.faqs, faq] }))
  }

  function updateFaq(id: string, patch: Partial<WidgetFaq>) {
    setForm((f) => ({ ...f, faqs: f.faqs.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  }

  function removeFaq(id: string) {
    setForm((f) => ({ ...f, faqs: f.faqs.filter((x) => x.id !== id) }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Section title="Instrucciones del Agente" description="Define la personalidad, tono y limitaciones del agente.">
        <div className="flex flex-wrap gap-2">
          {PERSONALITIES.map((per) => (
            <button
              key={per.key}
              type="button"
              onClick={() => setForm((f) => ({ ...f, prompt: per.prompt }))}
              className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {per.key}
            </button>
          ))}
        </div>
        <Textarea
          rows={6}
          value={form.prompt}
          onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
        />
      </Section>

      <Section title="Documentos Base" description="PDF, DOC o TXT. Máx 10MB por archivo.">
        {widgetId && form.existingDocs.length > 0 && (
          <ExistingDocsList widgetId={widgetId} existingDocs={form.existingDocs} onRemoved={removeExistingDoc} />
        )}
        <DocumentsDropzone docFiles={form.docFiles} onAdd={addDocs} onRemove={removeDoc} />
      </Section>

      <Section title="Preguntas Frecuentes" description="El bot las usa como respuestas rápidas y sugerencias.">
        {form.faqs.length > 0 && (
          <div className="space-y-2">
            {form.faqs.map((f, i) => (
              <div key={f.id} className="space-y-2 rounded-md border bg-background p-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs text-muted-foreground">#{i + 1}</span>
                  <Input
                    value={f.question}
                    onChange={(e) => updateFaq(f.id, { question: e.target.value })}
                    placeholder="Pregunta"
                  />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeFaq(f.id)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={f.answer}
                  onChange={(e) => updateFaq(f.id, { answer: e.target.value })}
                  placeholder="Respuesta"
                />
              </div>
            ))}
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={addFaq}>
          <PlusIcon className="size-4" /> Agregar FAQ
        </Button>
      </Section>
    </div>
  )
}
