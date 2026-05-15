import api from "@/lib/api"
import type { CampaignPage, CampaignRaw } from "@/types/campaign"

interface BackendResponse {
  campaigns: CampaignRaw[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CampaignListParams {
  page?: number
  limit?: number
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
    }
  },
}
