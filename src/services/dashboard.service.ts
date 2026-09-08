import api from "@/lib/api"
import type { DashboardStatsRaw } from "@/types/dashboard"
import { createParamCache } from "@/lib/param-cache"

// TTL corto (30s): alcanza para no repetir la misma consulta cara 7 veces cuando todas las
// cards de la tab General montan juntas pidiendo el mismo getStats(), y para que reentrar a
// una tab ya visitada no dispare todo de nuevo — sin dejar los KPIs sensiblemente desactualizados.
const STATS_TTL_MS = 30 * 1000

type StatsParams = { flowId?: number; datePreset?: string } | undefined

const statsCache = createParamCache<StatsParams, DashboardStatsRaw>(async (params) => {
  const res = await api.get<never, { stats: DashboardStatsRaw }>("dashboard-stats/stats", { params })
  return res.stats
}, STATS_TTL_MS)

export const dashboardService = {
  async getStats(params?: { flowId?: number; datePreset?: string }): Promise<DashboardStatsRaw> {
    return statsCache.get(params)
  },

  /** Invalidar tras crear/editar/mover/ganar/perder una oportunidad, o similar, si hace falta data al segundo. */
  invalidateCache() {
    statsCache.invalidate()
  },
}
