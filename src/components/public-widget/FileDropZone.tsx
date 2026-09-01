"use client"

import * as React from "react"
import { Loader2Icon, UploadCloudIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface UploadedFileValue {
  file_path:     string
  file_name:     string
  original_name: string
}

export function isUploadedFileValue(v: unknown): v is UploadedFileValue {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "file_path" in v && "file_name" in v
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface Props {
  id:          string
  slug:        string
  value:       UploadedFileValue | null
  accept?:     string
  error?:      boolean
  radiusStyle: React.CSSProperties
  onChange:    (v: UploadedFileValue | null) => void
}

// Sube el archivo de una vez (base64, mismo patrón que ImageUpload/ThumbnailUpload
// del CRM) contra el endpoint público que ya existe para esto — antes este
// componente (o su versión sin subida real en BlocksRenderer) solo guardaba el
// nombre del archivo como texto, nunca el archivo en sí.
export function FileDropZone({ id, slug, value, accept, error, radiusStyle, onChange }: Props) {
  const [dragging, setDragging]   = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [failed, setFailed]       = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setFailed(false)
    try {
      const dataUrl = await fileToBase64(file)
      const extension = file.name.includes(".") ? file.name.split(".").pop()! : ""
      const res = await fetch(`/api/proxy/widget/form/${slug}/upload-file`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ base64File: dataUrl, extension, originalName: file.name }),
      })
      const data = await res.json()
      if (!res.ok || !data?.file_path) throw new Error()
      onChange({ file_path: data.file_path, file_name: data.file_name, original_name: data.original_name ?? file.name })
    } catch {
      setFailed(true)
      onChange(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        style={radiusStyle}
        className={cn(
          "flex cursor-pointer items-center gap-3 border-2 border-dashed p-3 transition-colors select-none",
          uploading && "pointer-events-none opacity-70",
          dragging ? "border-ring bg-muted/50"
          : value ? "border-ring/40 bg-muted/20"
          : "border-input hover:border-muted-foreground/40 hover:bg-muted/20",
          error && "border-destructive"
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
          {uploading
            ? <Loader2Icon className="size-4.5 animate-spin text-muted-foreground" />
            : <UploadCloudIcon className="size-4.5 text-muted-foreground/60" />}
        </div>
        <div className="min-w-0 flex-1">
          {uploading ? (
            <p className="text-sm font-medium">Subiendo archivo…</p>
          ) : value ? (
            <p className="truncate text-sm font-medium">{value.original_name} · haz clic para cambiar</p>
          ) : (
            <>
              <p className="text-sm font-medium">Arrastra un archivo o haz clic</p>
              <p className="text-xs text-muted-foreground">o suéltalo aquí</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ""
          }}
        />
      </div>
      {failed && <p className="mt-1 text-xs text-destructive">No se pudo subir el archivo — intenta de nuevo.</p>}
    </div>
  )
}
