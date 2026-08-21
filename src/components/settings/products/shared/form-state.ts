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
  // Chip en ProductsTable — un color por tipo (Monto=verde, Dirección=rojo
  // como el pin de Google Maps, Fecha=ámbar...), los 4 de Cargo comparten
  // naranjo para que se lean como una sola familia (datos que vienen de la
  // integración con Cargo, no campos genéricos del formulario).
  badgeClass: string
}

export const LABEL_TYPES: LabelTypeDef[] = [
  { value: "select", label: "Selector", icon: ListIcon, group: "Básico",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300" },
  { value: "multiselect", label: "Multi-selector", icon: ListChecksIcon, group: "Básico",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300" },
  { value: "input", label: "Texto", icon: TypeIcon, group: "Básico",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-300" },
  { value: "number", label: "Número", icon: HashIcon, group: "Básico",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300" },
  { value: "currency", label: "Monto ($)", icon: BadgeDollarSignIcon, group: "Básico",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { value: "date", label: "Fecha", icon: CalendarIcon, group: "Básico",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300" },
  { value: "boolean", label: "Sí/No", icon: CheckSquareIcon, group: "Básico",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-300" },
  { value: "address", label: "Dirección (Google)", icon: MapPinIcon, group: "Básico",
    badgeClass: "border-red-200 bg-red-50 text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300" },
  { value: "cargo_vessels", label: "Cargo: Naves", icon: ShipIcon, group: "Cargo",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300" },
  { value: "cargo_addresses", label: "Cargo: Direcciones", icon: LocateFixedIcon, group: "Cargo",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300" },
  { value: "cargo_routes", label: "Cargo: Rutas", icon: RouteIcon, group: "Cargo",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300" },
  { value: "cargo_geofences", label: "Cargo: Geocercas", icon: RadarIcon, group: "Cargo",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300" },
]

export function labelTypeDef(type: ProductLabelType): LabelTypeDef {
  return LABEL_TYPES.find((t) => t.value === type) ?? LABEL_TYPES[2] // fallback: "Texto"
}

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
