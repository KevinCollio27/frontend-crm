import type { WhatsappTemplateRaw } from "@/types/whatsapp"

export function parseVarCount(bodyText: string): number {
  const matches = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)]
  if (matches.length === 0) return 0
  return Math.max(...matches.map((m) => parseInt(m[1]!)))
}

export function bodyTextOf(template: WhatsappTemplateRaw): string {
  if (template.body_text) return template.body_text
  return template.components?.find((c) => c.type === "BODY")?.text ?? ""
}

export function previewBody(bodyText: string, vars: Record<number, string>): string {
  return bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => vars[parseInt(n)] || `{{${n}}}`)
}
