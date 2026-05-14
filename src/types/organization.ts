export interface OrganizationDetail {
  id: number
  label_id: number | null
  option: string
  value: string
  label?: { id: number; name: string; key: string; type: string }
}

export interface OrganizationPerson {
  id: number
  name: string
}

export interface OrganizationRaw {
  id: number
  name: string
  document_number: string | null
  web_page: string | null
  industry: string | null
  pais_origen: string
  origin: string
  contact_source: string | null
  linkedin_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  facebook_url: string | null
  owner_user_id: number | null
  created_at: string
  updated_at: string
  organization_detail: OrganizationDetail[]
  person: OrganizationPerson[]
}

export interface OrganizationPage {
  data: OrganizationRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  count: number
  nextPage: number | null
  prevPage: number | null
}
