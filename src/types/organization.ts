export interface OrganizationDetail {
  id: number
  label_id: number | null
  option_id: number | null
  option: string
  value: string
  label?: { id: number; name: string; key: string; type: string }
}

// Payload que espera el backend en POST /organization y PUT /organization/:id
export interface OrganizationAddressItem {
  label_id: number | null
  id: number | null    // option_id del catálogo
  option: string       // texto de la opción (ej: "Sede principal")
  value: string        // dirección real
}

export interface OrganizationPayload {
  name: string
  document_number?: string | null
  web_page?: string | null
  industry?: string | null
  pais_origen?: string
  linkedin_url?: string | null
  instagram_url?: string | null
  twitter_url?: string | null
  facebook_url?: string | null
  address: OrganizationAddressItem[]
  tag: unknown[]
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

export interface OrganizationDuplicateCandidate {
  id: number
  name: string
  document_number: string | null
  web_page: string | null
  industry: string | null
  pais_origen: string
  linkedin_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  facebook_url: string | null
  created_at: string
  organization_detail: OrganizationDetail[]
  counts: {
    opportunities: number
    notes: number
    contacts: number
    challenges: number
  }
}

export interface OrganizationDuplicateGroup {
  key: string
  organizations: OrganizationDuplicateCandidate[]
}

export interface MergeOrganizationsPayload {
  survivorId: number
  loserIds: number[]
  fieldOverrides?: Record<string, string | null>
  detailResolutions?: { label_id: number | null; option_id: number | null; value: string }[]
}

export interface MergeOrganizationsResult {
  organization: OrganizationRaw
  reassigned: {
    opportunities: number
    notes: number
    contacts: number
    challenges: number
  }
}

export interface OrgDetailData {
  id: number
  name: string
  document_number: string | null
  web_page: string | null
  industry: string | null
  pais_origen: string
  origin: string
  contact_source: string | null
  created_at: string
  linkedin_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  facebook_url: string | null
  owner: { id: number; name: string; avatarUrl: string | null } | null
  contacts: { id: number; name: string }[]
}
