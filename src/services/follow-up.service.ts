import api from "@/lib/api"
import type { FollowUpPage } from "@/types/follow-up"

export const followUpService = {
  async daysWithoutContact(params: { page?: number; take?: number; flowId?: number } = {}): Promise<FollowUpPage> {
    const res = await api.get<never, { opportunities: FollowUpPage }>("follow-up-stats/days-without-contact", { params })
    return res.opportunities
  },
}
