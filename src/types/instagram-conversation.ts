export type InstagramConversationStatus = "active" | "human_takeover"

export interface InstagramConversationMessageRaw {
  role: "user" | "assistant"
  content: string
  created_at: string
  author?: "ai" | "human"
}

export interface InstagramConversationRaw {
  id: number
  workspace_id: number
  from_igsid: string
  status: InstagramConversationStatus
  messages: InstagramConversationMessageRaw[]
  last_user_message_at: string | null
  window_open: boolean
  created_at: string
  updated_at: string
  visitor_name: string | null
  visitor_username: string | null
  visitor_avatar_url: string | null
  unread_count: number
}

export interface InstagramConversationListParams {
  status?: string
  limit?: number
  offset?: number
}
