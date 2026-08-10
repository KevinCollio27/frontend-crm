import api from "@/lib/api"
import type { FormRaw, FormPage, FormAnswerListResult, FormAnswerRaw, VacanteSummary } from "@/types/form"

export interface FormListParams {
  page?: number
  take?: number
  filter?: string
  is_active?: boolean
}

export interface FormPayload {
  name: string
  slug: string
  flow_id: number
  is_active: boolean
  base_config: Record<string, unknown>
}

export const formService = {
  async list(params: FormListParams = {}): Promise<FormPage> {
    const res = await api.get<never, { forms: FormPage }>("widget-forms", { params })
    return res.forms
  },

  async get(id: number): Promise<FormRaw> {
    const res = await api.get<never, { form: FormRaw }>(`widget-forms/${id}`)
    return res.form
  },

  async create(payload: FormPayload): Promise<FormRaw> {
    const res = await api.post<never, { form: FormRaw }>("widget-forms", payload)
    return res.form
  },

  async update(id: number, payload: Partial<FormPayload>): Promise<FormRaw> {
    const res = await api.patch<never, { form: FormRaw }>(`widget-forms/${id}`, payload)
    return res.form
  },

  async delete(id: number): Promise<void> {
    await api.delete(`widget-forms/${id}`)
  },

  async listAllAnswers(params: { cursor?: string; take?: number; form_id?: number } = {}): Promise<FormAnswerListResult> {
    const res = await api.get<never, FormAnswerListResult>("widget-forms/answers", { params })
    return res
  },

  async hasVacantes(): Promise<boolean> {
    const res = await api.get<never, { hasVacantes: boolean }>("widget-forms/has-vacantes")
    return res.hasVacantes
  },

  async listVacantes(): Promise<VacanteSummary[]> {
    const res = await api.get<never, { vacantes: VacanteSummary[] }>("widget-forms/vacantes")
    return res.vacantes
  },

  async exportVacantes(vacanteIds: number[]): Promise<void> {
    await api.post("widget-forms/vacantes/export", { vacante_ids: vacanteIds })
  },

  async listPostulantesByVacante(vacanteId: number): Promise<FormAnswerRaw[]> {
    const res = await api.get<never, { data: FormAnswerRaw[] }>(`widget-forms/vacantes/${vacanteId}/postulantes`)
    return res.data
  },

  async toggleAnswer(formId: number, answerId: number, isActive: boolean): Promise<void> {
    await api.patch(`widget-forms/${formId}/answers/${answerId}`, { is_active: isActive })
  },

  async getFileUrl(filePath: string, fileName: string): Promise<string> {
    const res = await api.post<never, { url: string }>("widget-forms/file-url", { file_path: filePath, file_name: fileName })
    return res.url
  },

  async uploadImage(fileName: string, base64File: string): Promise<{ url: string; key: string }> {
    const res = await api.post<never, { data: { url: string; key: string } }>(
      "marketing/forms/upload-image",
      { fileName, base64File }
    )
    return res.data
  },
}
