import type { OrganizationDuplicateCandidate } from "@/types/organization"

export const MERGEABLE_FIELDS = [
  "document_number",
  "web_page",
  "industry",
  "pais_origen",
  "linkedin_url",
  "instagram_url",
  "twitter_url",
  "facebook_url",
] as const

export type MergeableField = (typeof MERGEABLE_FIELDS)[number]

export const FIELD_LABELS: Record<MergeableField, string> = {
  document_number: "RUT",
  web_page: "Sitio web",
  industry: "Industria",
  pais_origen: "País",
  linkedin_url: "LinkedIn",
  instagram_url: "Instagram",
  twitter_url: "Twitter",
  facebook_url: "Facebook",
}

function hasValue(v: string | null | undefined): v is string {
  return !!v && v.trim() !== ""
}

export function completenessScore(org: OrganizationDuplicateCandidate): number {
  const fieldScore = MERGEABLE_FIELDS.filter((f) => hasValue(org[f])).length
  const detailScore = org.organization_detail.length
  const relatedScore = org.counts.opportunities + org.counts.notes + org.counts.contacts + org.counts.challenges
  return fieldScore * 10 + detailScore * 5 + relatedScore * 3
}

export function suggestSurvivor(orgs: OrganizationDuplicateCandidate[]): number {
  return [...orgs].sort((a, b) => {
    const diff = completenessScore(b) - completenessScore(a)
    if (diff !== 0) return diff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })[0].id
}

export interface MergeFieldRow {
  field: MergeableField
  label: string
  status: "auto" | "conflict" | "empty"
  value: string | null
  source: string | null
  options?: { value: string; orgId: number }[]
}

export function computeFieldPlan(
  survivor: OrganizationDuplicateCandidate,
  losers: OrganizationDuplicateCandidate[]
): MergeFieldRow[] {
  return MERGEABLE_FIELDS.map((field) => {
    const survivorValue = survivor[field]
    const loserEntries = losers
      .filter((l) => hasValue(l[field]))
      .map((l) => ({ value: l[field] as string, orgId: l.id }))

    if (hasValue(survivorValue)) {
      const conflicting = loserEntries.filter((e) => e.value !== survivorValue)
      if (conflicting.length === 0) {
        return { field, label: FIELD_LABELS[field], status: "auto", value: survivorValue, source: "Base" }
      }
      return {
        field,
        label: FIELD_LABELS[field],
        status: "conflict",
        value: survivorValue,
        source: "Base",
        options: [{ value: survivorValue, orgId: survivor.id }, ...conflicting],
      }
    }

    if (loserEntries.length > 0) {
      return {
        field,
        label: FIELD_LABELS[field],
        status: "auto",
        value: loserEntries[0].value,
        source: `#${loserEntries[0].orgId}`,
      }
    }

    return { field, label: FIELD_LABELS[field], status: "empty", value: null, source: null }
  })
}

export interface MergeDetailRow {
  key: string
  label_id: number | null
  option_id: number | null
  labelName: string
  status: "auto" | "conflict"
  value: string
  source: string | null
  options?: { value: string; orgId: number }[]
}

// Sin label_id (registros legacy sin catálogo) no hay forma confiable de saber si dos
// filas son "el mismo slot" — se usa el id propio de la fila para que cada una quede
// siempre única (nunca se agrupa/pisa con otra), así ninguna se pierde silenciosamente.
function detailKey(labelId: number | null, optionId: number | null, id: number): string {
  return labelId === null ? `id:${id}` : `${labelId}:${optionId ?? "null"}`
}

// Muestra el tag (ej. "Sede principal") junto al nombre del campo — sin esto, dos
// direcciones distintas se verían idénticas en la tabla de comparación.
function formatDetailLabel(labelName: string | undefined, option: string): string {
  if (labelName) return option ? `${labelName} · ${option}` : labelName
  return option || "Otro dato"
}

export function computeDetailPlan(
  survivor: OrganizationDuplicateCandidate,
  losers: OrganizationDuplicateCandidate[]
): MergeDetailRow[] {
  const survivorByKey = new Map(
    survivor.organization_detail.map((d) => [detailKey(d.label_id, d.option_id, d.id), d])
  )
  const rows: MergeDetailRow[] = []
  const seen = new Set<string>()

  for (const loser of losers) {
    for (const detail of loser.organization_detail) {
      const key = detailKey(detail.label_id, detail.option_id, detail.id)
      if (seen.has(key)) continue

      const survivorDetail = survivorByKey.get(key)
      const labelName = formatDetailLabel(detail.label?.name, detail.option)

      if (!survivorDetail) {
        rows.push({
          key,
          label_id: detail.label_id,
          option_id: detail.option_id,
          labelName,
          status: "auto",
          value: detail.value,
          source: `#${loser.id}`,
        })
        seen.add(key)
      } else if (survivorDetail.value !== detail.value) {
        rows.push({
          key,
          label_id: detail.label_id,
          option_id: detail.option_id,
          labelName,
          status: "conflict",
          value: survivorDetail.value,
          source: "Base",
          options: [
            { value: survivorDetail.value, orgId: survivor.id },
            { value: detail.value, orgId: loser.id },
          ],
        })
        seen.add(key)
      }
    }
  }

  return rows
}

export interface MergeImpact {
  opportunities: number
  notes: number
  contacts: number
  challenges: number
}

export function computeImpact(losers: OrganizationDuplicateCandidate[]): MergeImpact {
  return losers.reduce(
    (acc, l) => ({
      opportunities: acc.opportunities + l.counts.opportunities,
      notes: acc.notes + l.counts.notes,
      contacts: acc.contacts + l.counts.contacts,
      challenges: acc.challenges + l.counts.challenges,
    }),
    { opportunities: 0, notes: 0, contacts: 0, challenges: 0 }
  )
}
