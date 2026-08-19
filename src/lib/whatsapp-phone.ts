import { COUNTRY_DIAL_CODE } from "./phone-utils"

// Normaliza un teléfono guardado en el CRM al formato que exige la API de Meta
// (E.164 sin "+" ni espacios) antes de enviar una plantilla — muchos números en la
// base están incompletos (les falta el código de país, o además el "9" móvil en
// Chile). Devuelve null cuando el número es demasiado ambiguo para completarlo con
// certeza, para bloquear el envío en vez de mandarlo a ciegas y que falle en silencio.
export function normalizeWhatsAppRecipient(rawPhone: string, countryCode: string): string | null {
  const digits = rawPhone.replace(/\D/g, "")
  if (!digits) return null

  const dialCode = (COUNTRY_DIAL_CODE[countryCode] ?? "").replace(/\D/g, "")

  if (countryCode === "CL") {
    if (digits.startsWith("56") && digits.length === 11) return digits
    if (digits.length === 9 && digits.startsWith("9")) return `56${digits}`
    if (digits.length === 8) return `569${digits}`
    return null
  }

  if (dialCode && digits.startsWith(dialCode) && digits.length >= dialCode.length + 8) {
    return digits
  }

  return null
}
