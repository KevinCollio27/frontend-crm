export interface FlowStage {
  id: number
  flow_id: number
  name: string
  order_number: number
}

export interface Flow {
  id: number
  name: string
  is_active: boolean
  is_default: boolean
  workspace_id: number
  created_at: string
  updated_at: string
  flow_stage: FlowStage[]
}

export interface FlowPage {
  data: Flow[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}
