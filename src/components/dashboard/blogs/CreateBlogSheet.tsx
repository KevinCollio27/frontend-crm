"use client"

import * as React from "react"
import {
  BookOpenIcon,
  CheckIcon,
  GalleryHorizontalIcon,
  GlobeIcon,
  LayoutGridIcon,
  ListIcon,
  LoaderCircleIcon,
  NewspaperIcon,
  PaletteIcon,
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
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { blogService } from "@/services/blog.service"
import type { BlogRaw } from "@/types/blog"

// ─── Types & static data ──────────────────────────────────────────────────────

export type BlogView = "grid" | "list" | "carousel" | "magazine"
type CardSize = "small" | "medium" | "large"

export const VIEWS: { value: BlogView; label: string; hint: string; icon: React.ElementType }[] = [
  { value: "grid",     label: "Grid",     hint: "Cuadrícula uniforme",  icon: LayoutGridIcon       },
  { value: "list",     label: "Lista",    hint: "Una fila por post",    icon: ListIcon             },
  { value: "carousel", label: "Carrusel", hint: "Slider horizontal",    icon: GalleryHorizontalIcon },
  { value: "magazine", label: "Magazine", hint: "Destacado + grid",     icon: NewspaperIcon        },
]

const SIZES: { value: CardSize; label: string }[] = [
  { value: "small",  label: "Chico"   },
  { value: "medium", label: "Mediano" },
  { value: "large",  label: "Grande"  },
]

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

function parseBrandColor(raw: string | null): string {
  if (!raw) return "#6D4AFF"
  return raw.split(";")[0] || "#6D4AFF"
}

function parseLayout(raw: string | null): BlogView {
  const part = raw?.split(";").find((p) => p.startsWith("layout:"))
  const value = part?.split(":")[1] as BlogView | undefined
  return value && VIEWS.some((v) => v.value === value) ? value : "grid"
}

function parseCardSize(raw: string | null): CardSize {
  const part = raw?.split(";").find((p) => p.startsWith("size:"))
  const value = part?.split(":")[1] as CardSize | undefined
  return value && SIZES.some((s) => s.value === value) ? value : "medium"
}

function encodeBrandColor(color: string, view: BlogView, size: CardSize): string {
  return `${color};layout:${view};size:${size}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogFormValues {
  name: string
  slug: string
  defaultView: BlogView
  cardSize: CardSize
  brandColor: string
  isActive: boolean
}

interface CreateBlogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blog?: BlogFormValues
  blogId?: number
  onSuccess?: (blog: BlogRaw) => void
}

const EMPTY_FORM: BlogFormValues = {
  name: "",
  slug: "",
  defaultView: "grid",
  cardSize: "medium",
  brandColor: "#6D4AFF",
  isActive: false,
}

// ─── Shared label style ───────────────────────────────────────────────────────

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

export function CreateBlogSheet({ open, onOpenChange, blog, blogId, onSuccess }: CreateBlogSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open && (
          <BlogSheetForm
            blog={blog}
            blogId={blogId}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function BlogSheetForm({
  blog,
  blogId,
  onClose,
  onSuccess,
}: {
  blog?: BlogFormValues
  blogId?: number
  onClose: () => void
  onSuccess?: (blog: BlogRaw) => void
}) {
  const isEditing = !!blogId
  const initial = blog ?? EMPTY_FORM

  const [name, setName]             = React.useState(initial.name)
  const [slug, setSlug]             = React.useState(initial.slug)
  const [slugTouched, setSlugTouched] = React.useState(isEditing)
  const [defaultView, setDefaultView] = React.useState<BlogView>(initial.defaultView)
  const [cardSize, setCardSize]     = React.useState<CardSize>(initial.cardSize)
  const [brandColor, setBrandColor] = React.useState(initial.brandColor)
  const [isActive, setIsActive]     = React.useState(initial.isActive)
  const [submitting, setSubmitting] = React.useState(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const brandColorEncoded = encodeBrandColor(brandColor, defaultView, cardSize)
    setSubmitting(true)
    try {
      let result: BlogRaw
      if (isEditing && blogId) {
        result = await blogService.update(blogId, {
          name: name.trim(),
          brand_color: brandColorEncoded,
          is_active: isActive,
        })
        notify.info({ title: "Blog actualizado", description: `"${name.trim()}" fue actualizado.` })
      } else {
        result = await blogService.create({
          name: name.trim(),
          brand_color: brandColorEncoded,
        })
        notify.success({ title: "Blog creado", description: `"${name.trim()}" está listo para publicar artículos.` })
      }
      onSuccess?.(result)
      onClose()
    } catch {
      notify.error({ title: `No se pudo ${isEditing ? "actualizar" : "crear"} el blog`, description: "Intenta de nuevo." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>{isEditing ? "Editar Blog" : "Crear nuevo Blog"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Actualiza la configuración del blog."
              : "Crea un blog embebible para tu sitio web. Podrás copiar el código de instalación después."}
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

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <form id="create-blog-form" onSubmit={handleSubmit} className="space-y-5 p-5">
          <Section title="General" description="Nombre y dirección pública del blog." icon={BookOpenIcon}>
            <div className="space-y-1.5">
              <Label htmlFor="blog-name" className={FIELD_LABEL}>
                Nombre del Blog <span className="text-destructive">*</span>
              </Label>
              <Input
                id="blog-name"
                placeholder="ej. Blog de Producto"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blog-slug" className={FIELD_LABEL}>
                Prefijo de URL
              </Label>
              <div className="flex items-center overflow-hidden rounded-md border bg-muted/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <span className="shrink-0 px-3 text-xs text-muted-foreground select-none">
                  tudominio.com/
                </span>
                <Input
                  id="blog-slug"
                  className="border-0 bg-transparent focus-visible:ring-0"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="blog"
                />
              </div>
              <p className="text-xs text-muted-foreground">/{slug || "tu-blog"}/...</p>
            </div>
          </Section>

          <Section title="Apariencia" description="Cómo se ven los posts embebidos en tu sitio." icon={PaletteIcon}>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Vista por defecto</Label>
              <div className="grid grid-cols-2 gap-2">
                {VIEWS.map((v) => {
                  const active = defaultView === v.value
                  const Icon = v.icon
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setDefaultView(v.value)}
                      className={cn(
                        "relative rounded-md border p-3 text-left transition-colors",
                        active ? "border-primary bg-primary/5" : "hover:border-foreground/30"
                      )}
                    >
                      {active && (
                        <CheckIcon className="absolute top-2 right-2 size-3.5 text-primary" />
                      )}
                      <Icon className="mb-2 size-4 text-foreground" />
                      <div className="text-sm font-medium">{v.label}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{v.hint}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Tamaño de Card</Label>
              <div className="flex gap-2">
                {SIZES.map((s) => {
                  const active = cardSize === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setCardSize(s.value)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary/5 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blog-color" className={FIELD_LABEL}>
                Color de Marca
              </Label>
              <div className="flex items-center gap-3">
                <label
                  className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-md border"
                  style={{ backgroundColor: brandColor }}
                >
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <Input
                  id="blog-color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </Section>

          <Section title="Estado" description="Visibilidad pública del blog." icon={GlobeIcon}>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Estado</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isActive ? "Visible públicamente" : "Oculto, solo borrador"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {isActive ? "Activo" : "Borrador"}
                </span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
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
        <Button type="submit" form="create-blog-form" disabled={!name.trim() || submitting}>
          {submitting && <LoaderCircleIcon className="mr-1 size-4 animate-spin" />}
          {isEditing ? "Guardar" : "Crear Blog"}
        </Button>
      </div>
    </>
  )
}

// ─── Helpers exportados para BlogManager ──────────────────────────────────────

export function blogRawToFormValues(blog: BlogRaw): BlogFormValues {
  return {
    name: blog.name,
    slug: slugify(blog.name),
    defaultView: parseLayout(blog.brand_color),
    cardSize: parseCardSize(blog.brand_color),
    brandColor: parseBrandColor(blog.brand_color),
    isActive: blog.is_active,
  }
}
