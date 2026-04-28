// ─── Historial ────────────────────────────────────────────────────────────────

export type ContactHistorialType =
  | "created"
  | "updated"
  | "note"
  | "opportunity"
  | "activity"
  | "interest"

export interface ContactHistorialEntry {
  id: string
  type: ContactHistorialType
  actor: string
  date: string
  month: string
  title: string
  content?: string
}

// ─── Notas ────────────────────────────────────────────────────────────────────

export interface ContactNote {
  id: string
  title: string
  content: string
  author: string
  tags?: string[]
  created_at: string
}

// ─── Oportunidades ────────────────────────────────────────────────────────────

export type ContactOpportunityStatus = "open" | "won" | "lost"

export interface ContactOpportunity {
  id: string
  name: string
  pipeline: string
  stage: string
  status: ContactOpportunityStatus
  value: number
  currency: string
  close_date?: string
  responsible: { name: string; initials: string; avatar?: string }
  created_at: string
}

// ─── Actividades ──────────────────────────────────────────────────────────────

export type ContactActivityStatus = "pendiente" | "en_progreso" | "completada" | "cancelada"

export interface ContactActivity {
  id: string
  title: string
  type: string
  status: ContactActivityStatus
  date_from: string
  date_to?: string
  ubication?: string
  is_completed: boolean
  responsible: { name: string; initials: string; avatar?: string }
  opportunity_name: string
  created_at: string
}

// ─── Intereses ────────────────────────────────────────────────────────────────

export interface ContactInterest {
  id: string
  description: string
  order_number: number
  created_at: string
}

// ─── Correo ───────────────────────────────────────────────────────────────────

export type ContactEmailStatus = "enviado" | "recibido"

export interface ContactEmail {
  id: string
  subject: string
  to: string
  from: string
  preview: string
  sentAt: string
  status: ContactEmailStatus
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface ContactDetail {
  id: string
  name: string
  internal_position?: string
  birth_date?: string
  country_code: string
  contact_source?: string
  origin: string
  created_at: string
  linkedin_url?: string
  instagram_url?: string
  twitter_url?: string
  facebook_url?: string
  owner: { name: string; initials: string; avatar?: string }
  organization?: {
    id: string
    name: string
    industry?: string
    taxId?: string
    website?: string
  }
  email?: string
  email_type?: string
  phone?: string
  phone_type?: string
  historial: ContactHistorialEntry[]
  notes: ContactNote[]
  opportunities: ContactOpportunity[]
  activities: ContactActivity[]
  interests: ContactInterest[]
  emails: ContactEmail[]
}

// ─── Static data ──────────────────────────────────────────────────────────────

export const CONTACT_DETAILS: Record<string, ContactDetail> = {
  "1": {
    id: "1",
    name: "Juan Pérez",
    internal_position: "Gerente de Operaciones",
    birth_date: "1985-03-12",
    country_code: "CL",
    contact_source: "Referido",
    origin: "CRM",
    created_at: "01/03/2026",
    linkedin_url: "https://linkedin.com/in/juanperez",
    instagram_url: "https://instagram.com/juanperez",
    facebook_url: "https://facebook.com/juanperez",
    twitter_url: "https://twitter.com/juanperez",
    owner: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    organization: {
      id: "1",
      name: "Transportes del Norte",
      industry: "Transporte y Logística",
      taxId: "76.123.456-7",
      website: "www.transportesdelnorte.cl",
    },
    email: "juan.perez@transportesnorte.cl",
    email_type: "Trabajo",
    phone: "+56 9 8765 4321",
    phone_type: "Móvil",
    historial: [
      { id: "ch8", type: "note",        actor: "Kevin Collio", date: "24 abr 2026 · 12:18", month: "Abril 2026",  title: "Nota creada: «Evolución»",                         content: "El cliente mostró interés positivo en el módulo GPS avanzado. Solicita cotización detallada con desglose por unidad." },
      { id: "ch7", type: "activity",    actor: "Kevin Collio", date: "20 abr 2026 · 14:00", month: "Abril 2026",  title: "Actividad creada: «Demo plataforma TMS»" },
      { id: "ch6", type: "opportunity", actor: "Kevin Collio", date: "19 abr 2026 · 10:30", month: "Abril 2026",  title: "Oportunidad vinculada: «Propuesta logística Q2»" },
      { id: "ch5", type: "interest",    actor: "Kevin Collio", date: "18 abr 2026 · 09:30", month: "Abril 2026",  title: "Interés registrado: «Integración ERP»" },
      { id: "ch4", type: "note",        actor: "Kevin Collio", date: "18 abr 2026 · 09:00", month: "Abril 2026",  title: "Nota creada: «Contexto inicial»",                   content: "Cliente llegó por referido de DHL Chile. Necesita solución para 12 vehículos refrigerados en ruta Santiago-Valparaíso." },
      { id: "ch3", type: "activity",    actor: "Rodrigo V.",   date: "10 mar 2026 · 11:30", month: "Marzo 2026",  title: "Actividad completada: «Llamada seguimiento»",       content: "Se confirmó interés en el producto. Solicita propuesta formal para la próxima semana." },
      { id: "ch2", type: "updated",     actor: "Kevin Collio", date: "05 mar 2026 · 10:00", month: "Marzo 2026",  title: "Contacto actualizado: cargo y empresa" },
      { id: "ch1", type: "created",     actor: "Kevin Collio", date: "01 mar 2026 · 08:00", month: "Marzo 2026",  title: "Contacto creado" },
    ],
    notes: [
      { id: "cn1", title: "Evolución",        content: "El cliente mostró interés positivo en el módulo GPS avanzado. Solicita cotización detallada con desglose por unidad.\n\nLa solución está estable para demo. Se espera confirmación del directivo para avanzar con el primer contrato.", author: "Kevin Collio", tags: ["Desarrollo"],            created_at: "24 abr. 2026 · 12:18" },
      { id: "cn2", title: "Contexto inicial", content: "Cliente llegó por referido de DHL Chile. Necesita solución para 12 vehículos refrigerados en ruta Santiago-Valparaíso.",                                                                                                               author: "Kevin Collio", tags: ["CamionGO", "Transporte"], created_at: "18 abr. 2026 · 09:00" },
      { id: "cn3", title: "Feedback llamada", content: "El cliente evalúa también una propuesta de la competencia. Diferenciador clave: soporte 24/7 e integración con su ERP actual.",                                                                                                        author: "Rodrigo V.",   tags: [],                        created_at: "10 mar. 2026 · 11:30" },
    ],
    opportunities: [
      { id: "o1", name: "Propuesta logística Q2",       pipeline: "Flujo Predeterminado", stage: "Propuesta",   status: "open", value: 6300000,  currency: "CLP", close_date: "28/02/2026", responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "01/03/2026" },
      { id: "o2", name: "Ampliación flota refrigerada", pipeline: "Flujo Predeterminado", stage: "Calificado",  status: "open", value: 3200000,  currency: "CLP", close_date: "30/06/2026", responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "10/04/2026" },
      { id: "o3", name: "Contrato mantenimiento Q1",    pipeline: "Flujo Predeterminado", stage: "Cierre",      status: "won",  value: 1800000,  currency: "CLP", close_date: "15/01/2026", responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "01/11/2025" },
    ],
    activities: [
      { id: "ca1", title: "Demo plataforma TMS",           type: "Video Llamada", status: "pendiente",   date_from: "28/04/2026 10:00", date_to: "28/04/2026 11:00", ubication: "Google Meet",         is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Propuesta logística Q2",       created_at: "20/04/2026" },
      { id: "ca2", title: "Reunión revisión propuesta",    type: "Reunión",       status: "en_progreso", date_from: "22/04/2026 09:00", date_to: "22/04/2026 10:00", ubication: "Oficina del Cliente", is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Propuesta logística Q2",       created_at: "18/04/2026" },
      { id: "ca3", title: "Llamada seguimiento Q2",        type: "Llamada",       status: "completada",  date_from: "10/03/2026 11:30", date_to: "10/03/2026 11:50",                                   is_completed: true,  responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Propuesta logística Q2",       created_at: "05/03/2026" },
      { id: "ca4", title: "Presentación contrato Q1",      type: "Reunión",       status: "completada",  date_from: "10/01/2026 10:00", date_to: "10/01/2026 11:00", ubication: "Oficina GOXT",        is_completed: true,  responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Contrato mantenimiento Q1",    created_at: "05/01/2026" },
      { id: "ca5", title: "Visita instalaciones cliente",  type: "Visita",        status: "cancelada",   date_from: "01/04/2026 10:00", date_to: "01/04/2026 12:00", ubication: "Planta Norte",        is_completed: false, responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, opportunity_name: "Ampliación flota refrigerada", created_at: "25/03/2026" },
    ],
    interests: [
      { id: "ci1", description: "Interesado en el módulo GPS Avanzado para flotas refrigeradas",        order_number: 1, created_at: "18/04/2026" },
      { id: "ci2", description: "Evaluando integración con ERP actual (SAP B1)",                        order_number: 2, created_at: "18/04/2026" },
      { id: "ci3", description: "Interesado en plan CamionGO Pro para 12 vehículos ruta SCL-Valparaíso", order_number: 3, created_at: "10/03/2026" },
    ],
    emails: [
      { id: "ce1", subject: "Propuesta inicial CamionGO Pro", to: "juan.perez@transportesnorte.cl", from: "kevin.collio@goxt.io",         preview: "Estimado Juan, adjunto encontrará nuestra propuesta detallada para la implementación de CamionGO Pro...", sentAt: "23 abr 2026 · 09:45", status: "enviado"  },
      { id: "ce2", subject: "Re: Seguimiento reunión",        to: "kevin.collio@goxt.io",           from: "juan.perez@transportesnorte.cl", preview: "Kevin, muchas gracias por la información. Estamos revisando la propuesta con nuestro equipo técnico...",    sentAt: "24 abr 2026 · 14:20", status: "recibido" },
    ],
  },
}
