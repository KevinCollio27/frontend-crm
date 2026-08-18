export interface MetaConfigRaw {
  id: number
  phone_number_id: string
  waba_id: string | null
  agent_id: number | null
  is_active: boolean
  updated_at: string
  display_phone_number: string | null
  verified_name: string | null
  quality_rating: string | null
  account_mode: string | null
  status: string | null
  code_verification_status: string | null
  name_status: string | null
  messaging_limit_tier: string | null
  meta_live: boolean
}

export interface MyWhatsAppNumberRaw {
  id: number
  user_id: number
  whatsapp_number: string | null
  whatsapp_enabled: boolean
}

export interface EmbeddedSignupPhoneRaw {
  id: string
  display_phone_number: string
  verified_name: string
  waba_id: string
  accessible: boolean
  quality_rating?: string | null
  code_verification_status?: string | null
  account_mode?: string | null
  name_status?: string | null
  status?: string | null
}

export interface EmbeddedSignupResult {
  phone_number_id?: string
  waba_id: string
  requires_selection: boolean
  requires_phone_setup?: boolean
  phone_numbers: EmbeddedSignupPhoneRaw[]
}

export interface WhatsappTemplateComponentButtonRaw {
  type: string
  text: string
  url?: string
}

export interface WhatsappTemplateComponentRaw {
  type: string
  format?: string
  text?: string
  url?: string
  buttons?: WhatsappTemplateComponentButtonRaw[]
  example?: { header_handle?: string[]; body_text?: string[][] }
}

export interface WhatsappTemplateRaw {
  id?: number
  template_id?: string
  name: string
  status: string
  language: string
  category?: string | null
  body_text?: string | null
  components: WhatsappTemplateComponentRaw[]
}

export type TemplateButtonPayload =
  | { type: "QUICK_REPLY"; text: string }
  | { type: "URL"; text: string; url: string }
