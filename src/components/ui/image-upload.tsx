"use client"

import * as React from "react"
import { Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { notify } from "@/lib/notify"
import { formService } from "@/services/form.service"
import { cn } from "@/lib/utils"

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface ImageUploadProps {
  value: string
  onChange: (url: string, key?: string) => void
  className?: string
  uploadFn?: (fileName: string, base64File: string) => Promise<{ url: string; key?: string }>
  accept?: string
  allowedMimeTypes?: string[]
}

export function ImageUpload({
  value,
  onChange,
  className,
  uploadFn = formService.uploadImage,
  accept = "image/*",
  allowedMimeTypes,
}: ImageUploadProps) {
  const [mode, setMode] = React.useState<"upload" | "url">(
    value && !value.startsWith("http") ? "upload" : value ? "url" : "upload"
  )
  const [uploading, setUploading]   = React.useState(false)
  const [dragging, setDragging]     = React.useState(false)
  const [previewSrc, setPreviewSrc] = React.useState(value.startsWith("http") ? value : "")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const blobRef  = React.useRef("")

  React.useEffect(() => {
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current) }
  }, [])

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      notify.error({ title: "Solo se permiten imágenes", description: "Sube un archivo PNG, JPG o WEBP." })
      return
    }
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
      notify.error({ title: "Formato no admitido", description: "Sube una imagen en formato JPG o PNG." })
      return
    }
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    const blob = URL.createObjectURL(file)
    blobRef.current = blob
    setPreviewSrc(blob)
    setUploading(true)
    try {
      const base64 = await fileToBase64(file)
      const { url, key } = await uploadFn(file.name, base64)
      onChange(url, key)
    } catch {
      notify.error({ title: "No se pudo subir la imagen", description: "Intenta de nuevo o usa una URL." })
      setPreviewSrc("")
      onChange("")
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = "" }
    setPreviewSrc("")
    onChange("", "")
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1 rounded-lg border p-0.5 w-fit">
        {(["upload", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              mode === m
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "upload" ? "Subir archivo" : "URL"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
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
          className={cn(
            "flex cursor-pointer select-none items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors",
            dragging     ? "border-ring bg-muted/50"
            : previewSrc ? "border-ring/40 bg-muted/20"
            : "border-input hover:border-muted-foreground/40 hover:bg-muted/20"
          )}
        >
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewSrc} alt="" className="size-full object-cover" />
            ) : uploading ? (
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <UploadCloudIcon className="size-5 text-muted-foreground/50" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {previewSrc ? (
              <p className="truncate text-sm font-medium">
                {uploading ? "Subiendo..." : "Imagen cargada · haz clic para cambiar"}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium">Arrastra una imagen o haz clic</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
              </>
            )}
          </div>

          {previewSrc && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={(e) => { e.stopPropagation(); handleClear() }}
            >
              <XIcon className="size-3.5" />
            </Button>
          )}

          <input
            ref={inputRef}
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
      ) : (
        <Input
          placeholder="https://..."
          value={value.startsWith("http") ? value : ""}
          onChange={(e) => { setPreviewSrc(e.target.value); onChange(e.target.value) }}
        />
      )}
    </div>
  )
}
