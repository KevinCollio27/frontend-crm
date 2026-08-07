import api from "@/lib/api"
import type { WidgetAIDocument, WidgetAIPage, WidgetAIRaw } from "@/types/widget-ai"
import type { WidgetConversationsPage, WidgetMessageRaw } from "@/types/widget-conversation"

export interface WidgetAIListParams {
  page?: number
  take?: number
  filter?: string
  is_active?: boolean
  is_whatsapp_agent?: boolean
}

export interface WidgetConversationsParams {
  page?: number
  limit?: number
}

export interface CreateWidgetPayload {
  name: string
  description?: string
  system_prompt: string
  welcome_message?: string
  suggested_questions?: { question: string; answer: string }[]
  lead_capture_enabled?: boolean
  lead_capture_message?: string
  brand_color?: string
  position?: string
  chat_title?: string
  allowed_domains?: string[]
}

export const widgetAIService = {
  async list(params: WidgetAIListParams = {}): Promise<WidgetAIPage> {
    const res = await api.get<never, { data: WidgetAIPage }>("ai/widgets", { params })
    return res.data
  },

  async getById(id: number): Promise<WidgetAIRaw> {
    const res = await api.get<never, { data: WidgetAIRaw }>(`ai/widgets/${id}`)
    return res.data
  },

  async create(payload: CreateWidgetPayload): Promise<WidgetAIRaw> {
    const res = await api.post<never, { data: WidgetAIRaw }>("ai/widgets", payload)
    return res.data
  },

  async update(id: number, payload: Partial<CreateWidgetPayload> & { is_active?: boolean }): Promise<WidgetAIRaw> {
    const res = await api.patch<never, { data: WidgetAIRaw }>(`ai/widgets/${id}`, payload)
    return res.data
  },

  async getDocuments(widgetId: number): Promise<WidgetAIDocument[]> {
    const res = await api.get<never, { data: WidgetAIDocument[] }>(`ai/widgets/${widgetId}/documents`)
    return res.data
  },

  async deleteDocument(widgetId: number, documentId: number): Promise<void> {
    await api.delete(`ai/widgets/${widgetId}/documents/${documentId}`)
  },

  async uploadLogo(widgetId: number, fileName: string, base64File: string): Promise<string> {
    const res = await api.post<never, { data: { logo_url: string } }>(
      `ai/widgets/${widgetId}/upload-logo`,
      { fileName, base64File }
    )
    return res.data.logo_url
  },

  async uploadDocument(
    widgetId: number,
    fileName: string,
    base64File: string,
    fileType: string
  ): Promise<{ id: number; file_url: string; file_name: string }> {
    const res = await api.post<never, { data: { id: number; file_url: string; file_name: string } }>(
      `ai/widgets/${widgetId}/upload-document`,
      { fileName, base64File, fileType }
    )
    return res.data
  },

  async conversations(widgetId: number, params: WidgetConversationsParams = {}): Promise<WidgetConversationsPage> {
    const res = await api.get<never, { data: WidgetConversationsPage }>(
      `ai/widgets/${widgetId}/conversations`,
      { params }
    )
    return res.data
  },

  async messages(widgetId: number, conversationId: number): Promise<WidgetMessageRaw[]> {
    const res = await api.get<never, { data: { messages: WidgetMessageRaw[] } }>(
      `ai/widgets/${widgetId}/conversations/${conversationId}/messages`
    )
    return res.data.messages
  },
}
