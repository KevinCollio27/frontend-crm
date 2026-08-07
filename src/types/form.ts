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

// ─── Respuestas ───────────────────────────────────────────────────────────────

export interface FormAnswerPerson {
  id: number
  name: string
  email: string | null
  phone: string | null
  linkedin_url: string | null
}

export interface FormAnswerOrganization {
  id: number
  name: string
  document_number: string | null
  web_page: string | null
  industry: string | null
}

export interface FormAnswerNote {
  id: number
  title: string | null
  content: string | null
}

export interface FormAnswerVacante {
  id: number
  titulo: string | null
  empresa: string | null
}

export interface FormAnswerRaw {
  id: number
  created_at: string
  answers: Record<string, unknown>
  is_active: boolean
  opportunity_id: number
  // Solo viene poblado en el listado global (GET /widget-forms/answers) — el
  // listado por formulario puntual no lo manda porque ya se sabe cuál es.
  form?: { id: number; name: string; slug: string }
  vacante_relacionada: FormAnswerVacante | null
  person: FormAnswerPerson | null
  organization: FormAnswerOrganization | null
  notes: FormAnswerNote[]
}

export interface FormAnswerListResult {
  data: FormAnswerRaw[]
  total: number
  nextCursor: string | null
}

// ─── Vacantes ───────────────────────────────────────────────────────────────

export interface VacanteSummary {
  id: number
  titulo: string | null
  empresa: string | null
  organization_id: number | null
  is_active: boolean
  postulantes_count: number
}
