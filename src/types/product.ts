export interface ProductLabelOptionRaw {
  id: number
  value: string
  order_number: number | null
}

export interface ProductLabelRaw {
  id: number
  name: string
  key: string
  type: string
  order_number: number | null
  is_conditional: boolean
  product_label_option: ProductLabelOptionRaw[]
}

export interface ProductRaw {
  id: number
  name: string
  created_at: string
  updated_at: string
  workspace_id: number | null
  is_deleted: boolean
  product_label: ProductLabelRaw[]
}

export interface ProductPage {
  data: ProductRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}
