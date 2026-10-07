"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { InfoIcon, ListPlusIcon, Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/notify"
import { blogService } from "@/services/blog.service"
import type { BlogRaw } from "@/types/blog"

const MAX_LENGTH = 8000

const GUIDE_TEMPLATE = `Público:
Tono:
Temas que sí:
Temas que no:
Largo:
Estructura:
Reglas:
Etiquetas: `

const schema = z.object({
  guide: z.string().trim().max(MAX_LENGTH, `Máximo ${MAX_LENGTH} caracteres`),
})

type FormValues = z.infer<typeof schema>

type GuideBlog = Pick<BlogRaw, "id" | "name" | "editorial_guide">

interface EditorialGuideSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blog: GuideBlog
  onSaved: (guide: string | null) => void
}

export function EditorialGuideSheet({ open, onOpenChange, blog, onSaved }: EditorialGuideSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 560, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && <EditorialGuideForm blog={blog} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
      </SheetContent>
    </Sheet>
  )
}

function EditorialGuideForm({ blog, onClose, onSaved }: { blog: GuideBlog; onClose: () => void; onSaved: (guide: string | null) => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { guide: blog.editorial_guide ?? "" },
  })
  const { errors, isSubmitting } = form.formState
  const guide = form.watch("guide")

  async function onSubmit(values: FormValues) {
    const next = values.guide || null
    try {
      await blogService.update(blog.id, { editorial_guide: next })
      notify.success({
        title: next ? "Guía editorial guardada" : "Guía editorial eliminada",
        description: next ? `Los asistentes la seguirán al escribir en "${blog.name}".` : `"${blog.name}" ya no tiene guía editorial.`,
      })
      onSaved(next)
      onClose()
    } catch (error) {
      const description = (error as { message?: string })?.message || "No se pudo guardar la guía editorial."
      notify.error({ title: "Algo salió mal", description })
    }
  }

  return (
    <>
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>Guía editorial</SheetTitle>
          <SheetDescription>Cómo se escribe en &quot;{blog.name}&quot;.</SheetDescription>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
          <XIcon />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form id="editorial-guide-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5">
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/20">
            <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-purple-700 uppercase dark:text-purple-400">
              <InfoIcon className="size-3" /> Para qué sirve
            </p>
            <p className="text-sm">
              Los asistentes de IA conectados al CRM leen esta guía antes de escribir un post en este blog. Así
              mantienen el mismo público, tono y reglas sin que tengas que repetirlo en cada instrucción. Si la
              dejas vacía, se guían por el estilo de los posts ya publicados.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="editorial-guide">Guía</Label>
              {!guide.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => form.setValue("guide", GUIDE_TEMPLATE, { shouldDirty: true })}
                >
                  <ListPlusIcon className="size-3.5" /> Usar esquema
                </Button>
              )}
            </div>
            <Textarea
              id="editorial-guide"
              rows={16}
              placeholder={"Ej.\nPúblico: dueños de PyMEs chilenas.\nTono: directo, de tú, sin tecnicismos.\nLargo: entre 600 y 900 palabras.\nReglas: no inventar cifras ni nombrar competidores."}
              className="min-h-72"
              aria-invalid={!!errors.guide}
              {...form.register("guide")}
            />
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {errors.guide
                ? <p className="text-destructive">{errors.guide.message}</p>
                : <p>Texto libre: escríbela como se la explicarías a un redactor nuevo.</p>}
              <span className="shrink-0 tabular-nums">{guide.length} / {MAX_LENGTH}</span>
            </div>
          </div>
        </form>
      </div>

      <div className="flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" form="editorial-guide-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </>
  )
}
