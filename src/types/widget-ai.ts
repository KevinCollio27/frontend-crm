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
  lead_capture_enabled: boolean
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
