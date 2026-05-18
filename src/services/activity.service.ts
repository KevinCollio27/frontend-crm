import api from "@/lib/api"
import type { ActivityPage } from "@/types/activity"

export interface ActivityListParams {
  page?: number
  take?: number
  filter?: string
  is_completed?: boolean
}

export const activityService = {
  async list(params: ActivityListParams = {}): Promise<ActivityPage> {
    const res = await api.get<never, { opportunityActivities: ActivityPage }>(
      "opportunity-activity",
      { params }
    )
    return res.opportunityActivities
  },
}
