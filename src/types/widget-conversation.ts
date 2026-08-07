export interface WidgetConversationRaw {
  id: number
  external_visitor_id: string | null
  title: string
  visitor_metadata: {
    ip?: string
    userAgent?: string
    referer?: string
    origin?: string
  } | null
  last_message_at: string
  created_at: string
  message_count: number
  last_message_preview: string | null
  captured_email: string | null
}

export interface WidgetConversationsPage {
  conversations: WidgetConversationRaw[]
  total: number
  page: number
  totalPages: number
}

export interface WidgetMessageRaw {
  id: number
  conversation_id: number
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  tokens_used?: number
  model_used?: string
}
