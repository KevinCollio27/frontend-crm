import api from "@/lib/api"
import type { OpportunityPage } from "@/types/opportunity"

export interface OpportunityListParams {
  page?: number
  take?: number
  filter?: string
  flow_id?: number
}

export const opportunityService = {
  async list(params: OpportunityListParams = {}): Promise<OpportunityPage> {
    const res = await api.get<never, { opportunities: OpportunityPage }>(
      "opportunity",
      { params }
    )
    return res.opportunities
  },
}
