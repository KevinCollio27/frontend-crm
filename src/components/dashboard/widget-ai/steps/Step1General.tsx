import * as React from "react"
import { UploadIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { WidgetFormState } from "../shared/form-state"

interface Step1GeneralProps {
  form: WidgetFormState
  setForm: React.Dispatch<React.SetStateAction<WidgetFormState>>
}

function LogoUpload({
  value,
  existingUrl,
  onChange,
}: {
  value: File | null
  existingUrl?: string
  onChange: (file: File | null) => void
}) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const blobRef = React.useRef<string>("")
  const [previewSrc, setPreviewSrc] = React.useState(existingUrl ?? "")

  React.useEffect(() => {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    if (!value) {
      blobRef.current = ""
      setPreviewSrc(existingUrl ?? "")
      return
    }
    const blob = URL.createObjectURL(value)
    blobRef.current = blob
    setPreviewSrc(blob)
    return () => URL.revokeObjectURL(blob)
  }, [value, existingUrl])

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    onChange(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer select-none items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors",
        dragging
          ? "border-ring bg-muted/50"
          : previewSrc
          ? "border-ring/40 bg-muted/20"
          : "border-input hover:border-muted-foreground/40 hover:bg-muted/20"
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" className="size-full object-cover" />
        ) : (
          <UploadIcon className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {value ? (
          <p className="truncate text-sm">{value.name}</p>
        ) : previewSrc ? (
          <p className="text-sm">Logo actual · haz clic para cambiar</p>
        ) : (
          <p className="text-sm text-muted-foreground">Arrastra una imagen o haz clic</p>
        )}
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={(e) => { e.stopPropagation(); onChange(null) }}
        >
          <XIcon className="size-3.5" />
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
      />
    </div>
  )
}

export function Step1General({ form, setForm }: Step1GeneralProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Section title="Información General" description="Cómo se llama el widget y cómo se presenta a tus visitantes.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del Widget" required>
            <Input
              placeholder="ej. Widget Sitio Principal"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Nombre del Asistente">
            <Input
              placeholder="ej. Asistente GOxT"
              value={form.chatTitle}
              onChange={(e) => setForm((f) => ({ ...f, chatTitle: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Descripción (uso interno)">
          <Textarea
            rows={2}
            placeholder="Para qué sirve, dónde se publicará, etc."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>

        <Field label="Mensaje de Bienvenida">
          <Textarea
            rows={3}
            value={form.welcomeMessage}
            onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Color de Marca">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                className="h-9 w-12 cursor-pointer rounded-md border bg-transparent"
              />
              <Input
                value={form.brandColor}
                onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                className="font-mono uppercase"
                maxLength={7}
              />
            </div>
          </Field>
          <Field label="Logo del Chatbot">
            <LogoUpload
              value={form.logoFile}
              existingUrl={form.existingLogoUrl}
              onChange={(logoFile) => setForm((f) => ({ ...f, logoFile }))}
            />
          </Field>
        </div>
      </Section>
    </div>
  )
}
