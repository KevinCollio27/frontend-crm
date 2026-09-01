interface UnitOption {
  value: string
  label: string
}

interface UnitGroup {
  label: string
  options: UnitOption[]
}

export const UNIT_GROUPS: UnitGroup[] = [
  {
    label: "Por Cantidad",
    options: [
      { value: "unidad",     label: "Unidad" },
      { value: "viaje",      label: "Viaje" },
      { value: "hora",       label: "Hora" },
      { value: "kg",         label: "Kg" },
      { value: "m3",         label: "m³" },
      { value: "km",         label: "Km" },
      { value: "tonelada",   label: "Tonelada" },
      { value: "contenedor", label: "Contenedor" },
      { value: "pallet",     label: "Pallet" },
      { value: "parada",     label: "Parada / Punto de entrega" },
      { value: "m2",         label: "m²" },
    ],
  },
  {
    label: "Por Tiempo",
    options: [
      { value: "diario",  label: "Diario" },
      { value: "semanal", label: "Semanal" },
      { value: "mensual", label: "Mensual" },
      { value: "anual",   label: "Anual" },
      { value: "turno",   label: "Turno" },
    ],
  },
  {
    label: "Por Contrato / Servicio",
    options: [
      { value: "proyecto", label: "Proyecto" },
      { value: "servicio", label: "Por Servicio" },
      { value: "plan",     label: "Plan" },
      { value: "usuario",  label: "Por Usuario" },
    ],
  },
]

export const UNIT_OPTIONS: UnitOption[] = UNIT_GROUPS.flatMap((g) => g.options)

// Valores crudos con los que quedaron guardadas cotizaciones de generaciones
// anteriores del sistema (enum en inglés de una API vieja, y Título-Case del
// goxt-frontend-crm legacy) — se normalizan al slug actual para que el
// selector los reconozca y el PDF no imprima el string crudo.
export const LEGACY_UNIT_NORMALIZE: Record<string, string> = {
  unit:     "unidad",
  daily:    "diario",
  Diario:   "diario",
  monthly:  "mensual",
  Mensual:  "mensual",
  project:  "proyecto",
  Proyecto: "proyecto",
  Usuarios: "usuario",
}

export function normalizeUnit(raw: string): string {
  return LEGACY_UNIT_NORMALIZE[raw] ?? raw
}

export function getUnitLabel(value: string): string {
  const normalized = normalizeUnit(value)
  return UNIT_OPTIONS.find((u) => u.value === normalized)?.label ?? value
}
