import * as React from "react"
import { whatsappService } from "@/services/whatsapp.service"
import { isWhatsAppOperational } from "@/lib/whatsapp-status"
import { useActiveIntegration } from "@/hooks/useActiveIntegration"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"

// Centraliza el chequeo de "¿puedo mostrar Enviar Plantilla / Enviar Correo en esta
// fila?" — lo usan ContactsTable y FunnelTable (y cualquier otra tabla que sume estos
// accesos rápidos), así el fetch de WhatsApp/Gmail no se repite en cada una.
export function useSendActions() {
  const [approvedTemplates, setApprovedTemplates] = React.useState<WhatsappTemplateRaw[]>([])

  React.useEffect(() => {
    Promise.all([
      whatsappService.getMetaConfig().catch(() => null),
      whatsappService.getCachedTemplates({ status: "APPROVED" }).catch(() => ({ templates: [], total: 0, lastSyncedAt: null })),
    ]).then(([config, templatesRes]) => {
      setApprovedTemplates(isWhatsAppOperational(config) ? templatesRes.templates : [])
    })
  }, [])

  const { connection: gmailConnection } = useActiveIntegration("gmail")

  return {
    canSendTemplate: approvedTemplates.length > 0,
    approvedTemplates,
    gmailConnection,
  }
}
