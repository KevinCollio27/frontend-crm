import {
  BadgeDollarSignIcon,
  CalendarIcon,
  CheckSquareIcon,
  HashIcon,
  ListChecksIcon,
  ListIcon,
  LocateFixedIcon,
  MapPinIcon,
  RadarIcon,
  RouteIcon,
  ShipIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react"

export type ProductLabelType =
  | "select"
  | "multiselect"
  | "input"
  | "number"
  | "currency"
  | "date"
  | "boolean"
  | "address"
  | "cargo_vessels"
  | "cargo_addresses"
  | "cargo_routes"
  | "cargo_geofences"

export interface LabelTypeDef {
  value: ProductLabelType
  label: string
  icon: LucideIcon
  group: "Básico" | "Cargo"
}

export const LABEL_TYPES: LabelTypeDef[] = [
  { value: "select", label: "Selector", icon: ListIcon, group: "Básico" },
  { value: "multiselect", label: "Multi-selector", icon: ListChecksIcon, group: "Básico" },
  { value: "input", label: "Texto", icon: TypeIcon, group: "Básico" },
  { value: "number", label: "Número", icon: HashIcon, group: "Básico" },
  { value: "currency", label: "Monto ($)", icon: BadgeDollarSignIcon, group: "Básico" },
  { value: "date", label: "Fecha", icon: CalendarIcon, group: "Básico" },
  { value: "boolean", label: "Sí/No", icon: CheckSquareIcon, group: "Básico" },
  { value: "address", label: "Dirección (Google)", icon: MapPinIcon, group: "Básico" },
  { value: "cargo_vessels", label: "Cargo: Naves", icon: ShipIcon, group: "Cargo" },
  { value: "cargo_addresses", label: "Cargo: Direcciones", icon: LocateFixedIcon, group: "Cargo" },
  { value: "cargo_routes", label: "Cargo: Rutas", icon: RouteIcon, group: "Cargo" },
  { value: "cargo_geofences", label: "Cargo: Geocercas", icon: RadarIcon, group: "Cargo" },
]

export function labelNeedsOptions(type: ProductLabelType): boolean {
  return type === "select" || type === "multiselect"
}

// Convención de `id` (igual que en Catálogos): el id numérico real (como string) si ya existe
// en el backend, o `temp-<uuid>` si es nuevo y todavía no se creó — así el submit de edición
// sabe qué crear, actualizar o eliminar sin tener que comparar por contenido.
export interface ProductLabelOption {
  id: string
  value: string
}

export interface ProductLabel {
  id: string
  name: string
  type: ProductLabelType
  options: ProductLabelOption[]
}

export interface ProductFormState {
  id?: number
  name: string
  labels: ProductLabel[]
}

export function createEmptyProductForm(): ProductFormState {
  return { name: "", labels: [] }
}

export function isNewId(id: string): boolean {
  return id.startsWith("temp-")
}

// El backend exige una key por etiqueta (identificador estable, no se muestra en la UI).
// Para tipos cargo_* el backend la sobreescribe igual, así que solo importa para el resto.
export function slugifyLabelKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "etiqueta"
}
