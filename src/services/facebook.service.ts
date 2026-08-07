import api from "@/lib/api"
import type {
  FacebookConversationListParams,
  FacebookConversationRaw,
  FacebookStatusRaw,
} from "@/types/facebook-conversation"

export const facebookService = {
  async getStatus(): Promise<FacebookStatusRaw> {
    const res = await api.get<never, { status: FacebookStatusRaw }>("facebook/status")
    return res.status
  },

  async setEnabled(enabled: boolean): Promise<FacebookStatusRaw> {
    const res = await api.put<never, { status: FacebookStatusRaw }>("facebook/status", { enabled })
    return res.status
  },

  async listConversations(params: FacebookConversationListParams = {}): Promise<FacebookConversationRaw[]> {
    const res = await api.get<never, { conversations: FacebookConversationRaw[] }>("facebook/conversations", { params })
    return res.conversations
  },

  async getConversation(id: number): Promise<FacebookConversationRaw> {
    const res = await api.get<never, { conversation: FacebookConversationRaw }>(`facebook/conversations/${id}`)
    return res.conversation
  },

  async sendMessageToConversation(id: number, text: string): Promise<void> {
    await api.post(`facebook/conversations/${id}/send`, { text })
  },

  async takeoverConversation(id: number): Promise<void> {
    await api.patch(`facebook/conversations/${id}/takeover`, {})
  },

  async releaseConversation(id: number): Promise<void> {
    await api.patch(`facebook/conversations/${id}/release`, {})
  },
}
