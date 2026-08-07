export interface OptionStatusRaw {
  is_active: boolean
}

export interface OptionRaw {
  id: number
  value: string
  order_number: number | null
  workspace_id: number | null
  option_status: OptionStatusRaw[]
}

// Forma simplificada: un label con sus opciones (respuesta de GET /label/options)
export interface LabelOptionsRaw {
  id: number
  key: string
  name: string
  type: string
  workspace_id: number | null
  options: OptionRaw[]
}

// Opción ya procesada, lista para usar en selectores
export interface CatalogOption {
  id: number
  value: string
}

export interface EntityLabelRaw {
  entity: {
    id: number
    name: string
    key: string
  }
}

export interface LabelRaw {
  id: number
  name: string
  key: string
  type: string
  workspace_id: number | null
  options: OptionRaw[]
  entity_label: EntityLabelRaw[]
}

export interface LabelPage {
  data: LabelRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}
