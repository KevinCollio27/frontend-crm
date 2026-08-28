import api from "@/lib/api"
import type { DashboardStatsRaw } from "@/types/dashboard"

export const dashboardService = {
  async getStats(params?: { flowId?: number; datePreset?: string }): Promise<DashboardStatsRaw> {
    const res = await api.get<never, { stats: DashboardStatsRaw }>("dashboard-stats/stats", { params })
    return res.stats
  },
}
