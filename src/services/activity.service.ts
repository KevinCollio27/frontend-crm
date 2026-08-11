import api from "@/lib/api"
import type { ActivityPage, ActivityRaw } from "@/types/activity"

export interface ActivityListParams {
  page?: number
  take?: number
  filter?: string
  is_completed?: boolean
  status?: string
  flowId?: number
  personId?: number
  organizationId?: number
  opportunityId?: number
}

export interface ActivityDetailItem {
  name: string
  label_id: number
  option: string
  value: string
  option_id?: number
}

export interface ActivityCreatePayload {
  title: string
  date_from?: string | null
  date_to?: string | null
  responsible: { id: number }
  // Opcional: una actividad de Google Calendar Sync puede no estar ligada a una oportunidad.
  opportunity?: { id: number }
  activity_type: ActivityDetailItem[]
  priority: ActivityDetailItem[]
  ubication?: string | null
  note?: string | null
}

export const activityService = {
  async list(params: ActivityListParams = {}): Promise<ActivityPage> {
    const res = await api.get<never, { opportunityActivities: ActivityPage }>(
      "opportunity-activity",
      { params }
    )
    return res.opportunityActivities
  },

  async getStatusCounts(flowId?: number, opportunityId?: number): Promise<{ counts: { status: string; count: number }[]; overdue: number }> {
    const res = await api.get<never, { counts: { status: string; count: number }[]; overdue: number }>(
      "opportunity-activity/status-counts",
      { params: { flowId, opportunityId } }
    )
    return { counts: res.counts, overdue: res.overdue }
  },

  async getById(id: number): Promise<ActivityRaw> {
    const res = await api.get<never, { opportunityActivity: ActivityRaw }>(
      `opportunity-activity/${id}`
    )
    return res.opportunityActivity
  },

  async listByMonth(firstDayOfMonth: string, lastDayOfMonth: string, workspaceId: number): Promise<ActivityRaw[]> {
    const res = await api.post<never, { opportunityActivity: ActivityRaw[] }>(
      "opportunity-activity/all",
      { firstDayOfMonth, lastDayOfMonth, workspaceId }
    )
    return res.opportunityActivity
  },

  async create(data: ActivityCreatePayload): Promise<{ id: number }> {
    const res = await api.post<never, { data: { id: number } }>("opportunity-activity", data)
    return res.data
  },

  async update(id: number, data: ActivityCreatePayload): Promise<void> {
    await api.put(`opportunity-activity/${id}`, data)
  },

  async delete(id: number): Promise<void> {
    await api.delete(`opportunity-activity/${id}`)
  },

  async updateStatus(id: number, status: string): Promise<void> {
    await api.put(`opportunity-activity/status/${id}`, { status })
  },

  async complete(id: number): Promise<void> {
    await api.put(`opportunity-activity/complete/${id}`)
  },

  async uncomplete(id: number): Promise<void> {
    await api.put(`opportunity-activity/uncomplete/${id}`)
  },
}
