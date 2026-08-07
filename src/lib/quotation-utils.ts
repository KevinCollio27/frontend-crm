export function generateQuotationCode(
  organizationId: number | null | undefined,
  quotationId:    number | null | undefined,
): string {
  const orgPart  = String(organizationId ?? 0).padStart(4, "0")
  const quotPart = String(quotationId    ?? 0).padStart(4, "0")
  return `${orgPart}-${quotPart}`
}
