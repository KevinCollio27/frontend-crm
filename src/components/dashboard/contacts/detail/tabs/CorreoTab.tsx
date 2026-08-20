"use client"

import { Loader2Icon } from "lucide-react"
import { useActiveIntegration } from "@/hooks/useActiveIntegration"
import { EmailComposer, NoGmailConnected } from "../../shared/EmailComposer"

// ─── Component ────────────────────────────────────────────────────────────────

// El envío es real (Gmail vía integración del workspace, firma real, adjuntos). Lo que
// falta es el registro de seguimiento (historial de correos por contacto) — a diferencia
// de Oportunidad, opportunity_email exige opportunity_id y un contacto no siempre tiene
// una oportunidad asociada, así que por ahora no queda historial acá. Se suma después.
//
// Esta pestaña todavía solo conoce el correo "principal" del contacto
// (ContactDetailData.email es singular) — a diferencia de "Enviar Correo" desde
// la fila de la tabla, que sí precarga todos los correos del contacto.
interface Props {
  contactId:    number
  contactName:  string | null
  contactEmail: string | null
}

export function CorreoTab({ contactId: _, contactName, contactEmail }: Props) {
  const { connection: gmail, loading } = useActiveIntegration("gmail")

  return (
    <div className="flex flex-col gap-4 p-4">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !gmail ? (
        <NoGmailConnected />
      ) : (
        <EmailComposer
          connectionId={gmail.id}
          userEmail={gmail.account_email ?? ""}
          contactEmails={contactEmail ? [contactEmail] : []}
          contactName={contactName}
        />
      )}
    </div>
  )
}
