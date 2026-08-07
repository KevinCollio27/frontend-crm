import type { PersonDuplicateCandidate } from "@/types/contact"

export const MERGEABLE_FIELDS = [
  "pais_origen",
  "contact_source",
  "internal_position",
  "birth_date",
  "linkedin_url",
  "instagram_url",
  "twitter_url",
  "facebook_url",
] as const

export type MergeableField = (typeof MERGEABLE_FIELDS)[number]

export const FIELD_LABELS: Record<MergeableField, string> = {
  pais_origen: "País",
  contact_source: "Fuente de contacto",
  internal_position: "Cargo interno",
  birth_date: "Fecha de nacimiento",
  linkedin_url: "LinkedIn",
  instagram_url: "Instagram",
  twitter_url: "Twitter",
  facebook_url: "Facebook",
}

function hasValue(v: string | null | undefined): v is string {
  return !!v && v.trim() !== ""
}

export function completenessScore(person: PersonDuplicateCandidate): number {
  const fieldScore = MERGEABLE_FIELDS.filter((f) => hasValue(person[f])).length
  const orgScore = person.organization_id !== null ? 1 : 0
  const detailScore = person.person_detail.length
  const relatedScore = person.counts.opportunities + person.counts.notes + person.counts.interests
  return fieldScore * 10 + orgScore * 10 + detailScore * 5 + relatedScore * 3
}

export function suggestSurvivor(candidates: PersonDuplicateCandidate[]): number {
  return [...candidates].sort((a, b) => {
    const diff = completenessScore(b) - completenessScore(a)
    if (diff !== 0) return diff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })[0].id
}

export interface MergeFieldRow {
  field: string
  label: string
  status: "auto" | "conflict" | "empty"
  value: string | null
  source: string | null
  options?: { value: string; label: string; orgId: number }[]
}

function computeOrganizationRow(
  survivor: PersonDuplicateCandidate,
  losers: PersonDuplicateCandidate[]
): MergeFieldRow {
  const label = "Organización"
  if (survivor.organization_id !== null) {
    const conflicting = losers.filter(
      (l) => l.organization_id !== null && l.organization_id !== survivor.organization_id
    )
    if (conflicting.length === 0) {
      return { field: "organization_id", label, status: "auto", value: survivor.organization_name, source: "Base" }
    }
    return {
      field: "organization_id",
      label,
      status: "conflict",
      value: String(survivor.organization_id),
      source: "Base",
      options: [
        { value: String(survivor.organization_id), label: survivor.organization_name ?? `#${survivor.organization_id}`, orgId: survivor.id },
        ...conflicting.map((l) => ({ value: String(l.organization_id), label: l.organization_name ?? `#${l.organization_id}`, orgId: l.id })),
      ],
    }
  }

  const loserWithOrg = losers.find((l) => l.organization_id !== null)
  if (loserWithOrg) {
    return {
      field: "organization_id",
      label,
      status: "auto",
      value: loserWithOrg.organization_name,
      source: `#${loserWithOrg.id}`,
    }
  }

  return { field: "organization_id", label, status: "empty", value: null, source: null }
}

export function computeFieldPlan(
  survivor: PersonDuplicateCandidate,
  losers: PersonDuplicateCandidate[]
): MergeFieldRow[] {
  const orgRow = computeOrganizationRow(survivor, losers)

  const simpleRows = MERGEABLE_FIELDS.map((field): MergeFieldRow => {
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
        options: [
          { value: survivorValue, label: survivorValue, orgId: survivor.id },
          ...conflicting.map((e) => ({ value: e.value, label: e.value, orgId: e.orgId })),
        ],
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

  return [orgRow, ...simpleRows]
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

// Muestra el tag (Personal/Trabajo/etc.) junto al nombre del campo — sin esto, dos filas
// "Correo" (una personal, otra de trabajo) se ven idénticas en la tabla de comparación.
function formatDetailLabel(labelName: string | undefined, option: string): string {
  if (labelName) return option ? `${labelName} · ${option}` : labelName
  return option || "Otro dato"
}

export function computeDetailPlan(
  survivor: PersonDuplicateCandidate,
  losers: PersonDuplicateCandidate[]
): MergeDetailRow[] {
  const survivorByKey = new Map(
    survivor.person_detail.map((d) => [detailKey(d.label_id, d.option_id, d.id), d])
  )
  const rows: MergeDetailRow[] = []
  const seen = new Set<string>()

  for (const loser of losers) {
    for (const detail of loser.person_detail) {
      const optionId = detail.option_id
      const key = detailKey(detail.label_id, optionId, detail.id)
      if (seen.has(key)) continue

      const survivorDetail = survivorByKey.get(key)
      const labelName = formatDetailLabel(detail.label?.name, detail.option)

      if (!survivorDetail) {
        rows.push({
          key,
          label_id: detail.label_id,
          option_id: optionId,
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
          option_id: optionId,
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
  interests: number
}

export function computeImpact(losers: PersonDuplicateCandidate[]): MergeImpact {
  return losers.reduce(
    (acc, l) => ({
      opportunities: acc.opportunities + l.counts.opportunities,
      notes: acc.notes + l.counts.notes,
      interests: acc.interests + l.counts.interests,
    }),
    { opportunities: 0, notes: 0, interests: 0 }
  )
}
