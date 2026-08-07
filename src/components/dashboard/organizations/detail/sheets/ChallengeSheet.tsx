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
import { orgChallengeService, type OrgChallengeRaw } from "@/services/organizationChallenge.service"
import { notify } from "@/lib/notify"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: number
  nextOrder: number
  challenge?: OrgChallengeRaw
  onSuccess?: () => void
}

export function ChallengeSheet({ open, onOpenChange, orgId, nextOrder, challenge, onSuccess }: Props) {
  const isEdit = !!challenge

  const [description, setDescription] = React.useState("")
  const [submitting, setSubmitting]   = React.useState(false)
  const [error, setError]             = React.useState("")

  React.useEffect(() => {
    if (open) {
      setDescription(challenge?.description ?? "")
      setError("")
    }
  }, [open, challenge])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError("La descripción es requerida."); return }
    setSubmitting(true)
    try {
      if (isEdit && challenge) {
        await orgChallengeService.update(challenge.id, { description: description.trim() })
        notify.info({ title: "Desafío actualizado", description: `"${description.trim()}" fue actualizado.` })
      } else {
        await orgChallengeService.create({
          description:     description.trim(),
          organization_id: orgId,
          order_number:    nextOrder,
        })
        notify.success({ title: "Desafío creado", description: `"${description.trim()}" se agregó correctamente.` })
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
          <SheetTitle>{isEdit ? "Editar desafío" : "Nuevo desafío"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="challenge-desc">Descripción</Label>
              <Input
                id="challenge-desc"
                placeholder="Ej. Reducir tiempo de respuesta al cliente"
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
              {isEdit ? "Guardar cambios" : "Agregar desafío"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
