"use client"

import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { EmailComposer } from "./shared/EmailComposer"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: number
  userEmail: string
  contactEmails: string[]
  contactName: string
  // Si se abre desde una oportunidad, el backend registra el envío automáticamente
  // (log + opportunity_email) — desde un contacto suelto se omite, queda sin rastro.
  opportunityId?: number
}

export function SendEmailSheet({ open, onOpenChange, connectionId, userEmail, contactEmails, contactName, opportunityId }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full!" style={{ maxWidth: 640, padding: 0, gap: 0 }}>
        {open && (
          <div className="flex h-full flex-col">
            <div className="border-b px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <SheetTitle>Enviar Correo</SheetTitle>
                  <SheetDescription>Redacta y envía un correo a {contactName} desde tu cuenta de Gmail conectada.</SheetDescription>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={() => onOpenChange(false)} aria-label="Cerrar">
                  <XIcon />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <EmailComposer
                connectionId={connectionId}
                userEmail={userEmail}
                contactEmails={contactEmails}
                contactName={contactName}
                opportunityId={opportunityId}
                onSent={() => onOpenChange(false)}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
