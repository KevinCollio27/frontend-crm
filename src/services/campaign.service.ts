import api from "@/lib/api"
import type { CampaignPage, CampaignRaw } from "@/types/campaign"

export interface CampaignContactEvent {
  email: string
  person_id: number | null
  events: string[]
  last_at: string
}

interface BackendResponse {
  campaigns: CampaignRaw[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
  dailyUsage: { used: number; limit: number }
}

export interface CampaignListParams {
  page?: number
  limit?: number
}

export interface CampaignDispatchPayload {
  campaignName: string
  audience: "all" | "recent" | "organization" | "specific" | "custom_list"
  subject: string
  message: string
  personIds?: number[]
  organizationId?: number
  customRecipients?: { name: string; email: string }[]
  blocksJson?: unknown[]
}

export interface CampaignDispatchResult {
  dispatchId: number
  status: "processing" | "sent" | "partial" | "failed"
  contactCount: number
  sent?: number
  failed?: number
  errors?: string[]
}

export const campaignService = {
  async list(params: CampaignListParams = {}): Promise<CampaignPage> {
    const res = await api.get<never, BackendResponse>("marketing/campaigns", { params })
    return {
      data: res.campaigns,
      total: res.pagination.total,
      totalPages: res.pagination.totalPages,
      page: res.pagination.page,
      pageSize: res.pagination.limit,
      dailyUsage: res.dailyUsage ?? { used: 0, limit: 5000 },
    }
  },

  async getById(id: number): Promise<CampaignRaw> {
    const res = await api.get<never, { campaign: CampaignRaw }>(`marketing/campaigns/${id}`)
    return res.campaign
  },

  async getEvents(id: number): Promise<CampaignContactEvent[]> {
    const res = await api.get<never, { contacts: CampaignContactEvent[] }>(`marketing/campaigns/${id}/events`)
    return res.contacts
  },

  async dispatch(payload: CampaignDispatchPayload): Promise<CampaignDispatchResult> {
    const res = await api.post<never, { data: CampaignDispatchResult }>("marketing/dispatch", payload)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`marketing/campaigns/${id}`)
  },
}
