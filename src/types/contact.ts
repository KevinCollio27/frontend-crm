export interface PersonDetail {
  id: number
  label_id: number | null
  option: string
  value: string
  label?: { id: number; name: string; key: string; type: string }
}

export interface Person {
  id: number
  name: string
  organization_id: number | null
  workspace_id: number | null
  created_at: string
  updated_at: string
  origin: string
  internal_position: string | null
  birth_date: string | null
  pais_origen: string
  contact_source: string | null
  linkedin_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  facebook_url: string | null
  owner_user_id: number | null
  person_detail: PersonDetail[]
  organization: { id: number; name: string } | null
}

export interface PersonPage {
  data: Person[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  count: number
  nextPage: number | null
  prevPage: number | null
}
