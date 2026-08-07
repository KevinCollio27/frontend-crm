export type { FormBlock } from "./blocks"

export type FormFont = "inter" | "system" | "serif" | "mono"
export type FormDensity = "compact" | "comfortable" | "spacious"
export type FormLayout = "1col" | "2col"

export const FONT_FAMILY: Record<FormFont, string> = {
  inter: "Inter, sans-serif",
  system: "system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
}

export const FONT_LABEL: Record<FormFont, string> = {
  inter: "Inter",
  system: "Sistema",
  serif: "Serif",
  mono: "Mono",
}

export interface FormDesignState {
  primary: string
  font: FormFont
  radius: number
  density: FormDensity
  coverTitle: string
  coverSubtitle: string
  coverImage: string
  coverImageKey: string
  layout: FormLayout
  imageSide: "left" | "right"
  buttonLabel: string
}

export function createDefaultDesign(): FormDesignState {
  return {
    primary: "#111827",
    font: "inter",
    radius: 8,
    density: "comfortable",
    coverTitle: "",
    coverSubtitle: "",
    coverImage: "",
    coverImageKey: "",
    layout: "1col",
    imageSide: "left",
    buttonLabel: "Enviar",
  }
}

// ─── Campos base (Contacto / Organización / Oportunidad) ──────────────────────

export interface FieldConfig {
  enabled: boolean
  required: boolean
  locked?: boolean
  label: string
  placeholder: string
}

export type SocialNetwork = "linkedin" | "instagram" | "facebook" | "twitter"

export const SOCIAL_NETWORK_LABEL: Record<SocialNetwork, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
}

export interface SocialFieldConfig extends FieldConfig {
  network: SocialNetwork
}

export interface SourceFieldConfig extends FieldConfig {
  options: string[]
}

export interface ContactFieldsState {
  name: FieldConfig
  email: FieldConfig
  phone: FieldConfig
  birthdate: FieldConfig
  internal_position: FieldConfig
  source: SourceFieldConfig
  social: SocialFieldConfig
}

export interface OrganizationFieldsState {
  name: FieldConfig
  rut: FieldConfig
  website: FieldConfig
  industry: FieldConfig
  social: SocialFieldConfig
}

export interface OpportunityFieldsState {
  name: FieldConfig
  notes: FieldConfig
  budget: FieldConfig
}

// Claves ordenables por sección — "name" queda fijo arriba y no entra en el orden.
export type ContactFieldKey = Exclude<keyof ContactFieldsState, "name">
export type OrganizationFieldKey = Exclude<keyof OrganizationFieldsState, "name">
export type OpportunityFieldKey = keyof OpportunityFieldsState

export const DEFAULT_CONTACT_ORDER: ContactFieldKey[] = ["email", "phone", "birthdate", "internal_position", "source", "social"]
export const DEFAULT_ORGANIZATION_ORDER: OrganizationFieldKey[] = ["rut", "website", "industry", "social"]
export const DEFAULT_OPPORTUNITY_ORDER: OpportunityFieldKey[] = ["name", "notes", "budget"]

export function createDefaultContact(): { fields: ContactFieldsState; order: ContactFieldKey[] } {
  return {
    fields: {
      name:              { enabled: true,  required: true,  locked: true, label: "Nombre Completo", placeholder: "Ingresa tu nombre completo" },
      email:             { enabled: true,  required: false, label: "Correo Electrónico", placeholder: "correo@ejemplo.com" },
      phone:             { enabled: false, required: false, label: "Teléfono", placeholder: "" },
      birthdate:         { enabled: false, required: false, label: "Fecha de Nacimiento", placeholder: "" },
      internal_position: { enabled: false, required: false, label: "Cargo", placeholder: "Ej: Jefe de Operaciones" },
      source:            { enabled: false, required: false, label: "¿Cómo nos conociste?", placeholder: "Selecciona una opción", options: ["Redes Sociales", "Sitio Web", "Referido", "Otra"] },
      social:            { enabled: false, required: false, label: "LinkedIn", placeholder: "https://linkedin.com/in/tu-perfil", network: "linkedin" },
    },
    order: [...DEFAULT_CONTACT_ORDER],
  }
}

export function createDefaultOrganization(): { enabled: boolean; fields: OrganizationFieldsState; order: OrganizationFieldKey[] } {
  return {
    enabled: false,
    fields: {
      name:     { enabled: true,  required: true,  locked: true, label: "Nombre Empresa", placeholder: "Mi Empresa SpA" },
      rut:      { enabled: false, required: false, label: "RUT / Id. Fiscal", placeholder: "77.123.456-K" },
      website:  { enabled: false, required: false, label: "Sitio Web", placeholder: "https://miempresa.cl" },
      industry: { enabled: false, required: false, label: "Industria / Rubro", placeholder: "Tecnología" },
      social:   { enabled: false, required: false, label: "LinkedIn", placeholder: "https://linkedin.com/company/tu-empresa", network: "linkedin" },
    },
    order: [...DEFAULT_ORGANIZATION_ORDER],
  }
}

export function createDefaultOpportunity(): { fields: OpportunityFieldsState; order: OpportunityFieldKey[] } {
  return {
    fields: {
      name:   { enabled: false, required: false, label: "Asunto", placeholder: "Describe brevemente tu consulta" },
      notes:  { enabled: true,  required: false, label: "Mensaje", placeholder: "Cuéntanos más detalles..." },
      budget: { enabled: false, required: false, label: "Presupuesto estimado", placeholder: "0" },
    },
    order: [...DEFAULT_OPPORTUNITY_ORDER],
  }
}

// ─── Campos adicionales (custom) ───────────────────────────────────────────────

export type CustomFieldType =
  | "TEXT" | "SELECT" | "TEXTAREA" | "SECTION_TITLE" | "FILE" | "BOOLEAN" | "INFO"
  | "NUMBER" | "DATE" | "URL" | "ADDRESS"

export interface CustomField {
  id: string
  type: CustomFieldType
  label: string
  placeholder: string
  required: boolean
  options: string[]
  multiple?: boolean
  default_value?: unknown
  accept?: string[]
}

// ─── Estado del wizard ──────────────────────────────────────────────────────────

export interface FormFormState {
  name: string
  slug: string
  description: string
  flowId: string
  isActive: boolean
  contact: { fields: ContactFieldsState; order: ContactFieldKey[] }
  organization: { enabled: boolean; fields: OrganizationFieldsState; order: OrganizationFieldKey[] }
  opportunity: { fields: OpportunityFieldsState; order: OpportunityFieldKey[] }
  customFields: CustomField[]
  design: FormDesignState
}

export function createEmptyFormState(): FormFormState {
  return {
    name: "",
    slug: "",
    description: "",
    flowId: "",
    isActive: true,
    contact: createDefaultContact(),
    organization: createDefaultOrganization(),
    opportunity: createDefaultOpportunity(),
    customFields: [],
    design: createDefaultDesign(),
  }
}

// El shape que espera el backend / el render público (ClassicBaseConfig) —
// se arma acá para reusarlo tanto al guardar como en la vista previa del Paso 4.
export function buildBaseConfig(form: FormFormState) {
  return {
    description:   form.description,
    contact:        form.contact,
    organization:   form.organization,
    opportunity:    form.opportunity,
    custom_fields:  form.customFields,
    design:         form.design,
  }
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}
