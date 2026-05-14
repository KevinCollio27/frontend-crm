import api from "@/lib/api"
import type { OrganizationPage } from "@/types/organization"

export interface OrganizationListParams {
  page?: number
  take?: number
  filter?: string
}

export interface OrganizationOption {
  id: number
  name: string
}

export const organizationService = {
  async list(params: OrganizationListParams = {}): Promise<OrganizationPage> {
    const res = await api.get<never, { organizations: OrganizationPage }>("organization", { params })
    return res.organizations
  },

  async allNoPaginate(): Promise<OrganizationOption[]> {
    const res = await api.get<never, { organizations: OrganizationOption[] }>("organization/all-no-paginate")
    return res.organizations ?? []
  },
}
