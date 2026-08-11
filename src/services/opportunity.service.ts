import api from "@/lib/api"
import type { OpportunityDetailRaw, OpportunityEmailRaw, OpportunityPage } from "@/types/opportunity"

export interface OpportunityListParams {
  page?: number
  take?: number
  filter?: string
  flow_id?: number
  flow_stage_id?: number
  personId?: number
  organizationId?: number
}

export interface OpportunityPayload {
  name: string
  flow_id: number
  flow_stage_id: number
  person_id?: number | null
  organization_id?: number | null
  plannedClousureDate?: string | null
  description?: string | null
  net_cost?: number | null
  netCostCurrencyId?: number | null
  responsible?: { id: number; isMain: boolean }[]
  priority?: { id: number; label_id: number; option: string }[]
}

export const opportunityService = {
  async list(params: OpportunityListParams = {}): Promise<OpportunityPage> {
    const res = await api.get<never, { opportunities: OpportunityPage }>("opportunity", { params })
    return res.opportunities
  },

  // Conteo real por etapa (no depende de cuántas oportunidades haya cargadas en el
  // Kanban) — para flows grandes como el de Prohabla (500+), el número de la columna
  // no puede salir de contar lo ya renderizado.
  async getStageCounts(flowId: number): Promise<{ stage_id: number; count: number }[]> {
    const res = await api.get<never, { counts: { stage_id: number; count: number }[] }>(
      "opportunity/stage-counts",
      { params: { flowId } }
    )
    return res.counts
  },

  async getById(id: number): Promise<OpportunityDetailRaw> {
    const res = await api.get<never, { data: OpportunityDetailRaw }>(`opportunity/${id}`)
    return res.data
  },

  async listEmails(opportunityId: number): Promise<OpportunityEmailRaw[]> {
    const res = await api.get<never, { emails: OpportunityEmailRaw[] }>(`opportunity/${opportunityId}/email`)
    return res.emails
  },

  async create(payload: OpportunityPayload): Promise<void> {
    await api.post("opportunity", payload)
  },

  async update(id: number, payload: OpportunityPayload): Promise<void> {
    await api.put(`opportunity/${id}`, payload)
  },

  async delete(id: number): Promise<void> {
    await api.delete(`opportunity/${id}`)
  },

  async moveStage(id: number, flowStageId: number, prevStage?: string, nextStage?: string): Promise<void> {
    await api.put(`opportunity/stage/${id}`, { id, flow_stage_id: flowStageId, prevStage, nextStage })
  },

  async won(id: number): Promise<void> {
    await api.put(`opportunity/won/${id}`)
  },

  async lost(id: number, reason?: string): Promise<void> {
    await api.put(`opportunity/lost/${id}`, reason ? { lost_reason: reason } : {})
  },

  async reOpen(id: number): Promise<void> {
    await api.put(`opportunity/reopen/${id}`)
  },

  async getDefaultPdfTemplate(id: number): Promise<{ default_pdf_template_id: number | null }> {
    const res = await api.get<never, { data: { default_pdf_template_id: number | null } }>(`opportunity/${id}/pdf-template`)
    return res.data
  },

  async updateDefaultPdfTemplate(id: number, pdfTemplateId: number | null): Promise<void> {
    await api.patch(`opportunity/${id}/pdf-template`, { pdf_template_id: pdfTemplateId })
  },
}
