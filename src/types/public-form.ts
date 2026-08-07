import type { FormBlock } from "@/components/dashboard/forms/shared/form-state"
import type { FormDesignState, SocialNetwork } from "@/components/dashboard/forms/shared/form-state"

// ─── Field config (classic format) ───────────────────────────────────────────

export interface FieldConfig {
  enabled: boolean
  required?: boolean
  locked?: boolean
  label?: string
  placeholder?: string
}

export interface SocialFieldConfig extends FieldConfig {
  network: SocialNetwork
}

export interface SourceFieldConfig extends FieldConfig {
  options: string[]
}

// ─── Custom field (classic format) ───────────────────────────────────────────

export interface PublicCustomField {
  id: string
  type: "TEXT" | "SELECT" | "TEXTAREA" | "SECTION_TITLE" | "FILE" | "BOOLEAN" | "INFO" | "NUMBER" | "DATE" | "URL" | "ADDRESS"
  label: string
  placeholder: string
  required: boolean
  options: string[]
  multiple?: boolean
  default_value?: unknown
  accept?: string[]
}

// ─── base_config shapes ───────────────────────────────────────────────────────

export interface ClassicBaseConfig {
  contact: {
    fields: {
      name:      FieldConfig
      email?:    FieldConfig
      phone?:    FieldConfig
      birthdate?: FieldConfig
      internal_position?: FieldConfig
      source?:   SourceFieldConfig
      social?:   SocialFieldConfig
    }
    order?: string[]
  }
  organization?: {
    enabled: boolean
    fields: {
      name?:     FieldConfig
      rut?:      FieldConfig
      website?:  FieldConfig
      industry?: FieldConfig
      social?:   SocialFieldConfig
    }
    order?: string[]
  }
  opportunity?: {
    fields: {
      name?:   FieldConfig
      notes?:  FieldConfig
      budget?: FieldConfig
    }
    order?: string[]
  }
  custom_fields?: PublicCustomField[]
  design?: FormDesignState
}

export interface BlocksBaseConfig {
  blocks: FormBlock[]
  design: FormDesignState
  description?: string
}

export type PublicBaseConfig = ClassicBaseConfig | BlocksBaseConfig

// ─── Discriminators ───────────────────────────────────────────────────────────

export function isBlocksFormat(cfg: PublicBaseConfig): cfg is BlocksBaseConfig {
  return Array.isArray((cfg as BlocksBaseConfig).blocks)
}

// ─── Public form config (returned by GET /widget/form/:slug) ──────────────────

export interface PublicFormConfig {
  id: number
  name: string
  slug: string
  is_active: boolean
  base_config: PublicBaseConfig
  custom_fields: PublicCustomField[]
  flow: { id: number; name: string }
}

// ─── Submit payload ───────────────────────────────────────────────────────────

export interface FormSubmitPayload {
  name: string
  emails: { value: string }[]
  phones: { value: string }[]
  birthdate?: string | null
  social_url?: string | null
  contact_source?: string | null
  internal_position?: string | null
  org_name?: string | null
  org_rut?: string | null
  org_website?: string | null
  org_industry?: string | null
  org_social_url?: string | null
  opp_name?: string | null
  notes?: string | null
  budget?: number | null
  custom_answers: Record<string, unknown>
  turnstileToken?: string
}
