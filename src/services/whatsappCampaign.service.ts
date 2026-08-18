import api from "@/lib/api"
import type { DispatchWhatsappCampaignPayload, WhatsappCampaignRaw } from "@/types/whatsappCampaign"

export const whatsappCampaignService = {
  async list(): Promise<WhatsappCampaignRaw[]> {
    const res = await api.get<never, { campaigns: WhatsappCampaignRaw[] }>("whatsapp/campaigns")
    return res.campaigns
  },

  async getById(id: number): Promise<WhatsappCampaignRaw> {
    const res = await api.get<never, { campaign: WhatsappCampaignRaw }>(`whatsapp/campaigns/${id}`)
    return res.campaign
  },

  async dispatch(payload: DispatchWhatsappCampaignPayload): Promise<{ campaignId: number; recipientCount: number }> {
    return api.post("whatsapp/campaigns", payload)
  },
}
