"use client"

import * as React from "react"
import { LoaderCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { interestService } from "@/services/interest.service"
import { notify } from "@/lib/notify"
import type { PersonInterestRaw } from "@/types/interest"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: number
  nextOrder: number
  interest?: PersonInterestRaw
  onSuccess?: () => void
}

export function InterestSheet({ open, onOpenChange, contactId, nextOrder, interest, onSuccess }: Props) {
  const isEdit = !!interest

  const [description, setDescription] = React.useState("")
  const [submitting, setSubmitting]   = React.useState(false)
  const [error, setError]             = React.useState("")

  React.useEffect(() => {
    if (open) {
      setDescription(interest?.description ?? "")
      setError("")
    }
  }, [open, interest])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError("La descripción es requerida."); return }
    setSubmitting(true)
    const t0 = Date.now()
    try {
      if (isEdit && interest) {
        console.log(`[interests-contact] update start id=${interest.id}`)
        await interestService.update(interest.id, { description: description.trim() })
        console.log(`[interests-contact] update OK → ${Date.now() - t0}ms`)
        notify.info({ title: "Interés actualizado", description: `"${description.trim()}" fue actualizado.` })
      } else {
        console.log(`[interests-contact] create start contactId=${contactId}`)
        await interestService.create({
          description:  description.trim(),
          person_id:    contactId,
          order_number: nextOrder,
        })
        console.log(`[interests-contact] create OK → ${Date.now() - t0}ms`)
        notify.success({ title: "Interés creado", description: `"${description.trim()}" se agregó correctamente.` })
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
        style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 0, padding: 0 }}
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{isEdit ? "Editar interés" : "Nuevo interés"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="interest-desc">Descripción</Label>
              <Input
                id="interest-desc"
                placeholder="Ej. Reducir costos de logística"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setError("") }}
                autoComplete="off"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
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
              {isEdit ? "Guardar cambios" : "Agregar interés"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
