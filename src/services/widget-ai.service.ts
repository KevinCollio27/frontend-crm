import api from "@/lib/api"
import type { WidgetAIPage } from "@/types/widget-ai"

export interface WidgetAIListParams {
  page?: number
  take?: number
  filter?: string
  is_active?: boolean
  is_whatsapp_agent?: boolean
}

export const widgetAIService = {
  async list(params: WidgetAIListParams = {}): Promise<WidgetAIPage> {
    const res = await api.get<never, { data: WidgetAIPage }>("ai/widgets", { params })
    return res.data
  },
}
