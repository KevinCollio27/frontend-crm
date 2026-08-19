import type { MetaConfigRaw } from "@/types/whatsapp"

// Único lugar donde vive el criterio de "¿el número puede enviar/recibir ahora?" —
// lo usa tanto el detalle de la integración (WhatsAppIntegrationSheet) como cualquier
// gate rápido en otras pantallas (ej. "Enviar Plantilla" en Contactos), para que no
// terminen desalineados con el tiempo.

const BLOCKING_STATUSES = new Set(["DISCONNECTED", "MIGRATED", "BANNED", "RESTRICTED"])

export function hasWhatsAppBlockingIssue(config: MetaConfigRaw): boolean {
  const status = (config.status || "").toUpperCase()
  const verification = (config.code_verification_status || "").toUpperCase()
  return (status !== "" && BLOCKING_STATUSES.has(status)) || (verification !== "" && verification !== "VERIFIED")
}

export function isWhatsAppOperational(config: MetaConfigRaw | null): boolean {
  if (!config || !config.meta_live) return false
  const status = (config.status || "").toUpperCase()
  const verification = (config.code_verification_status || "").toUpperCase()
  const connectedOk = status === "CONNECTED" || (!status && verification === "VERIFIED")
  return connectedOk && !hasWhatsAppBlockingIssue(config)
}
