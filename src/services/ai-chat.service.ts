import api from "@/lib/api"
import type {
  AiConversationGrouped,
  AiConversationDetail,
  AiChatResponse,
} from "@/types/ai-chat"

export interface ChatMessageImagePayload {
  url: string
  filePath?: string
  fileName?: string
}

export interface ChatMessagePayload {
  role: string
  content: string
  images?: ChatMessageImagePayload[]
}

export interface ChatPayload {
  messages: ChatMessagePayload[]
  conversationId?: number
}

export const aiChatService = {
  async listConversations(): Promise<AiConversationGrouped> {
    const res = await api.get<never, { data: AiConversationGrouped }>("ai/conversations")
    return res.data
  },

  async getConversation(id: number): Promise<AiConversationDetail> {
    const res = await api.get<never, { data: AiConversationDetail }>(`ai/conversations/${id}`)
    return res.data
  },

  async chat(payload: ChatPayload): Promise<AiChatResponse> {
    const res = await api.post<never, AiChatResponse>("ai/chat", payload)
    return res
  },

  async updateTitle(id: number, title: string): Promise<void> {
    await api.patch(`ai/conversations/${id}`, { title })
  },

  async deleteConversation(id: number): Promise<void> {
    await api.delete(`ai/conversations/${id}`)
  },
}
