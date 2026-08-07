import api from "@/lib/api"
import type { InstagramConfigRaw, InstagramSignupResult } from "@/types/instagram"
import type { InstagramConversationListParams, InstagramConversationRaw } from "@/types/instagram-conversation"

export const instagramService = {
  async getMetaConfig(): Promise<InstagramConfigRaw | null> {
    const res = await api.get<never, { config: InstagramConfigRaw | null }>("instagram/meta/config")
    return res.config
  },

  async setMetaConfig(pageId: string, igBusinessAccountId: string, pageAccessToken: string): Promise<InstagramConfigRaw> {
    const res = await api.put<never, { config: InstagramConfigRaw }>("instagram/meta/config", {
      pageId,
      igBusinessAccountId,
      pageAccessToken,
    })
    return res.config
  },

  async disconnectMetaConfig(): Promise<void> {
    await api.delete("instagram/meta/config")
  },

  async setAgent(agentId: number): Promise<void> {
    await api.patch("instagram/agent", { agentId })
  },

  async completeSignup(code: string, redirectUri: string): Promise<InstagramSignupResult> {
    const res = await api.post<never, InstagramSignupResult & { success: boolean }>(
      "instagram/embedded-signup/complete",
      { code, redirect_uri: redirectUri }
    )
    return res
  },

  async listConversations(params: InstagramConversationListParams = {}): Promise<InstagramConversationRaw[]> {
    const res = await api.get<never, { conversations: InstagramConversationRaw[] }>("instagram/conversations", { params })
    return res.conversations
  },

  async getConversation(id: number): Promise<InstagramConversationRaw> {
    const res = await api.get<never, { conversation: InstagramConversationRaw }>(`instagram/conversations/${id}`)
    return res.conversation
  },

  async sendMessageToConversation(id: number, text: string): Promise<void> {
    await api.post(`instagram/conversations/${id}/send`, { text })
  },

  async takeoverConversation(id: number): Promise<void> {
    await api.patch(`instagram/conversations/${id}/takeover`, {})
  },

  async releaseConversation(id: number): Promise<void> {
    await api.patch(`instagram/conversations/${id}/release`, {})
  },
}
