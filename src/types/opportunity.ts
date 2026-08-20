export interface OpportunityEmailRaw {
  id: number
  opportunity_id: number
  user_id: number
  to: string
  subject: string
  body: string
  signature_html: string | null
  attachment_names: string[] | null
  gmail_message_id: string | null
  gmail_thread_id: string | null
  created_at: string
  user?: { id: number; name: string; email: string } | null
}

export interface OpportunityResponsibleRaw {
  id: number
  is_main: boolean
  users: { id: number; name: string; avatar_url: string | null } | null
}

export interface OpportunitySalesRaw {
  id: number
  is_original: boolean
  value: number
  currency: { id: number; name: string; symbol: string } | null
}

export interface OpportunityRaw {
  id: number
  name: string
  is_won: boolean
  is_lost: boolean
  is_reopened: boolean
  planned_clousure_date: string | null
  created_at: string
  person: {
    id: number
    name: string
    pais_origen: string | null
    person_detail?: { value: string; label: { key: string } | null }[]
  } | null
  organization: { id: number; name: string } | null
  flow: { id: number; name: string } | null
  flow_stage: { id: number; name: string } | null
  opportunity_responsible: OpportunityResponsibleRaw[]
  opportunity_net_sales: OpportunitySalesRaw[]
  _count: { opportunity_activity: number; quotation: number }
}

export interface OpportunityPage {
  data: OpportunityRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  count: number
  nextPage: number | null
  prevPage: number | null
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface OpportunityDetailRaw {
  id: number
  name: string
  description: string | null
  flow_id: number | null
  flow_stage_id: number | null
  person_id: number | null
  organization_id: number | null
  planned_clousure_date: string | null
  is_won: boolean
  is_lost: boolean
  created_at: string
  flow: {
    id: number
    name: string
    flow_stage: { id: number; name: string; order_number: number }[]
  } | null
  person: {
    id: number
    name: string
    person_detail?: { value: string; label: { key: string } | null }[]
  } | null
  organization: {
    id: number
    name: string
    document_number?: string | null
    industry?: string | null
  } | null
  opportunity_detail: {
    id: number
    option_id: number | null
    option: string
    value: string
    label: { id: number; name: string; key: string; type: string } | null
  }[]
  opportunity_responsible: {
    id: number
    is_main: boolean
    users: { id: number; name: string; avatar_url: string | null } | null
  }[]
  opportunity_net_cost: {
    id: number
    value: number
    currency: { id: number; symbol: string; name: string } | null
  }[]
}

export interface OpportunityDetailData {
  id: number
  name: string
  description: string | null
  is_won: boolean
  is_lost: boolean
  flow: { id: number; name: string } | null
  stages: { id: number; name: string; order_number: number }[]
  flow_stage_id: number | null
  planned_clousure_date: string | null
  created_at: string
  owner: { id: number; name: string } | null
  responsibles: { id: number; name: string; is_main: boolean; avatarUrl: string | null }[]
  netCost: number
  currency: string
  person: { id: number; name: string } | null
  person_id: number | null
  organization: {
    id: number
    name: string
    document_number?: string | null
    industry?: string | null
  } | null
  organization_id: number | null
  priority: "alta" | "media" | "baja" | null
  origin: string | null
  person_email: string | null
  person_phone: string | null
}
