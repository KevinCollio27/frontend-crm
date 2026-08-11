import api from "@/lib/api"
import type { Workspace } from "@/types/workspace"

export interface WorkspaceUpdatePayload {
  name: string
  country: { id: string; name: string }
  timezone: { id: string; name: string }
  currency: { id: number; name: string }
  logo?: string
  legal_name?: string
  trade_name?: string
  tax_id?: string
  industry?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_website?: string
  objective?: string
  business_description?: string
}

export interface PlatformAdminWorkspaceOverview {
  id: number
  name: string
  agent_enabled: boolean
  industry: string | null
  created_at: string
  pending_request: { id: number; status: string; created_at: string } | null
}

export const workspaceService = {
  async get(): Promise<Workspace> {
    const res = await api.get<never, { workspace: Workspace }>("workspace")
    return res.workspace
  },

  // Solo para admins de plataforma (allowlist por env en el backend) — lista TODOS
  // los workspaces, no solo los del usuario logueado.
  async getPlatformAdminOverview(): Promise<PlatformAdminWorkspaceOverview[]> {
    const res = await api.get<never, { workspaces: PlatformAdminWorkspaceOverview[] }>("workspace/admin/overview")
    return res.workspaces
  },

  async update(payload: WorkspaceUpdatePayload): Promise<Workspace> {
    const res = await api.put<never, { workspace: Workspace }>("workspace", payload)
    return res.workspace
  },

  async generateApiToken(active: boolean, flow_id: number): Promise<string> {
    const res = await api.post<never, { workspaceToken: string }>("workspace/api-token", { active, flow_id })
    return res.workspaceToken
  },

  async uploadLogo(fileName: string, base64File: string): Promise<string> {
    const res = await api.post<never, { data: { logo_url: string } }>(
      "workspace/upload-logo",
      { fileName, base64File }
    )
    return res.data.logo_url
  },

  async deactivate(): Promise<void> {
    await api.delete("workspace/deactivate")
  },
}
