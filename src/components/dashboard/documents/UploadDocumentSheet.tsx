"use client"

import * as React from "react"
import {
  FolderOpenIcon,
  GlobeIcon,
  HardDriveIcon,
  InfoIcon,
  Link2Icon,
  LinkIcon,
  LoaderCircleIcon,
  LockIcon,
  ShieldIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { documentService } from "@/services/document.service"

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Contrato / Acuerdo",
  "Propuesta Comercial",
  "Factura",
  "Cotización",
  "Presentación",
  "Informe / Reporte",
  "Manual / Guía",
  "Certificado",
  "Formulario",
  "Identificación",
  "Otro",
]

const ACCEPTED_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mov,.avi"
const MAX_SIZE_MB = 25
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentToEdit {
  id: number
  name: string
  description: string
  category: string
  visibility: string
}

interface UploadDocumentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialDoc?: DocumentToEdit
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadDocumentSheet({ open, onOpenChange, onSuccess, initialDoc }: UploadDocumentSheetProps) {
  const isEditMode = !!initialDoc

  const [mode, setMode]             = React.useState<"file" | "url">("file")
  const [file, setFile]             = React.useState<File | null>(null)
  const [url, setUrl]               = React.useState("")
  const [isDragging, setIsDragging] = React.useState(false)
  const [sizeError, setSizeError]   = React.useState(false)
  const [docName, setDocName]       = React.useState("")
  const [category, setCategory]     = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isPrivate, setIsPrivate]   = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)

  // Pre-fill form when opening in edit mode
  React.useEffect(() => {
    if (open && isEditMode && initialDoc) {
      setDocName(initialDoc.name)
      setDescription(initialDoc.description)
      setCategory(initialDoc.category)
      setIsPrivate(initialDoc.visibility !== "public")
    }
  }, [open, isEditMode]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFile(incoming: File) {
    if (incoming.size > MAX_SIZE_BYTES) {
      setSizeError(true)
      return
    }
    setSizeError(false)
    setFile(incoming)
    if (!docName) setDocName(incoming.name.replace(/\.[^/.]+$/, ""))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  function handleClose() {
    onOpenChange(false)
    setMode("file")
    setFile(null)
    setUrl("")
    setIsDragging(false)
    setSizeError(false)
    setDocName("")
    setCategory("")
    setDescription("")
    setIsPrivate(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!docName) return
    if (!isEditMode) {
      if (mode === "file" && !file) return
      if (mode === "url" && !url) return
    }

    setSubmitting(true)
    try {
      if (isEditMode && initialDoc) {
        await documentService.update(initialDoc.id, {
          name: docName,
          description: description || null,
          category: category || null,
          visibility: isPrivate ? "private" : "public",
        })
        notify.success({ title: "Documento actualizado", description: "Los cambios se guardaron correctamente." })
      } else if (mode === "file") {
        const base64File = await fileToBase64(file!)
        const ext = file!.name.split(".").pop()?.toLowerCase() ?? ""
        await documentService.create({
          name: docName,
          description: description || undefined,
          category: category || undefined,
          visibility: isPrivate ? "private" : "public",
          isExternal: false,
          extension: ext,
          fileSize: file!.size,
          base64File,
        })
        notify.success({ title: "Documento guardado", description: "El documento está disponible en la lista." })
      } else {
        await documentService.create({
          name: docName,
          description: description || undefined,
          category: category || undefined,
          visibility: isPrivate ? "private" : "public",
          isExternal: true,
          externalUrl: url,
          extension: "link",
          fileSize: 0,
        })
        notify.success({ title: "Documento guardado", description: "El documento está disponible en la lista." })
      }
      onSuccess?.()
      handleClose()
    } catch {
      notify.error({ title: `No se pudo ${isEditMode ? "actualizar" : "guardar"} el documento`, description: "Intenta de nuevo." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            <SheetTitle>{isEditMode ? "Editar Documento" : "Subir Documento"}</SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Modifica los metadatos del documento."
                : "Agrega un archivo o un acceso a la nube para digitalizar tu CRM de negocios."}
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form id="upload-doc-form" onSubmit={handleSubmit} className="space-y-5 p-5">

            {/* ── Origen del documento (solo en create mode) ── */}
            {!isEditMode && (
              <Section
                title="Origen del Documento"
                description="Sube un archivo o pega el enlace de un documento en la nube."
                icon={FolderOpenIcon}
              >
                <div className="grid grid-cols-2 overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setMode("file")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      mode === "file"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <HardDriveIcon className="size-4 shrink-0" />
                    Archivo Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("url")}
                    className={cn(
                      "flex items-center justify-center gap-2 border-l px-3 py-2.5 text-sm font-medium transition-colors",
                      mode === "url"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Link2Icon className="size-4 shrink-0" />
                    Enlace de Nube / URL
                  </button>
                </div>

                {/* ── Archivo / Enlace ── */}
                <p className={FIELD_LABEL}>{mode === "file" ? "Archivo o Documento" : "Enlace"}</p>

                {mode === "file" ? (
                  <>
                    <input
                      ref={inputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFile(f)
                        e.target.value = ""
                      }}
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => inputRef.current?.click()}
                      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "flex cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                        isDragging
                          ? "border-ring bg-muted/50"
                          : file
                          ? "border-ring/40 bg-muted/30"
                          : "border-input hover:border-muted-foreground/40 hover:bg-muted/20"
                      )}
                    >
                      <UploadCloudIcon
                        className={cn(
                          "size-9 transition-colors",
                          file ? "text-primary" : "text-muted-foreground/40"
                        )}
                      />
                      {file ? (
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB · haz clic para cambiar
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            Arrastra un archivo o haz clic para seleccionar
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, Word, Excel, PowerPoint, Imágenes, Videos (máx. {MAX_SIZE_MB} MB)
                          </p>
                        </div>
                      )}
                    </div>
                    {sizeError && (
                      <p className="text-xs text-destructive">
                        El archivo supera los {MAX_SIZE_MB} MB permitidos.
                      </p>
                    )}
                  </>
                ) : (
                  <InputGroup>
                    <InputGroupAddon>
                      <LinkIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </InputGroup>
                )}
              </Section>
            )}

            <Section title="Información Básica" description="Nombre, categoría y detalles del documento." icon={InfoIcon}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="doc-name" className={FIELD_LABEL}>
                    Nombre del Documento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="doc-name"
                    placeholder="Ej. Ficha de Registro de Proveedores"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Categoría</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                    <SelectTrigger className="w-full" aria-label="Categoría">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-description" className={FIELD_LABEL}>Descripción</Label>
                <Textarea
                  id="doc-description"
                  placeholder="Añade detalles del documento, notas importantes, versiones o vigencias..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </Section>

            <Section title="Control de Acceso" description="Quién puede ver este documento." icon={ShieldIcon}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {isPrivate ? (
                    <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <GlobeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {isPrivate ? "Privado" : "Público"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isPrivate
                        ? "Solo visible para ti. Actívalo para compartirlo con el equipo."
                        : "Visible para todo el equipo en la lista de documentos del CRM."}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(!checked)}
                />
              </div>
            </Section>

          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="upload-doc-form" disabled={submitting}>
            {submitting && <LoaderCircleIcon className="mr-1 size-4 animate-spin" />}
            {isEditMode
              ? (submitting ? "Guardando..." : "Guardar cambios")
              : (submitting ? "Guardando..." : mode === "file" ? "Guardar documento" : "Guardar enlace")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
