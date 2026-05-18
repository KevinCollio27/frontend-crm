export interface OpportunityResponsibleRaw {
  id: number
  is_main: boolean
  users: { id: number; name: string } | null
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
  person: { id: number; name: string } | null
  organization: { id: number; name: string } | null
  flow: { id: number; name: string } | null
  flow_stage: { id: number; name: string } | null
  opportunity_responsible: OpportunityResponsibleRaw[]
  opportunity_net_sales: OpportunitySalesRaw[]
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
