import api from "@/lib/api"
import type { PersonPage } from "@/types/contact"

export interface ContactListParams {
  page?: number
  take?: number
  filter?: string
  organization_id?: number
  country?: string[]
}

export interface CountryCount {
  code: string
  count: number
}

export const contactService = {
  async list(params: ContactListParams = {}): Promise<PersonPage> {
    const res = await api.get<never, { people: PersonPage }>("person", { params })
    return res.people
  },

  async countryCounts(): Promise<CountryCount[]> {
    const res = await api.get<never, { countries: CountryCount[] }>("person/countries")
    return res.countries ?? []
  },
}
