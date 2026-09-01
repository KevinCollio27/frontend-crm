import api from "@/lib/api"
import type { SalesOpportunitiesStats, SalesQuotationsStats } from "@/types/sales"

export const salesService = {
  async getOpportunitiesStats(params?: { flowId?: number; datePreset?: string }): Promise<SalesOpportunitiesStats> {
    const res = await api.get<never, { stats: SalesOpportunitiesStats }>("sales-stats/opportunities", { params })
    return res.stats
  },

  async getQuotationsStats(params?: { flowId?: number; datePreset?: string }): Promise<SalesQuotationsStats> {
    const res = await api.get<never, { stats: SalesQuotationsStats }>("sales-stats/quotations", { params })
    return res.stats
  },
}
