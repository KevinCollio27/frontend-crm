import api from "@/lib/api"
import type {
  OrganizationPage,
  OrganizationPayload,
  OrganizationRaw,
  OrganizationDuplicateGroup,
  OrganizationDuplicateCandidate,
  MergeOrganizationsPayload,
  MergeOrganizationsResult,
  MoveOrganizationsWorkspacePreview,
  MoveOrganizationsWorkspacePayload,
  MoveOrganizationsWorkspaceResult,
} from "@/types/organization"

export interface OrganizationListParams {
  page?: number
  take?: number
  filter?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface OrganizationOption {
  id: number
  name: string
}

export interface ImportPreviewRow {
  row: number
  name: string
  document_number: string | null
  address: string | null
  address_label_id: number | null
  address_option: string | null
}

export interface ImportPreviewError {
  row: number
  name: string
  reason: string
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

  async getById(id: number): Promise<OrganizationRaw> {
    const res = await api.get<never, { organization: OrganizationRaw }>(`organization/${id}`)
    return res.organization
  },

  async create(payload: OrganizationPayload): Promise<OrganizationRaw> {
    const res = await api.post<never, { organization: OrganizationRaw }>("organization", payload)
    return res.organization
  },

  async update(id: number, payload: OrganizationPayload): Promise<OrganizationRaw> {
    const res = await api.put<never, { organization: OrganizationRaw }>(`organization/${id}`, payload)
    return res.organization
  },

  async delete(id: number): Promise<void> {
    await api.delete(`organization/${id}`)
  },

  async checkCanDelete(id: number): Promise<{ canDelete: boolean; message?: string; relatedCount?: number }> {
    const res = await api.get<never, { data: { canDelete: boolean; message?: string; relatedCount?: number } }>(`organization/${id}/can-delete`)
    return res.data
  },

  async findDuplicates(): Promise<OrganizationDuplicateGroup[]> {
    const res = await api.get<never, { groups: OrganizationDuplicateGroup[] }>("organization/duplicates")
    return res.groups
  },

  async getMergeCandidate(id: number): Promise<OrganizationDuplicateCandidate> {
    const res = await api.get<never, { organization: OrganizationDuplicateCandidate }>(`organization/${id}/merge-candidate`)
    return res.organization
  },

  async merge(payload: MergeOrganizationsPayload): Promise<MergeOrganizationsResult> {
    const res = await api.post<never, MergeOrganizationsResult>("organization/merge", payload)
    return res
  },

  async exportOrganizations(): Promise<void> {
    await api.get("organization/export")
  },

  async getImportTemplate(): Promise<string> {
    const res = await api.get<never, { url: string }>("organization/import-template")
    return res.url
  },

  async previewImport(base64String: string): Promise<{ rows: ImportPreviewRow[]; errors: ImportPreviewError[] }> {
    return api.post<never, { rows: ImportPreviewRow[]; errors: ImportPreviewError[] }>("organization/import-preview", { base64String })
  },

  async checkDuplicates(names: string[], documentNumbers: string[]): Promise<{ existingNames: string[]; existingDocumentNumbers: string[] }> {
    return api.post<never, { existingNames: string[]; existingDocumentNumbers: string[] }>("organization/check-duplicates", { names, documentNumbers })
  },

  async previewMoveWorkspace(organizationIds: number[], targetWorkspaceId: number): Promise<MoveOrganizationsWorkspacePreview> {
    return api.post<never, MoveOrganizationsWorkspacePreview>("organization/move-workspace/preview", { organizationIds, targetWorkspaceId })
  },

  async moveWorkspace(payload: MoveOrganizationsWorkspacePayload): Promise<MoveOrganizationsWorkspaceResult> {
    return api.post<never, MoveOrganizationsWorkspaceResult>("organization/move-workspace", payload)
  },
}
