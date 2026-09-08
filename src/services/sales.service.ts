import api from "@/lib/api"
import type { SalesOpportunitiesStats, SalesQuotationsStats } from "@/types/sales"
import { createParamCache } from "@/lib/param-cache"

// Mismo criterio de TTL que dashboard.service.ts — ver comentario ahí.
const STATS_TTL_MS = 30 * 1000

type StatsParams = { flowId?: number; datePreset?: string } | undefined

const opportunitiesStatsCache = createParamCache<StatsParams, SalesOpportunitiesStats>(async (params) => {
  const t0 = performance.now()
  const res = await api.get<never, { stats: SalesOpportunitiesStats }>("sales-stats/opportunities", { params })
  console.log(`[sales] getOpportunitiesStats(${JSON.stringify(params ?? {})}) → ${(performance.now() - t0).toFixed(1)}ms`)
  return res.stats
}, STATS_TTL_MS)

const quotationsStatsCache = createParamCache<StatsParams, SalesQuotationsStats>(async (params) => {
  const t0 = performance.now()
  const res = await api.get<never, { stats: SalesQuotationsStats }>("sales-stats/quotations", { params })
  console.log(`[sales] getQuotationsStats(${JSON.stringify(params ?? {})}) → ${(performance.now() - t0).toFixed(1)}ms`)
  return res.stats
}, STATS_TTL_MS)

export const salesService = {
  async getOpportunitiesStats(params?: { flowId?: number; datePreset?: string }): Promise<SalesOpportunitiesStats> {
    return opportunitiesStatsCache.get(params)
  },

  async getQuotationsStats(params?: { flowId?: number; datePreset?: string }): Promise<SalesQuotationsStats> {
    return quotationsStatsCache.get(params)
  },

  invalidateCache() {
    opportunitiesStatsCache.invalidate()
    quotationsStatsCache.invalidate()
  },
}
