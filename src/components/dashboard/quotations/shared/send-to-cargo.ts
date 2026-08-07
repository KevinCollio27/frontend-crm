import { quotationConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { integrationService } from "@/services/integration.service"
import type { QuotationRaw } from "@/types/quotation"

const LEGACY_STATUS: Record<string, string> = {
  borrador: "draft", enviada: "sent", aceptada: "accepted", rechazada: "rejected",
}

// "Enviar a Cargo" solo tiene sentido una vez que el cliente aceptó la cotización.
export function isAcceptedStatus(status: string): boolean {
  return (LEGACY_STATUS[status] ?? status) === "accepted"
}

// Confirma con el usuario y envía — devuelve true si se envió con éxito (para que el
// caller actualice is_sent_to_cargo en su estado local sin tener que refetchear).
export async function confirmAndSendToCargo(quotation: QuotationRaw, cargoIntegrationId: number): Promise<boolean> {
  const confirmed = await quotationConfirm.sendToCargo()
  if (!confirmed) return false

  const pendingId = notify.info({
    title:       "Enviando a Cargo",
    description: "Procesando el envío...",
    duration:    Infinity,
  })

  try {
    await integrationService.sendQuotationToCargo({
      integrationId: cargoIntegrationId,
      quotationId:   quotation.id,
      productId:     quotation.product?.id,
      productName:   quotation.product?.name,
      sku:           quotation.sku ?? undefined,
    })
    notify.dismiss(pendingId)
    notify.success({
      title:       "Enviado a Cargo",
      description: "Ya está disponible en la gestión operacional.",
    })
    return true
  } catch (error) {
    notify.dismiss(pendingId)
    notify.error({
      title:       "No se pudo enviar a Cargo",
      description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
    })
    return false
  }
}
