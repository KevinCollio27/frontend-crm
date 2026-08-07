"use client"

import * as React from "react"
import {
  CheckIcon,
  FileTextIcon,
  Loader2Icon,
  LoaderCircleIcon,
  SendIcon,
  TagIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { blogService } from "@/services/blog.service"
import { PostEditor } from "./PostEditor"

// ─── Types ────────────────────────────────────────────────────────────────────

type PostStatus = "draft" | "published"

export interface PostFormValues {
  title: string
  slug: string
  thumbnailUrl: string
  tags: string[]
  content: string
  status: PostStatus
}

interface CreatePostSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blogId: number
  post?: PostFormValues
  postId?: number
  loading?: boolean
  onSuccess?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: "draft",     label: "Borrador"  },
  { value: "published", label: "Publicado" },
]

const EMPTY_FORM: PostFormValues = {
  title: "",
  slug: "",
  thumbnailUrl: "",
  tags: [],
  content: "",
  status: "draft",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

export function CreatePostSheet({ open, onOpenChange, blogId, post, postId, loading, onSuccess }: CreatePostSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open &&
          (loading ? (
            <LoadingState onClose={() => onOpenChange(false)} />
          ) : (
            <PostSheetForm
              post={post}
              postId={postId}
              blogId={blogId}
              onClose={() => onOpenChange(false)}
              onSuccess={onSuccess}
            />
          ))}
      </SheetContent>
    </Sheet>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin" />
      <span className="text-sm">Cargando post...</span>
      <Button type="button" variant="ghost" size="sm" onClick={onClose}>
        Cancelar
      </Button>
    </div>
  )
}

// ─── Thumbnail upload zone ────────────────────────────────────────────────────

function ThumbnailUpload({
  blogId,
  value,
  onChange,
}: {
  blogId: number
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = React.useState(false)
  const [dragging, setDragging]   = React.useState(false)
  // Local blob URL for preview — backend returns S3 key, not a displayable URL
  const [previewSrc, setPreviewSrc] = React.useState<string>(() =>
    value.startsWith("http") ? value : ""
  )
  const inputRef = React.useRef<HTMLInputElement>(null)
  const blobRef  = React.useRef<string>("")

  // If value comes in as a full URL (editing mode), sync preview
  React.useEffect(() => {
    if (value.startsWith("http")) setPreviewSrc(value)
    if (!value) setPreviewSrc("")
  }, [value])

  React.useEffect(() => {
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current) }
  }, [])

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      notify.error({ title: "Solo se permiten imágenes", description: "Sube un archivo PNG, JPG o WEBP." })
      return
    }
    // Preview local inmediato
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    const blob = URL.createObjectURL(file)
    blobRef.current = blob
    setPreviewSrc(blob)

    setUploading(true)
    try {
      const base64 = await fileToBase64(file)
      const key    = await blogService.uploadThumbnail(blogId, file.name, base64)
      onChange(key)
    } catch {
      notify.error({ title: "No se pudo subir la imagen", description: "Intenta de nuevo o usa una URL." })
      setPreviewSrc("")
      onChange("")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleClear() {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = "" }
    setPreviewSrc("")
    onChange("")
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer select-none items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors",
        dragging
          ? "border-ring bg-muted/50"
          : previewSrc
          ? "border-ring/40 bg-muted/20"
          : "border-input hover:border-muted-foreground/40 hover:bg-muted/20"
      )}
    >
      {/* Thumbnail preview o ícono */}
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" className="size-full object-cover" />
        ) : uploading ? (
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloudIcon className="size-5 text-muted-foreground/50" />
        )}
      </div>

      {/* Texto */}
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

      {/* Limpiar */}
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
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
      />
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function PostSheetForm({
  post,
  postId,
  blogId,
  onClose,
  onSuccess,
}: {
  post?: PostFormValues
  postId?: number
  blogId: number
  onClose: () => void
  onSuccess?: () => void
}) {
  const isEditing = !!postId
  const initial   = post ?? EMPTY_FORM

  const [title, setTitle]         = React.useState(initial.title)
  const [slug, setSlug]           = React.useState(initial.slug)
  const [slugTouched, setSlugTouched] = React.useState(isEditing)
  const [thumbnailUrl, setThumbnailUrl] = React.useState(initial.thumbnailUrl)
  const [tags, setTags]           = React.useState<string[]>(initial.tags)
  const [tagInput, setTagInput]   = React.useState("")
  const [content, setContent]     = React.useState(initial.content)
  const [status, setStatus]       = React.useState<PostStatus>(initial.status)
  const [submitting, setSubmitting] = React.useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(slugify(value))
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault()
      const value = tagInput.trim()
      if (!tags.includes(value)) setTags((prev) => [...prev, value])
      setTagInput("")
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title:         title.trim(),
      content,
      thumbnail_url: thumbnailUrl || null,
      tags:          tags.join(",") || null,
      is_published:  status === "published",
    }

    setSubmitting(true)
    try {
      if (isEditing && postId) {
        await blogService.updatePost(blogId, postId, payload)
        notify.info({ title: "Post actualizado", description: `"${title.trim()}" fue actualizado.` })
      } else {
        await blogService.createPost(blogId, payload)
        notify.success({ title: "Post creado", description: `"${title.trim()}" fue creado.` })
      }
      onSuccess?.()
      onClose()
    } catch {
      notify.error({ title: `No se pudo ${isEditing ? "actualizar" : "crear"} el post`, description: "Intenta de nuevo." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>{isEditing ? "Editar Post" : "Nuevo Post"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Actualiza el contenido del post." : "Escribe un nuevo post para tu blog."}
          </SheetDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <XIcon />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <form id="create-post-form" onSubmit={handleSubmit} className="space-y-5 p-5">

          <Section title="Contenido" description="Título, imagen y texto del post." icon={FileTextIcon}>
            <div className="space-y-1.5">
              <Label htmlFor="post-title" className={FIELD_LABEL}>
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="post-title"
                placeholder="ej. Cómo optimizar tu flota en 2026"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-slug" className={FIELD_LABEL}>Slug</Label>
              <div className="flex items-center overflow-hidden rounded-md border bg-muted/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <span className="shrink-0 px-3 text-xs text-muted-foreground select-none">/blog/</span>
                <Input
                  id="post-slug"
                  className="border-0 bg-transparent focus-visible:ring-0"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="titulo-del-post"
                  disabled={status === "published"}
                />
              </div>
              {status === "published" && (
                <p className="text-xs text-muted-foreground">
                  El slug queda bloqueado una vez publicado para no romper el enlace.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Imagen Destacada</Label>
              <ThumbnailUpload blogId={blogId} value={thumbnailUrl} onChange={setThumbnailUrl} />
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Contenido</Label>
              <PostEditor value={content} onChange={setContent} />
            </div>
          </Section>

          <Section title="SEO" description="Palabras clave para mejorar el posicionamiento." icon={TagIcon}>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Etiquetas</Label>
              <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 text-xs font-medium"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={tags.length ? "" : "Escribe y presiona Enter o coma..."}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se usan como categoría visible y palabras clave SEO.
              </p>
            </div>
          </Section>

          <Section title="Publicación" description="Visibilidad del post en tu blog." icon={SendIcon}>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Estado</Label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const active = status === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        "relative flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary/5 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {active && <CheckIcon className="absolute top-1.5 right-1.5 size-3.5 text-primary" />}
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" form="create-post-form" disabled={!title.trim() || submitting}>
          {submitting && <LoaderCircleIcon className="mr-1 size-4 animate-spin" />}
          {isEditing ? "Guardar" : "Crear Post"}
        </Button>
      </div>
    </>
  )
}
