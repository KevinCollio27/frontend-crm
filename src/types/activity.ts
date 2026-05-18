export interface ActivityDetailRaw {
  id: number
  label_id: number | null
  option: string
  value: string
  opportunity_activity_id: number | null
  label: {
    id: number
    key: string
    name: string
    type: string
  } | null
}

export interface ActivityRaw {
  id: number
  title: string | null
  date_from: string | null
  date_to: string | null
  is_completed: boolean
  created_at: string
  ubication: string | null
  user: { id: number; name: string } | null
  opportunity: {
    id: number
    name: string
    flow: { id: number; name: string } | null
    flow_stage: { id: number; name: string } | null
  } | null
  opportunity_activity_detail: ActivityDetailRaw[]
}

export interface ActivityPage {
  data: ActivityRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  count: number
  nextPage: number | null
  prevPage: number | null
}
