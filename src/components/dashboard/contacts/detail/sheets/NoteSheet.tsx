"use client"

import * as React from "react"
import { LoaderCircleIcon } from "lucide-react"
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
import { PostEditor } from "@/components/dashboard/blogs/PostEditor"
import { noteService } from "@/services/note.service"
import { notify } from "@/lib/notify"
import type { NoteRaw } from "@/types/note"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: number
  note?: NoteRaw
  onSuccess?: () => void
}

export function NoteSheet({ open, onOpenChange, contactId, note, onSuccess }: Props) {
  const isEdit = !!note

  const [title, setTitle]           = React.useState("")
  const [content, setContent]       = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors]         = React.useState<{ title?: string; content?: string }>({})

  React.useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "")
      setContent(note?.content ?? "")
      setErrors({})
    }
  }, [open, note])

  function validate() {
    const e: typeof errors = {}
    if (!title.trim()) e.title = "El título es requerido."
    if (!content.trim() || content === "<p></p>") e.content = "El contenido es requerido."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const t0 = Date.now()
    try {
      if (isEdit && note) {
        console.log(`[notes-contact] update start id=${note.id}`)
        await noteService.update(note.id, { title: title.trim(), content })
        console.log(`[notes-contact] update OK → ${Date.now() - t0}ms`)
        notify.info({ title: "Nota actualizada", description: `"${title.trim()}" fue actualizada.` })
      } else {
        console.log(`[notes-contact] create start contactId=${contactId}`)
        await noteService.create({ title: title.trim(), content, person_id: contactId })
        console.log(`[notes-contact] create OK → ${Date.now() - t0}ms`)
        notify.success({ title: "Nota creada", description: `"${title.trim()}" se creó correctamente.` })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch {
      // no-op
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{ maxWidth: 540, display: "flex", flexDirection: "column", gap: 0, padding: 0 }}
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{isEdit ? "Editar nota" : "Nueva nota"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica el título o el contenido de la nota."
              : "Agrega una nota sobre este contacto."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-title">Título</Label>
              <Input
                id="note-title"
                placeholder="Ej. Reunión de seguimiento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Contenido</Label>
              <PostEditor
                value={content}
                onChange={setContent}
                placeholder="Escribe los detalles de la nota..."
              />
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
            </div>

          </div>

          <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear nota"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
