export type WhatsAppConversationStatus = "active" | "human_takeover"

export interface WhatsAppMessageTemplateRaw {
  name: string
  language: string
  vars: string[]
}

export interface WhatsAppConversationMessageRaw {
  role: "user" | "assistant"
  content: string
  created_at: string
  author?: "ai" | "human"
  template?: WhatsAppMessageTemplateRaw
}

export interface WhatsAppConversationRaw {
  id: number
  workspace_id: number
  from_number: string
  status: WhatsAppConversationStatus
  messages: WhatsAppConversationMessageRaw[]
  last_user_message_at: string | null
  window_open: boolean
  created_at: string
  updated_at: string
  visitor_name: string | null
}

export interface WhatsAppConversationListParams {
  status?: string
  limit?: number
  offset?: number
}
