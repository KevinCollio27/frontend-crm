export interface FormFlow {
  id: number
  name: string
}

export interface FormRaw {
  id: number
  workspace_id: number
  flow_id: number
  name: string
  slug: string
  base_config: unknown
  is_active: boolean
  created_at: string
  updated_at: string
  flow: FormFlow
}

export interface FormPage {
  data: FormRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}
