export type FacebookConversationStatus = "active" | "human_takeover"

export interface FacebookConversationMessageRaw {
  role: "user" | "assistant"
  content: string
  created_at: string
  author?: "ai" | "human"
}

export interface FacebookConversationRaw {
  id: number
  workspace_id: number
  from_psid: string
  status: FacebookConversationStatus
  messages: FacebookConversationMessageRaw[]
  last_user_message_at: string | null
  window_open: boolean
  created_at: string
  updated_at: string
  visitor_name: string | null
  visitor_avatar_url: string | null
}

export interface FacebookConversationListParams {
  status?: string
  limit?: number
  offset?: number
}

export interface FacebookStatusRaw {
  instagram_connected: boolean
  enabled: boolean
  page_name: string | null
}
