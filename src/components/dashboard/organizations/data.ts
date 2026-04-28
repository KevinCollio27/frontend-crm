// ─── Historial ────────────────────────────────────────────────────────────────

export type OrganizationHistorialType =
  | "created"
  | "updated"
  | "note"
  | "opportunity"
  | "activity"
  | "challenge"
  | "contact_added"

export interface OrgHistorialEntry {
  id: string
  type: OrganizationHistorialType
  actor: string
  date: string
  month: string
  title: string
  content?: string
}

// ─── Notas ────────────────────────────────────────────────────────────────────

export interface OrgNote {
  id: string
  title: string
  content: string
  author: string
  tags?: string[]
  created_at: string
}

// ─── Oportunidades ────────────────────────────────────────────────────────────

export type OrganizationOpportunityStatus = "open" | "won" | "lost"

export interface OrganizationOpportunity {
  id: string
  name: string
  pipeline: string
  stage: string
  status: OrganizationOpportunityStatus
  value: number
  currency: string
  close_date?: string
  responsible: { name: string; initials: string; avatar?: string }
  created_at: string
}

// ─── Actividades ──────────────────────────────────────────────────────────────

export type OrganizationActivityStatus = "pendiente" | "en_progreso" | "completada" | "cancelada"

export interface OrganizationActivity {
  id: string
  title: string
  type: string
  status: OrganizationActivityStatus
  date_from: string
  date_to?: string
  ubication?: string
  is_completed: boolean
  responsible: { name: string; initials: string; avatar?: string }
  opportunity_name: string
  created_at: string
}

// ─── Desafíos ─────────────────────────────────────────────────────────────────

export interface OrgChallenge {
  id: string
  description: string
  order_number: number
  created_at: string
}

// ─── Contactos vinculados ─────────────────────────────────────────────────────

export interface OrgContact {
  id: string
  name: string
  internal_position?: string
  email?: string
  phone?: string
  country_code: string
  origin: string
  created_at: string
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface OrganizationDetail {
  id: string
  name: string
  document_number?: string
  web_page?: string
  industry?: string
  country_code: string
  origin: string
  created_at: string
  linkedin_url?: string
  instagram_url?: string
  twitter_url?: string
  facebook_url?: string
  owner: { name: string; initials: string; avatar?: string }
  historial: OrgHistorialEntry[]
  notes: OrgNote[]
  opportunities: OrganizationOpportunity[]
  activities: OrganizationActivity[]
  challenges: OrgChallenge[]
  contacts: OrgContact[]
}

// ─── Static data ──────────────────────────────────────────────────────────────

export const ORGANIZATION_DETAILS: Record<string, OrganizationDetail> = {
  "1": {
    id: "1",
    name: "Transportes del Norte",
    document_number: "76.123.456-7",
    web_page: "www.transportesdelnorte.cl",
    industry: "Transporte y Logística",
    country_code: "CL",
    origin: "CRM",
    created_at: "01/03/2026",
    linkedin_url: "https://linkedin.com/company/transportesdelnorte",
    owner: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    historial: [
      { id: "oh9", type: "note",          actor: "Kevin Collio", date: "24 abr 2026 · 12:18", month: "Abril 2026",  title: "Nota creada: «Evaluación Q2»",                      content: "La empresa está evaluando ampliar su flota refrigerada para la temporada de verano. Existe presupuesto aprobado por directorio." },
      { id: "oh8", type: "activity",      actor: "Kevin Collio", date: "20 abr 2026 · 14:00", month: "Abril 2026",  title: "Actividad creada: «Demo plataforma TMS»" },
      { id: "oh7", type: "opportunity",   actor: "Kevin Collio", date: "19 abr 2026 · 10:30", month: "Abril 2026",  title: "Oportunidad vinculada: «Propuesta logística Q2»" },
      { id: "oh6", type: "challenge",     actor: "Kevin Collio", date: "18 abr 2026 · 09:30", month: "Abril 2026",  title: "Desafío registrado: «Digitalización de flota»" },
      { id: "oh5", type: "contact_added", actor: "Kevin Collio", date: "15 abr 2026 · 11:00", month: "Abril 2026",  title: "Contacto vinculado: «Carla Vega»" },
      { id: "oh4", type: "note",          actor: "Kevin Collio", date: "18 abr 2026 · 09:00", month: "Abril 2026",  title: "Nota creada: «Primer contacto»",                    content: "Empresa referida por DHL Chile. Opera 12 vehículos refrigerados en ruta Santiago-Valparaíso. Tomador de decisión es el Gerente de Operaciones." },
      { id: "oh3", type: "activity",      actor: "Rodrigo V.",   date: "10 mar 2026 · 11:30", month: "Marzo 2026",  title: "Actividad completada: «Llamada seguimiento»",       content: "Confirmaron interés en el producto. Solicitan propuesta formal para la semana siguiente." },
      { id: "oh2", type: "updated",       actor: "Kevin Collio", date: "05 mar 2026 · 10:00", month: "Marzo 2026",  title: "Organización actualizada: RUT e industria" },
      { id: "oh1", type: "created",       actor: "Kevin Collio", date: "01 mar 2026 · 08:00", month: "Marzo 2026",  title: "Organización creada" },
    ],
    notes: [
      { id: "on1", title: "Evaluación Q2",    content: "La empresa está evaluando ampliar su flota refrigerada para la temporada de verano. Existe presupuesto aprobado por directorio.\n\nEstán comparando nuestra propuesta con al menos un competidor. Diferenciador clave: soporte 24/7 e integración ERP.", author: "Kevin Collio", tags: ["Desarrollo", "Q2"],            created_at: "24 abr. 2026 · 12:18" },
      { id: "on2", title: "Primer contacto",  content: "Empresa referida por DHL Chile. Opera 12 vehículos refrigerados en ruta Santiago-Valparaíso. Tomador de decisión es el Gerente de Operaciones, Juan Pérez.",                                                                                                                                                     author: "Kevin Collio", tags: ["CamionGO", "Transporte"], created_at: "18 abr. 2026 · 09:00" },
      { id: "on3", title: "Feedback llamada", content: "Evaluando también propuesta de la competencia. Plazo de decisión: fin de mayo. Requieren integración nativa con SAP B1 como condición de cierre.",                                                                                                                                                               author: "Rodrigo V.",   tags: [],                        created_at: "10 mar. 2026 · 11:30" },
    ],
    opportunities: [
      { id: "o1", name: "Propuesta logística Q2",       pipeline: "Flujo Predeterminado", stage: "Propuesta",  status: "open", value: 6300000, currency: "CLP", close_date: "28/05/2026", responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "01/03/2026" },
      { id: "o2", name: "Ampliación flota refrigerada", pipeline: "Flujo Predeterminado", stage: "Calificado", status: "open", value: 3200000, currency: "CLP", close_date: "30/06/2026", responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "10/04/2026" },
      { id: "o3", name: "Contrato mantenimiento Q1",    pipeline: "Flujo Predeterminado", stage: "Cierre",     status: "won",  value: 1800000, currency: "CLP", close_date: "15/01/2026", responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "01/11/2025" },
    ],
    activities: [
      { id: "oa1", title: "Demo plataforma TMS",          type: "Video Llamada", status: "pendiente",   date_from: "28/04/2026 10:00", date_to: "28/04/2026 11:00", ubication: "Google Meet",         is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Propuesta logística Q2",       created_at: "20/04/2026" },
      { id: "oa2", title: "Reunión revisión propuesta",   type: "Reunión",       status: "en_progreso", date_from: "22/04/2026 09:00", date_to: "22/04/2026 10:00", ubication: "Oficina del Cliente", is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Propuesta logística Q2",       created_at: "18/04/2026" },
      { id: "oa3", title: "Llamada seguimiento Q2",       type: "Llamada",       status: "completada",  date_from: "10/03/2026 11:30", date_to: "10/03/2026 11:50",                                   is_completed: true,  responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Propuesta logística Q2",       created_at: "05/03/2026" },
      { id: "oa4", title: "Presentación contrato Q1",     type: "Reunión",       status: "completada",  date_from: "10/01/2026 10:00", date_to: "10/01/2026 11:00", ubication: "Oficina GOXT",        is_completed: true,  responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Contrato mantenimiento Q1",    created_at: "05/01/2026" },
      { id: "oa5", title: "Visita instalaciones cliente", type: "Visita",        status: "cancelada",   date_from: "01/04/2026 10:00", date_to: "01/04/2026 12:00", ubication: "Planta Norte",        is_completed: false, responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Ampliación flota refrigerada", created_at: "25/03/2026" },
    ],
    challenges: [
      { id: "oc1", description: "Digitalización de flota y trazabilidad GPS en tiempo real para las 12 unidades refrigeradas",  order_number: 1, created_at: "18/04/2026" },
      { id: "oc2", description: "Integración con ERP SAP B1 para automatizar la gestión de órdenes y facturación",              order_number: 2, created_at: "18/04/2026" },
      { id: "oc3", description: "Reducción de costos operativos en un 15% en la ruta Santiago-Valparaíso para Q3 2026",         order_number: 3, created_at: "10/03/2026" },
    ],
    contacts: [
      { id: "1", name: "Juan Pérez",  internal_position: "Gerente de Operaciones", email: "juan.perez@transportesnorte.cl",  phone: "+56 9 8765 4321", country_code: "CL", origin: "CRM", created_at: "01/03/2026" },
      { id: "2", name: "Carla Vega",  internal_position: "Directora Financiera",   email: "carla.vega@transportesnorte.cl",  phone: "+56 9 7654 3210", country_code: "CL", origin: "CRM", created_at: "15/04/2026" },
      { id: "3", name: "Marcos Soto", internal_position: "Jefe de Flota",          email: "marcos.soto@transportesnorte.cl", phone: "+56 9 6543 2109", country_code: "CL", origin: "Web", created_at: "20/04/2026" },
    ],
  },
}
