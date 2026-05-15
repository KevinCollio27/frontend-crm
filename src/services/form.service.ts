import api from "@/lib/api"
import type { FormPage } from "@/types/form"

export interface FormListParams {
  page?: number
  take?: number
  filter?: string
  is_active?: boolean
}

export const formService = {
  async list(params: FormListParams = {}): Promise<FormPage> {
    const res = await api.get<never, { forms: FormPage }>("widget-forms", { params })
    return res.forms
  },
}
