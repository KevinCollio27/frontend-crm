import api from "@/lib/api"
import type { PersonInterestRaw } from "@/types/interest"

interface InterestCreatePayload {
  person_id:    number
  description:  string
  order_number: number
}

export const interestService = {
  async list(personId: number): Promise<PersonInterestRaw[]> {
    const res = await api.get<never, { data: PersonInterestRaw[] }>("person-interest", {
      params: { personId },
    })
    return res.data ?? []
  },

  async create(data: InterestCreatePayload): Promise<PersonInterestRaw> {
    const res = await api.post<never, { data: PersonInterestRaw }>("person-interest", data)
    return res.data
  },

  async update(id: number, data: { description: string }): Promise<PersonInterestRaw> {
    const res = await api.put<never, { data: PersonInterestRaw }>(`person-interest/${id}`, data)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`person-interest/${id}`)
  },
}
