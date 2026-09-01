import api from "@/lib/api"
import type { FollowUpPage, FollowUpStats } from "@/types/follow-up"

export const followUpService = {
  async getStats(params: { flowId?: number } = {}): Promise<FollowUpStats> {
    const res = await api.get<never, { stats: FollowUpStats }>("follow-up-stats/stats", { params })
    return res.stats
  },

  async daysWithoutContact(params: { page?: number; take?: number; flowId?: number } = {}): Promise<FollowUpPage> {
    const res = await api.get<never, { opportunities: FollowUpPage }>("follow-up-stats/days-without-contact", { params })
    return res.opportunities
  },
}
