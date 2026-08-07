import api from "@/lib/api"
import type { QuotationRaw } from "@/types/quotation"

export interface QuotationListParams {
  status?:         string
  opportunity_id?: number
  created_by?:     number
  date_from?:      string
  date_to?:        string
}

export const quotationService = {
  async list(params: QuotationListParams = {}): Promise<QuotationRaw[]> {
    const res = await api.get<never, { data: QuotationRaw[] }>("quotation", { params })
    return res.data ?? []
  },

  async listByOpportunity(opportunityId: number): Promise<QuotationRaw[]> {
    const res = await api.get<never, { data: QuotationRaw[] }>(
      `opportunity/${opportunityId}/quotation`
    )
    return res.data ?? []
  },

  async getById(id: number): Promise<QuotationRaw> {
    const res = await api.get<never, { data: QuotationRaw }>(`quotation/${id}`)
    return res.data
  },

  async create(opportunityId: number, payload: object): Promise<QuotationRaw> {
    const res = await api.post<never, { data: QuotationRaw }>(
      `opportunity/${opportunityId}/quotation`,
      payload
    )
    return res.data
  },

  async update(id: number, payload: object): Promise<QuotationRaw> {
    const res = await api.put<never, { data: QuotationRaw }>(`quotation/${id}`, payload)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`quotation/${id}`)
  },

  // Copia una cotización existente (nombre + " Copy", vuelve a estado borrador, sin
  // historial) — para reutilizar la misma base sin crear todo de cero.
  async duplicate(id: number): Promise<QuotationRaw> {
    const res = await api.post<never, { data: QuotationRaw }>(`quotation/${id}/duplicate`)
    return res.data
  },

  async sendEmail(id: number, payload: {
    to:           string[]
    cc?:          string[]
    bcc?:         string[]
    pdfBase64?:   string
    attachments?: { filename: string; content: string; type: string }[]
  }): Promise<void> {
    const t0 = performance.now()
    await api.post(`quotation/${id}/send-email`, payload)
    console.log(`[quotation] send-email id=${id} to=${payload.to.length} → ${(performance.now() - t0).toFixed(0)}ms`)
  },

  async updateStatus(id: number, status: string): Promise<QuotationRaw> {
    const res = await api.patch<never, { data: QuotationRaw }>(`quotation/${id}/status`, { status })
    return res.data
  },

  async updatePdfTemplate(id: number, pdfTemplateId: number | null): Promise<QuotationRaw> {
    const res = await api.patch<never, { data: QuotationRaw }>(`quotation/${id}/pdf-template`, { pdf_template_id: pdfTemplateId })
    return res.data
  },

  // Incluye workspace, person y organization — solo para generación de PDF
  async getByIdForPDF(id: number): Promise<any> {
    const res = await api.get<never, { data: any }>(`quotation/${id}/full-details`)
    return res.data
  },
}
