import api from "@/lib/api"
import type { FollowUpPage, FollowUpStats } from "@/types/follow-up"
import { createParamCache } from "@/lib/param-cache"

// Mismo criterio de TTL que dashboard.service.ts — ver comentario ahí. Acá además dedupea el
// caso puntual de FollowUpKpis + FollowUpRiskSummary pidiendo el mismo getStats() en paralelo.
const STATS_TTL_MS = 30 * 1000

const statsCache = createParamCache<{ flowId?: number } | undefined, FollowUpStats>(async (params) => {
  const t0 = performance.now()
  const res = await api.get<never, { stats: FollowUpStats }>("follow-up-stats/stats", { params })
  console.log(`[follow-up] getStats(${JSON.stringify(params ?? {})}) → ${(performance.now() - t0).toFixed(1)}ms`)
  return res.stats
}, STATS_TTL_MS)

const daysWithoutContactCache = createParamCache<{ page?: number; take?: number; flowId?: number } | undefined, FollowUpPage>(async (params) => {
  const t0 = performance.now()
  const res = await api.get<never, { opportunities: FollowUpPage }>("follow-up-stats/days-without-contact", { params })
  console.log(`[follow-up] daysWithoutContact(${JSON.stringify(params ?? {})}) → ${(performance.now() - t0).toFixed(1)}ms`)
  return res.opportunities
}, STATS_TTL_MS)

export const followUpService = {
  async getStats(params: { flowId?: number } = {}): Promise<FollowUpStats> {
    return statsCache.get(params)
  },

  async daysWithoutContact(params: { page?: number; take?: number; flowId?: number } = {}): Promise<FollowUpPage> {
    return daysWithoutContactCache.get(params)
  },

  invalidateCache() {
    statsCache.invalidate()
    daysWithoutContactCache.invalidate()
  },
}
