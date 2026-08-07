import api from "@/lib/api"

export interface OrgChallengeRaw {
  id:           number
  description:  string
  order_number: number
  organization_id: number
  created_at:   string
  updated_at:   string
}

export interface ChallengCreatePayload {
  description:     string
  organization_id: number
  order_number:    number
}

export const orgChallengeService = {
  async list(organizationId: number): Promise<OrgChallengeRaw[]> {
    const res = await api.get<never, { data: OrgChallengeRaw[] }>("organization-challenge", {
      params: { organizationId },
    })
    return res.data ?? []
  },

  async create(data: ChallengCreatePayload): Promise<OrgChallengeRaw> {
    const res = await api.post<never, { data: OrgChallengeRaw }>("organization-challenge", data)
    return res.data
  },

  async update(id: number, data: Partial<ChallengCreatePayload>): Promise<OrgChallengeRaw> {
    const res = await api.put<never, { data: OrgChallengeRaw }>(`organization-challenge/${id}`, data)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`organization-challenge/${id}`)
  },
}
