"use client"

import * as React from "react"
import { MailIcon, PlusIcon, UserPlusIcon, XIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { teamService } from "@/services/team.service"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface InviteUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InviteUserSheet({ open, onOpenChange, onSuccess }: InviteUserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 460, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open && <InviteForm onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </SheetContent>
    </Sheet>
  )
}

function InviteForm({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [emails, setEmails] = React.useState<string[]>([""])
  const [errors, setErrors] = React.useState<string[]>([""])
  const [submitting, setSubmitting] = React.useState(false)

  function updateEmail(index: number, value: string) {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)))
    setErrors((prev) => prev.map((e, i) => (i === index ? "" : e)))
  }

  function addEmail() {
    setEmails((prev) => [...prev, ""])
    setErrors((prev) => [...prev, ""])
  }

  function removeEmail(index: number) {
    setEmails((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => prev.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const next = emails.map((e) => {
      if (!e.trim()) return "Falta el correo"
      return EMAIL_REGEX.test(e.trim()) ? "" : "Correo inválido"
    })
    setErrors(next)
    return next.every((e) => e === "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const validEmails = emails.map((e) => e.trim()).filter(Boolean)
    setSubmitting(true)
    try {
      await teamService.inviteUsers(validEmails)
      notify.success({
        title: validEmails.length > 1 ? `${validEmails.length} invitaciones enviadas` : "Invitación enviada",
        description: "Se envió el correo de invitación correctamente.",
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      const description = (error as { message?: string })?.message || "No se pudieron enviar las invitaciones."
      notify.error({ title: "Algo salió mal", description })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>Invitar</SheetTitle>
          <SheetDescription>Invita a más personas a tu workspace.</SheetDescription>
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
        <form id="invite-user-form" onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserPlusIcon className="size-4 text-muted-foreground" />
            Invitar con e-mail
          </div>

          <div className="space-y-2.5">
            {emails.map((email, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MailIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value)}
                      className={cn(
                        "pl-9",
                        errors[index] &&
                          "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25"
                      )}
                    />
                  </div>
                  {emails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeEmail(index)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Quitar correo"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  )}
                </div>
                {errors[index] && <p className="text-xs text-destructive">{errors[index]}</p>}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addEmail}>
            <PlusIcon className="size-4" /> Añadir correo
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" form="invite-user-form" disabled={submitting}>
          {submitting && <Loader2Icon className="size-4 animate-spin" />}
          Enviar invitaciones
        </Button>
      </div>
    </>
  )
}
