import api from "@/lib/api"
import type { EmbeddedSignupResult, MetaConfigRaw, MyWhatsAppNumberRaw } from "@/types/whatsapp"
import type { WhatsAppConversationListParams, WhatsAppConversationRaw } from "@/types/whatsapp-conversation"

export const whatsappService = {
  async getMetaConfig(): Promise<MetaConfigRaw | null> {
    const res = await api.get<never, { config: MetaConfigRaw | null }>("whatsapp/meta/config")
    return res.config
  },

  async setMetaConfig(phoneNumberId: string, wabaId?: string): Promise<MetaConfigRaw> {
    const res = await api.put<never, { config: MetaConfigRaw }>("whatsapp/meta/config", {
      phoneNumberId,
      ...(wabaId ? { wabaId } : {}),
    })
    return res.config
  },

  async disconnectMetaConfig(): Promise<void> {
    await api.delete("whatsapp/meta/config")
  },

  async setAgent(agentId: number): Promise<void> {
    await api.patch("whatsapp/agent", { agentId })
  },

  async getMyNumber(): Promise<MyWhatsAppNumberRaw | null> {
    const res = await api.get<never, { userWorkspace: MyWhatsAppNumberRaw | null }>("whatsapp/my-number")
    return res.userWorkspace
  },

  async setMyNumber(number: string | null): Promise<MyWhatsAppNumberRaw> {
    const res = await api.put<never, { userWorkspace: MyWhatsAppNumberRaw }>("whatsapp/my-number", { number })
    return res.userWorkspace
  },

  async completeEmbeddedSignup(code: string, redirectUri: string): Promise<EmbeddedSignupResult> {
    const res = await api.post<never, EmbeddedSignupResult & { success: boolean }>(
      "whatsapp/embedded-signup/complete",
      { code, redirect_uri: redirectUri }
    )
    return res
  },

  async listConversations(params: WhatsAppConversationListParams = {}): Promise<WhatsAppConversationRaw[]> {
    const res = await api.get<never, { conversations: WhatsAppConversationRaw[] }>("whatsapp/conversations", { params })
    return res.conversations
  },

  async getConversation(id: number): Promise<WhatsAppConversationRaw> {
    const res = await api.get<never, { conversation: WhatsAppConversationRaw }>(`whatsapp/conversations/${id}`)
    return res.conversation
  },

  async sendMessageToConversation(id: number, text: string): Promise<void> {
    await api.post(`whatsapp/conversations/${id}/send`, { text })
  },

  async takeoverConversation(id: number): Promise<void> {
    await api.patch(`whatsapp/conversations/${id}/takeover`, {})
  },

  async releaseConversation(id: number): Promise<void> {
    await api.patch(`whatsapp/conversations/${id}/release`, {})
  },
}
