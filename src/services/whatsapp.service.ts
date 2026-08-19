import api from "@/lib/api"
import type { EmbeddedSignupResult, MetaConfigRaw, MyWhatsAppNumberRaw, TemplateButtonPayload, WhatsappTemplateRaw, WhatsAppBusinessProfileRaw, WhatsAppBusinessProfilePayload } from "@/types/whatsapp"
import type { WhatsAppConversationListParams, WhatsAppConversationRaw } from "@/types/whatsapp-conversation"
import type { WhatsappCostAnalyticsRaw } from "@/types/whatsappCosts"

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

  async markConversationRead(id: number): Promise<void> {
    await api.patch(`whatsapp/conversations/${id}/read`, {})
  },

  async getCachedTemplates(filters?: {
    status?: string
    language?: string
    search?: string
    limit?: number
  }): Promise<{ templates: WhatsappTemplateRaw[]; total: number; lastSyncedAt: string | null }> {
    const res = await api.get<never, { templates: WhatsappTemplateRaw[]; total: number; lastSyncedAt: string | null }>(
      "whatsapp/templates/cached",
      { params: filters },
    )
    return res
  },

  async syncTemplates(): Promise<{ syncedCount: number; countsByStatus: Record<string, number> }> {
    return api.post("whatsapp/templates/sync")
  },

  async createTemplate(payload: {
    name: string
    language: string
    category: string
    bodyText: string
    headerText?: string
    headerImageUrl?: string
    footerText?: string
    buttons?: TemplateButtonPayload[]
  }): Promise<WhatsappTemplateRaw> {
    const res = await api.post<never, { template: WhatsappTemplateRaw }>("whatsapp/templates/create", payload)
    return res.template
  },

  async uploadTemplateImage(fileName: string, base64File: string): Promise<{ url: string; key?: string }> {
    const res = await api.post<never, { url: string }>("whatsapp/templates/upload-image", { fileName, base64File })
    return { url: res.url }
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await api.delete(`whatsapp/templates/${templateId}`)
  },

  async sendTemplateMessage(to: string, templateName: string, languageCode: string, bodyVarValues?: string[]): Promise<void> {
    await api.post("whatsapp/send-template", { to, templateName, languageCode, bodyVarValues })
  },

  async sendTemplateToConversation(conversationId: number, templateName: string, languageCode: string, bodyVarValues?: string[]): Promise<void> {
    await api.post(`whatsapp/conversations/${conversationId}/send-template`, { templateName, languageCode, bodyVarValues })
  },

  async getCostAnalytics(params?: { from?: string; to?: string }): Promise<WhatsappCostAnalyticsRaw> {
    return api.get<never, WhatsappCostAnalyticsRaw>("whatsapp/costs", { params })
  },

  async getBusinessProfile(): Promise<WhatsAppBusinessProfileRaw> {
    const res = await api.get<never, { profile: WhatsAppBusinessProfileRaw }>("whatsapp/business-profile")
    return res.profile
  },

  async uploadBusinessProfilePhoto(fileName: string, base64File: string): Promise<string> {
    const res = await api.post<never, { url: string }>("whatsapp/business-profile/upload-photo", { fileName, base64File })
    return res.url
  },

  async updateBusinessProfile(payload: WhatsAppBusinessProfilePayload): Promise<void> {
    await api.put("whatsapp/business-profile", payload)
  },
}
