import api from "@/lib/api"
import type { InvitationPage, InviteLinkRaw, TeamPage } from "@/types/team"

export interface TeamListParams {
  page?: number
  take?: number
  filter?: string
  is_active?: boolean
  is_admin?: boolean
}

export interface InvitationListParams {
  page?: number
  take?: number
  filter?: string
}

export const teamService = {
  async list(params: TeamListParams = {}): Promise<TeamPage> {
    const res = await api.get<never, { workspaceUsers: TeamPage }>("user-workspace", { params })
    return res.workspaceUsers
  },

  async listInvitations(params: InvitationListParams = {}): Promise<InvitationPage> {
    const res = await api.get<never, { invitations: InvitationPage }>("invitation", { params })
    return res.invitations
  },

  async inviteUsers(emails: string[]): Promise<void> {
    await api.post("auth/invite-user-to-workspace", { emails })
  },

  async resendInvitation(id: number): Promise<void> {
    await api.put("invitation/resend", { id })
  },

  async cancelInvitation(id: number): Promise<void> {
    await api.put("invitation/cancel", { id })
  },

  async removeUser(id: number): Promise<void> {
    await api.put("user-workspace/remove", { id })
  },

  async activateUser(id: number, active: boolean): Promise<void> {
    await api.put("user-workspace/activate", { id, active })
  },

  async setAdmin(id: number, isAdmin: boolean): Promise<void> {
    await api.put("user-workspace/admin", { id, isAdmin })
  },

  async transferOwnership(id: number): Promise<void> {
    await api.put("user-workspace/owner", { id })
  },

  async setWhatsAppEnabled(userWorkspaceId: number, enabled: boolean): Promise<void> {
    await api.put(`whatsapp/user-workspace/${userWorkspaceId}/enable`, { enabled })
  },

  async leaveWorkspace(id: number): Promise<void> {
    await api.put("user-workspace/leave", { id })
  },

  async getInviteLink(): Promise<InviteLinkRaw | null> {
    const res = await api.get<never, { link: InviteLinkRaw | null }>("invitation/invite-link")
    return res.link
  },

  async generateInviteLink(): Promise<InviteLinkRaw> {
    const res = await api.post<never, { link: InviteLinkRaw }>("invitation/invite-link/generate")
    return res.link
  },

  async toggleInviteLink(): Promise<InviteLinkRaw> {
    const res = await api.put<never, { link: InviteLinkRaw }>("invitation/invite-link/toggle")
    return res.link
  },
}
