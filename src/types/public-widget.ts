// Contrato del widget público de contacto (formulario embudo → oportunidad),
// distinto del form builder (public-form.ts) — este pega directo a los
// endpoints /widget/* del backend (organización → contacto → oportunidad).

export interface WidgetFlowStage {
  id: number
  order_number: number
}

export interface WidgetFlow {
  id: number
  name: string
  flow_stage: WidgetFlowStage[]
}

interface OptionStatusRaw {
  is_active: boolean
}

interface LabelOptionRaw {
  id: number
  value: string
  order_number: number | null
  option_status: OptionStatusRaw[]
}

interface LabelRaw {
  id: number
  key: string
  options: LabelOptionRaw[]
}

interface EntityLabelRaw {
  label: LabelRaw
}

export interface EntityRaw {
  key: string
  entity_label: EntityLabelRaw[]
}

// Lo mínimo que necesita un detalle dinámico (email/teléfono) simplificado a
// un solo valor: el label_id para engancharlo, y la opción por defecto (si el
// workspace tiene alguna activa — algunos no tienen "Trabajo/Personal" seedeado).
export interface SimpleLabelInfo {
  labelId: number
  defaultOption: string
}

export interface WidgetDetailPayload {
  id: number | null
  label_id: number
  option: string
  value: string
}
