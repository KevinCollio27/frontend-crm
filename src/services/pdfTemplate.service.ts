import api from "@/lib/api"
import type { PdfTemplate, PdfTemplateDraft } from "@/types/pdfTemplate"

export const pdfTemplateService = {
  async getDefault(): Promise<PdfTemplate | null> {
    const res = await api.get<never, { data: PdfTemplate | null }>("pdf-template/default")
    return res.data ?? null
  },

  async getAll(): Promise<PdfTemplate[]> {
    const res = await api.get<never, { data: PdfTemplate[] }>("pdf-template")
    return res.data ?? []
  },

  async getById(id: number): Promise<PdfTemplate | null> {
    const res = await api.get<never, { data: PdfTemplate | null }>(`pdf-template/${id}`)
    return res.data ?? null
  },

  async create(data: PdfTemplateDraft): Promise<PdfTemplate> {
    const res = await api.post<never, { data: PdfTemplate }>("pdf-template", data)
    return res.data
  },

  async update(id: number, data: Partial<PdfTemplateDraft>): Promise<PdfTemplate> {
    const res = await api.put<never, { data: PdfTemplate }>(`pdf-template/${id}`, data)
    return res.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`pdf-template/${id}`)
  },

  async setDefault(id: number): Promise<PdfTemplate> {
    const res = await api.patch<never, { data: PdfTemplate }>(`pdf-template/${id}/default`)
    return res.data
  },
}
