export interface PersonDetail {
  id: number
  label_id: number | null
  option_id: number | null
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

export interface PersonDuplicateCandidate {
  id: number
  name: string
  organization_id: number | null
  organization_name: string | null
  pais_origen: string
  contact_source: string | null
  internal_position: string | null
  birth_date: string | null
  linkedin_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  facebook_url: string | null
  created_at: string
  person_detail: PersonDetail[]
  counts: {
    opportunities: number
    notes: number
    interests: number
  }
}

export interface PersonDuplicateGroup {
  key: string
  hasMultipleOrgs: boolean
  candidates: PersonDuplicateCandidate[]
}

export interface MergeContactsPayload {
  survivorId: number
  loserIds: number[]
  fieldOverrides?: Record<string, string | null>
  detailResolutions?: { label_id: number | null; option_id: number | null; value: string }[]
}

export interface MergeContactsResult {
  person: PersonFullRaw
  reassigned: {
    opportunities: number
    notes: number
    interests: number
  }
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

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface OrganizationFull {
  id: number
  name: string
  document_number: string | null
  web_page: string | null
  industry: string | null
  pais_origen: string
}

export interface PersonFullRaw extends Omit<Person, "organization"> {
  organization: OrganizationFull | null
}

export interface ContactDetailData {
  id: number
  name: string
  internal_position: string | null
  birth_date: string | null
  country_code: string
  contact_source: string | null
  origin: string
  created_at: string
  linkedin_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  facebook_url: string | null
  owner: { id: number; name: string; avatarUrl: string | null } | null
  organization: {
    id: number
    name: string
    industry: string | null
    taxId: string | null
    website: string | null
  } | null
  email: string | null
  phone: string | null
}
