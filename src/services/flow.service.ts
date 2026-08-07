import api from "@/lib/api"
import type { Flow, FlowPage, FlowStage } from "@/types/flow"

export interface FlowListParams {
  page?: number
  take?: number
  filter?: string
}

export interface UsageResult {
  isInUse: boolean
  usageCount: number
}

export interface DeleteResult {
  success: boolean
  message?: string
}

// Flows change rarely during a session — cache 5 minutos + single-flight
const FLOW_TTL_MS = 5 * 60 * 1000
let flowCache: { data: Flow[]; expiresAt: number } | null = null
let flowInFlight: Promise<Flow[]> | null = null

export const flowService = {
  async all(): Promise<Flow[]> {
    const now = Date.now()

    if (flowCache && now < flowCache.expiresAt) {
      console.log("[flow] all() → cache hit")
      return flowCache.data
    }

    if (flowInFlight) {
      console.log("[flow] all() → in-flight, sharing promise")
      return flowInFlight
    }

    const t0 = performance.now()
    flowInFlight = api
      .get<never, { flows: Flow[] }>("flow/all")
      .then((res) => {
        flowCache    = { data: res.flows, expiresAt: Date.now() + FLOW_TTL_MS }
        flowInFlight = null
        console.log(`[flow] all() → fetched ${res.flows.length} flows in ${(performance.now() - t0).toFixed(0)}ms`)
        return res.flows
      })
      .catch((err) => {
        flowInFlight = null
        throw err
      })

    return flowInFlight
  },

  /** Invalida el caché (llamar tras crear/editar/borrar un flujo) */
  invalidateCache() {
    flowCache    = null
    flowInFlight = null
  },

  async list(params: FlowListParams = {}): Promise<FlowPage> {
    const res = await api.get<never, { flows: FlowPage }>("flow", { params })
    return res.flows
  },

  async create(params: { name: string; isDefault?: boolean }): Promise<Flow> {
    const res = await api.post<never, { flow: Flow }>("flow", { name: params.name, is_default: params.isDefault })
    flowService.invalidateCache()
    return res.flow
  },

  async duplicate(id: number): Promise<Flow> {
    const res = await api.post<never, { flow: Flow }>(`flow/${id}/duplicate`)
    flowService.invalidateCache()
    return res.flow
  },

  async update(id: number, params: { name: string; isDefault?: boolean }): Promise<Flow> {
    const res = await api.put<never, { flow: Flow }>(`flow/${id}`, { name: params.name, is_default: params.isDefault })
    flowService.invalidateCache()
    return res.flow
  },

  // El backend responde HTTP 200 tanto si se pudo eliminar como si está bloqueado por uso —
  // la diferencia viene en el campo `success`, nunca lanza como error de red.
  async delete(id: number): Promise<DeleteResult> {
    const res = await api.delete<never, { success: boolean; message?: string }>(`flow/${id}`)
    flowService.invalidateCache()
    return { success: res.success, message: res.message }
  },

  async activate(id: number): Promise<Flow> {
    const res = await api.put<never, { flow: Flow }>(`flow/${id}/activate`)
    flowService.invalidateCache()
    return res.flow
  },

  async deactivate(id: number): Promise<Flow> {
    const res = await api.put<never, { flow: Flow }>(`flow/${id}/deactivate`)
    flowService.invalidateCache()
    return res.flow
  },

  async checkUsage(id: number): Promise<UsageResult> {
    const res = await api.get<never, { data: UsageResult }>(`flow/${id}/usage`)
    return res.data
  },

  async createStage(params: { name: string; orderNumber: number; flowId: number }): Promise<FlowStage> {
    const res = await api.post<never, { data: FlowStage }>("flow-stage", {
      name: params.name,
      order_number: params.orderNumber,
      flow_id: params.flowId,
    })
    flowService.invalidateCache()
    return res.data
  },

  async updateStage(id: number, params: { name: string; orderNumber: number; flowId: number }): Promise<FlowStage> {
    const res = await api.put<never, { data: FlowStage }>(`flow-stage/${id}`, {
      name: params.name,
      order_number: params.orderNumber,
      flow_id: params.flowId,
    })
    flowService.invalidateCache()
    return res.data
  },

  // Igual que delete de flow: HTTP 200 siempre, `success:false` si la etapa está en uso.
  async deleteStage(id: number): Promise<DeleteResult> {
    const res = await api.delete<never, { success: boolean; message?: string }>(`flow-stage/${id}`)
    flowService.invalidateCache()
    return { success: res.success, message: res.message }
  },

  async updateManyStages(stages: { id: number; name: string; orderNumber: number; flowId: number }[]): Promise<void> {
    await api.post(
      "flow-stage/update-many",
      stages.map((s) => ({ id: s.id, name: s.name, order_number: s.orderNumber, flow_id: s.flowId }))
    )
    flowService.invalidateCache()
  },
}
