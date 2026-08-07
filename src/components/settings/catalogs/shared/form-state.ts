import type { LabelRaw } from "@/types/catalog"

export interface CatalogOption {
  id: string
  value: string
  isActive: boolean
  isBase: boolean
}

export interface CatalogFormState {
  labelId: number
  key: string
  name: string
  isSystem: boolean
  options: CatalogOption[]
}

export function labelToFormValues(label: LabelRaw): CatalogFormState {
  const isSystem = label.workspace_id === null
  return {
    labelId: label.id,
    key: label.key,
    name: label.name,
    isSystem,
    options: label.options
      .slice()
      .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
      .map((o) => ({
        id: String(o.id),
        value: o.value,
        isActive: o.option_status?.[0]?.is_active ?? true,
        isBase: o.workspace_id === null,
      })),
  }
}
