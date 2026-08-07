export interface AiConversationListItem {
  id: number
  title: string
  last_message_at: string
  last_message_preview: string
}

export interface AiConversationGrouped {
  today: AiConversationListItem[]
  yesterday: AiConversationListItem[]
  thisWeek: AiConversationListItem[]
  thisMonth: AiConversationListItem[]
  older: AiConversationListItem[]
}

export interface AiMessage {
  id: number
  conversation_id: number
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  tokens_used?: number
  model_used?: string
}

export interface AiConversationDetail {
  id: number
  title: string
  messages: AiMessage[]
}

export interface AiChatResponse {
  role: "assistant"
  content: string
  conversationId: number
}
