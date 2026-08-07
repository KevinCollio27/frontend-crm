"use client"

import * as React from "react"
import { FileTextIcon, LoaderCircleIcon, UploadIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { fileOpportunityService } from "@/services/file-opportunity.service"
import { notify } from "@/lib/notify"
import type { FileOpportunityRaw } from "@/types/file-opportunity"

const FILE_ICON_STYLE: Record<string, { bg: string; color: string }> = {
  pdf:  { bg: "bg-red-100",     color: "text-red-600"     },
  docx: { bg: "bg-blue-100",    color: "text-blue-600"    },
  doc:  { bg: "bg-blue-100",    color: "text-blue-600"    },
  xlsx: { bg: "bg-emerald-100", color: "text-emerald-600" },
  xls:  { bg: "bg-emerald-100", color: "text-emerald-600" },
  pptx: { bg: "bg-orange-100",  color: "text-orange-600"  },
  ppt:  { bg: "bg-orange-100",  color: "text-orange-600"  },
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getExt(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? ""
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId: number
  entity?: FileOpportunityRaw
  onSuccess?: (result: FileOpportunityRaw) => void
}

export function FileOpportunitySheet({ open, onOpenChange, opportunityId, entity, onSuccess }: Props) {
  const isEdit = !!entity

  const [name, setName]             = React.useState("")
  const [file, setFile]             = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [fileError, setFileError]   = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setName(entity?.name ?? "")
      setFile(null)
      setIsDragging(false)
      setFileError("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open, entity])

  function pickFile(picked: File) {
    setFile(picked)
    setFileError("")
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) pickFile(dropped)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    if (picked) pickFile(picked)
  }

  function clearFile(e: React.MouseEvent) {
    e.stopPropagation()
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && !file) {
      setFileError("Selecciona un archivo.")
      return
    }
    setSubmitting(true)
    const t0 = Date.now()
    try {
      const displayName = name.trim() || (file ? file.name.replace(/\.[^/.]+$/, "") : entity!.name)
      let result: FileOpportunityRaw

      if (isEdit) {
        const payload: Parameters<typeof fileOpportunityService.update>[1] = { name: displayName }
        if (file) {
          payload.extension  = getExt(file.name) || "bin"
          payload.base64File = await readAsDataURL(file)
        }
        console.log(`[file-opp] update start id=${entity!.id}`)
        result = await fileOpportunityService.update(entity!.id, payload)
        console.log(`[file-opp] update OK → ${Date.now() - t0}ms`)
        notify.success({ title: "Archivo actualizado", description: `"${displayName}" fue actualizado.` })
      } else {
        const ext = getExt(file!.name) || "bin"
        const base64File = await readAsDataURL(file!)
        console.log(`[file-opp] create start opportunityId=${opportunityId}`)
        result = await fileOpportunityService.create({ opportunity_id: opportunityId, name: displayName, extension: ext, base64File })
        console.log(`[file-opp] create OK → ${Date.now() - t0}ms`)
        notify.success({ title: "Archivo subido", description: `"${displayName}" se subió correctamente.` })
      }

      onSuccess?.(result)
      onOpenChange(false)
    } catch {
      // no-op
    } finally {
      setSubmitting(false)
    }
  }

  const newExt     = file ? getExt(file.name) : ""
  const newConf    = FILE_ICON_STYLE[newExt] ?? { bg: "bg-muted", color: "text-muted-foreground" }
  const currentExt = entity ? getExt(entity.file_name) : ""
  const currentConf = FILE_ICON_STYLE[currentExt] ?? { bg: "bg-muted", color: "text-muted-foreground" }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 0, padding: 0 }}
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{isEdit ? "Editar archivo" : "Subir archivo"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Cambia el nombre o reemplaza el archivo adjunto."
              : "Adjunta un documento a esta oportunidad."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/30"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
              }}
            >
              {/* New file selected */}
              {file && (
                <div
                  className="flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", newConf.bg)}>
                    <FileTextIcon className={cn("size-4", newConf.color)} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={clearFile}>
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              )}

              {/* Edit mode — show current file (no new file yet) */}
              {!file && isEdit && entity && (
                <div
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", currentConf.bg)}>
                    <FileTextIcon className={cn("size-4", currentConf.color)} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-muted-foreground">{entity.name}</p>
                    <p className="text-xs uppercase text-muted-foreground">{currentExt}</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!file && !isEdit && (
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <UploadIcon className="size-5 text-muted-foreground" />
                </div>
              )}

              <div>
                {!file && isEdit ? (
                  <>
                    <p className="text-sm font-medium">Arrastra un archivo para reemplazar</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">o haz clic para seleccionar · opcional</p>
                  </>
                ) : !file ? (
                  <>
                    <p className="text-sm font-medium">Arrastra un archivo aquí</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">o haz clic para seleccionar</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Haz clic o arrastra otro archivo para reemplazar</p>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
            {fileError && <p className="-mt-3 text-xs text-destructive">{fileError}</p>}

            {/* Name (optional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-name">
                Nombre del documento{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="doc-name"
                placeholder={
                  file
                    ? file.name.replace(/\.[^/.]+$/, "")
                    : isEdit
                    ? entity?.name
                    : "Ej. Propuesta comercial"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {isEdit
                  ? "Si se deja vacío, se conserva el nombre actual."
                  : "Si se omite, se usará el nombre del archivo."}
              </p>
            </div>

          </div>

          <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
              {submitting
                ? isEdit ? "Guardando..." : "Subiendo..."
                : isEdit ? "Guardar cambios" : "Subir"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
