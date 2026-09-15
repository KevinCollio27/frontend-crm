import type { MetaConfigRaw } from "@/types/whatsapp"

// Único lugar donde vive el criterio de "¿el número puede enviar/recibir ahora?" —
// lo usa tanto el detalle de la integración (WhatsAppIntegrationSheet) como cualquier
// gate rápido en otras pantallas (ej. "Enviar Plantilla" en Contactos), para que no
// terminen desalineados con el tiempo.

const BLOCKING_STATUSES = new Set(["DISCONNECTED", "MIGRATED", "BANNED", "RESTRICTED"])

// code_verification_status queda "no verificado" indefinidamente en varios números
// conectados por Embedded Signup o migrados desde otro flujo, aunque envíen y reciban
// mensajes sin problema (falso negativo conocido de la Cloud API) — por eso no cuenta
// como bloqueo duro acá, solo como advertencia informativa (ver reasons en el sheet).
export function hasWhatsAppBlockingIssue(config: MetaConfigRaw): boolean {
  const status = (config.status || "").toUpperCase()
  return status !== "" && BLOCKING_STATUSES.has(status)
}

export function isWhatsAppOperational(config: MetaConfigRaw | null): boolean {
  if (!config || !config.meta_live) return false
  const status = (config.status || "").toUpperCase()
  const verification = (config.code_verification_status || "").toUpperCase()
  const connectedOk = status === "CONNECTED" || (!status && verification === "VERIFIED")
  return connectedOk && !hasWhatsAppBlockingIssue(config)
}
