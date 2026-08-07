export interface WidgetAIRaw {
  id: number
  workspace_id: number
  name: string
  description: string | null
  chat_title: string
  api_key: string
  brand_color: string
  brand_logo_url: string | null
  position: string
  allowed_domains: string[]
  is_active: boolean
  is_whatsapp_agent: boolean
  document_count: number
  used_in?: string[]
  lead_capture_enabled: boolean
  system_prompt: string
  welcome_message: string
  suggested_questions: { question: string; answer: string }[] | null
  lead_capture_message: string | null
  created_at: string
  updated_at: string
}

export interface WidgetAIPage {
  data: WidgetAIRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

export interface WidgetAIDocument {
  id: number
  widget_config_id: number
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}
