import api from "@/lib/api"
import type {
  PersonFullRaw,
  PersonPage,
  PersonDuplicateGroup,
  PersonDuplicateCandidate,
  MergeContactsPayload,
  MergeContactsResult,
} from "@/types/contact"

export interface ContactListParams {
  page?: number
  take?: number
  filter?: string
  organization_id?: number
  country?: string[]
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CountryCount {
  code: string
  count: number
}

export interface ImportPreviewRow {
  row: number
  name: string
  organization_id: number | null
  organization_name: string | null
  organization_not_found: boolean
  email: string | null
  email_label_id: number | null
  email_option: string | null
  phone: string | null
  phone_label_id: number | null
  phone_option: string | null
}

export interface ImportPreviewError {
  row: number
  name: string
  reason: string
}

export interface PersonDetailPayload {
  id: number | null  // catalog option ID (→ option_id via backend adapter)
  label_id: number
  option: string
  value: string
}

export interface PersonPayload {
  name: string
  organization_id: number | null
  pais_origen: string
  contact_source: string | null
  internal_position: string | null
  birth_date: string | null
  linkedin_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  facebook_url: string | null
  email: PersonDetailPayload[]
  phone: PersonDetailPayload[]
  charge: PersonDetailPayload[]
  tag: PersonDetailPayload[]
}

export const contactService = {
  async list(params: ContactListParams = {}): Promise<PersonPage> {
    const t0 = performance.now()
    const res = await api.get<never, { people: PersonPage }>("person", { params })
    console.log(`[contact] list page=${params.page ?? 1} filter="${params.filter ?? ""}" → ${(performance.now() - t0).toFixed(1)}ms`)
    return res.people
  },

  async checkDuplicates(emails: string[], phones: string[]): Promise<{ existingEmails: string[]; existingPhones: string[] }> {
    const res = await api.post<never, { existingEmails: string[]; existingPhones: string[] }>("person/check-duplicates", { emails, phones })
    return { existingEmails: res.existingEmails, existingPhones: res.existingPhones }
  },

  async getById(id: number): Promise<PersonFullRaw> {
    const t0 = performance.now()
    const res = await api.get<never, { person: PersonFullRaw }>(`person/${id}`)
    console.log(`[contact] getById id=${id} → ${(performance.now() - t0).toFixed(1)}ms`)
    return res.person
  },

  async create(payload: PersonPayload): Promise<PersonFullRaw> {
    const t0 = performance.now()
    const res = await api.post<never, { person: PersonFullRaw }>("person", payload)
    console.log(`[contact] create "${payload.name}" → ${(performance.now() - t0).toFixed(1)}ms`)
    return res.person
  },

  async update(id: number, payload: PersonPayload): Promise<PersonFullRaw> {
    const t0 = performance.now()
    const res = await api.put<never, { person: PersonFullRaw }>(`person/${id}`, payload)
    console.log(`[contact] update id=${id} "${payload.name}" → ${(performance.now() - t0).toFixed(1)}ms`)
    return res.person
  },

  async delete(id: number): Promise<void> {
    const t0 = performance.now()
    await api.delete(`person/${id}`)
    console.log(`[contact] delete id=${id} → ${(performance.now() - t0).toFixed(1)}ms`)
  },

  async checkCanDelete(id: number): Promise<{ canDelete: boolean; message?: string; opportunityCount?: number }> {
    const t0 = performance.now()
    const res = await api.get<never, { data: { canDelete: boolean; message?: string; opportunityCount?: number } }>(`person/${id}/can-delete`)
    console.log(`[contact] checkCanDelete id=${id} canDelete=${res.data.canDelete} → ${(performance.now() - t0).toFixed(1)}ms`)
    return res.data
  },

  async linkToOrg(id: number, orgId: number): Promise<PersonFullRaw> {
    const t0 = performance.now()
    console.log(`[contact] linkToOrg start id=${id} orgId=${orgId}`)
    const person = await contactService.getById(id)
    const details: PersonDetailPayload[] = person.person_detail.map((d) => ({
      id:       null,
      label_id: d.label_id ?? 0,
      option:   d.option,
      value:    d.value,
    }))
    const payload: PersonPayload = {
      name:              person.name,
      organization_id:   orgId,
      pais_origen:       person.pais_origen,
      contact_source:    person.contact_source,
      internal_position: person.internal_position,
      birth_date:        person.birth_date,
      linkedin_url:      person.linkedin_url,
      instagram_url:     person.instagram_url,
      twitter_url:       person.twitter_url,
      facebook_url:      person.facebook_url,
      email:  details,
      phone:  [],
      charge: [],
      tag:    [],
    }
    const result = await contactService.update(id, payload)
    console.log(`[contact] linkToOrg OK → ${(performance.now() - t0).toFixed(1)}ms`)
    return result
  },

  async unlinkFromOrg(id: number): Promise<PersonFullRaw> {
    const t0 = performance.now()
    console.log(`[contact] unlinkFromOrg start id=${id}`)
    const person = await contactService.getById(id)
    const details: PersonDetailPayload[] = person.person_detail.map((d) => ({
      id:       null,
      label_id: d.label_id ?? 0,
      option:   d.option,
      value:    d.value,
    }))
    const payload: PersonPayload = {
      name:              person.name,
      organization_id:   null,
      pais_origen:       person.pais_origen,
      contact_source:    person.contact_source,
      internal_position: person.internal_position,
      birth_date:        person.birth_date,
      linkedin_url:      person.linkedin_url,
      instagram_url:     person.instagram_url,
      twitter_url:       person.twitter_url,
      facebook_url:      person.facebook_url,
      email:  details,
      phone:  [],
      charge: [],
      tag:    [],
    }
    const result = await contactService.update(id, payload)
    console.log(`[contact] unlinkFromOrg OK → ${(performance.now() - t0).toFixed(1)}ms`)
    return result
  },

  async findDuplicates(): Promise<PersonDuplicateGroup[]> {
    const res = await api.get<never, { groups: PersonDuplicateGroup[] }>("person/duplicates")
    return res.groups
  },

  async getMergeCandidate(id: number): Promise<PersonDuplicateCandidate> {
    const res = await api.get<never, { person: PersonDuplicateCandidate }>(`person/${id}/merge-candidate`)
    return res.person
  },

  async merge(payload: MergeContactsPayload): Promise<MergeContactsResult> {
    const res = await api.post<never, MergeContactsResult>("person/merge", payload)
    return res
  },

  async exportContacts(): Promise<void> {
    await api.get("person/export")
  },

  async getImportTemplate(): Promise<string> {
    const res = await api.get<never, { url: string }>("person/import-template")
    return res.url
  },

  async previewImport(base64String: string): Promise<{ rows: ImportPreviewRow[]; errors: ImportPreviewError[] }> {
    return api.post<never, { rows: ImportPreviewRow[]; errors: ImportPreviewError[] }>("person/import-preview", { base64String })
  },

  async countryCounts(): Promise<CountryCount[]> {
    const t0 = performance.now()
    const res = await api.get<never, { countries: CountryCount[] }>("person/countries")
    console.log(`[contact] countryCounts ${res.countries?.length ?? 0} países → ${(performance.now() - t0).toFixed(1)}ms`)
    return res.countries ?? []
  },
}
