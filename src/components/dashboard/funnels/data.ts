export type Priority = "alta" | "media" | "baja"
export type DealStatus = "open" | "won" | "lost"

export interface Stage {
  id: string
  name: string
}

export interface Funnel {
  id: string
  name: string
}

export interface Deal {
  id: string
  name: string
  company: string
  contact: string
  value: number
  priority: Priority
  status: DealStatus
  closeDate: string | null
  stageId: string
  responsible: { name: string; initials: string; avatar?: string }
  quotationCount: number
  activityCount: number
}

export const FUNNELS: Funnel[] = [
  { id: "default", name: "Flujo Predeterminado" },
  { id: "enterprise", name: "Enterprise" },
  { id: "smb", name: "SMB" },
]

export const STAGES: Stage[] = [
  { id: "lead", name: "Lead" },
  { id: "calificado", name: "Calificado" },
  { id: "propuesta", name: "Propuesta" },
  { id: "negociacion", name: "Negociación" },
  { id: "cierre", name: "Cierre" },
]

// ─── Detail Types ─────────────────────────────────────────────────────────────

export type HistorialType = "note" | "activity" | "stage_change" | "created" | "quotation" | "email" | "responsible"
export type ActivityDetailStatus = "pendiente" | "en_progreso" | "completada" | "cancelada"
export type QuotationStatus = "borrador" | "enviada" | "aceptada" | "rechazada"
export type EmailStatus = "enviado" | "recibido"
export type WspMessageStatus = "enviado" | "recibido" | "plantilla"
export type InvoiceStatus = "borrador" | "emitida" | "pagada" | "vencida" | "anulada"
export type InvoiceUnitOfMeasure = "dias" | "semanas" | "meses" | "años"

export interface HistorialEntry {
  id: string
  type: HistorialType
  actor: string
  date: string
  month: string
  title: string
  content?: string
}

export interface DealNote {
  id: string
  title: string
  content: string
  author: string
  tags?: string[]
  created_at: string
}

export interface DealActivity {
  id: string
  title: string
  type: string
  status: ActivityDetailStatus
  date_from: string
  date_to?: string
  ubication?: string
  is_completed: boolean
  responsible: { name: string; initials: string; avatar?: string }
  created_at: string
}

export interface DealProduct {
  id: string
  name: string
  quantity: number
  unitPrice: number
}

export interface DealDocument {
  id: string
  name: string
  description?: string
  file_name: string
  file_type: string
  file_size: number
  category: string
  visibility: "private" | "public"
  uploaded_by: { name: string; initials: string; avatar?: string }
  created_at: string
}

export interface DealQuotation {
  id: string
  name: string
  amount: number
  status: QuotationStatus
  type: "sale" | "purchase"
  valid_until?: string
  apply_discounts: boolean
  created_by: { name: string; initials: string; avatar?: string }
  created_at: string
  items_count: number
}

export interface DealInvoice {
  id: string
  invoice_number: string
  quotation_id: string
  unit_of_measure: InvoiceUnitOfMeasure
  period: number
  amount: number
  issue_date: string
  due_date: string
  status: InvoiceStatus
}

export interface DealEmail {
  id: string
  subject: string
  to: string
  from: string
  preview: string
  sentAt: string
  status: EmailStatus
}

export interface DealWspMessage {
  id: string
  subject: string
  to?: string
  from?: string
  preview: string
  sentAt: string
  status: WspMessageStatus
}

export interface DealResponsible {
  name: string
  initials: string
  avatar?: string
  isMain: boolean
}

export interface DealDetail extends Deal {
  description: string
  origin: string
  pipeline: string
  currency: string
  responsibles: DealResponsible[]
  person: { name: string; position: string; email: string; email_type?: string; phone: string; phone_type?: string; country?: string; country_code?: string }
  organization: { name: string; taxId: string; industry: string; website: string }
  products: DealProduct[]
  historial: HistorialEntry[]
  notes: DealNote[]
  activities: DealActivity[]
  documents: DealDocument[]
  quotations: DealQuotation[]
  invoices: DealInvoice[]
  emails: DealEmail[]
  whatsappMessages: DealWspMessage[]
}

export const DEAL_DETAILS: Record<string, DealDetail> = {
  "1": {
    id: "1",
    name: "Propuesta logística Q2",
    company: "Transportes del Norte",
    contact: "Juan Pérez",
    value: 6300000,
    priority: "alta",
    status: "open",
    closeDate: "28/02/26",
    stageId: "propuesta",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    quotationCount: 1,
    activityCount: 3,
    description: "Cliente interesado en solución de transporte refrigerado para zona central. Alta probabilidad de cierre en Q2.",
    origin: "CRM",
    pipeline: "Flujo Predeterminado",
    currency: "CLP",
    responsibles: [
      { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png", isMain: true },
      { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png", isMain: false },
    ],
    person: {
      name: "Juan Pérez",
      position: "Gerente de Operaciones",
      email: "juan.perez@transportesnorte.cl",
      email_type: "Trabajo",
      phone: "+56 9 8765 4321",
      phone_type: "Móvil",
      country: "Chile",
      country_code: "CL",
    },
    organization: {
      name: "Transportes del Norte",
      taxId: "76.123.456-7",
      industry: "Transporte y Logística",
      website: "www.transportesdelnorte.cl",
    },
    products: [
      { id: "p1", name: "Plan CamionGO Pro", quantity: 1, unitPrice: 4500000 },
      { id: "p2", name: "Módulo GPS Avanzado", quantity: 3, unitPrice: 600000 },
    ],
    historial: [
      { id: "h12", type: "stage_change", actor: "Kevin Collio", date: "24 abr 2026 · 15:30", month: "Abril 2026", title: "Etapa cambiada a «Propuesta»" },
      { id: "h11", type: "note",         actor: "Kevin Collio", date: "24 abr 2026 · 12:18", month: "Abril 2026", title: "Nota creada: «Evolución»", content: "El cliente mostró interés positivo en el módulo GPS avanzado. Solicita cotización detallada con desglose por unidad." },
      { id: "h10", type: "email",        actor: "Kevin Collio", date: "23 abr 2026 · 09:45", month: "Abril 2026", title: "Correo enviado: «Propuesta inicial CamionGO Pro»", content: "Se envió propuesta completa incluyendo módulo GPS. Adjuntos: presentación corporativa y ficha técnica del producto." },
      { id: "h9",  type: "note",         actor: "Kevin Collio", date: "22 abr 2026 · 11:00", month: "Abril 2026", title: "Nota creada: «Feedback llamada»", content: "El cliente evalúa también una propuesta de la competencia. Diferenciador clave: soporte 24/7 e integración con su ERP actual." },
      { id: "h8",  type: "activity",     actor: "Kevin Collio", date: "20 abr 2026 · 14:00", month: "Abril 2026", title: "Actividad creada: «Demo plataforma TMS»", content: "Reunión agendada para el 28 de abril. Participantes: Juan Pérez, Gerente TI y Rodrigo V." },
      { id: "h7",  type: "quotation",    actor: "Kevin Collio", date: "19 abr 2026 · 10:30", month: "Abril 2026", title: "Cotización enviada: «Propuesta Q2 2026»" },
      { id: "h6",  type: "note",         actor: "Kevin Collio", date: "18 abr 2026 · 09:00", month: "Abril 2026", title: "Nota creada: «Contexto Inicial»", content: "Cliente llegó por referido de DHL Chile. Necesita solución para 12 vehículos refrigerados en ruta Santiago-Valparaíso." },
      { id: "h5",  type: "stage_change", actor: "Kevin Collio", date: "16 abr 2026 · 08:15", month: "Abril 2026", title: "Etapa cambiada a «Calificado»" },
      { id: "h4",  type: "responsible",  actor: "Kevin Collio", date: "15 abr 2026 · 16:00", month: "Abril 2026", title: "Responsable asignado: Rodrigo V." },
      { id: "h3",  type: "activity",     actor: "Kevin Collio", date: "10 mar 2026 · 11:30", month: "Marzo 2026", title: "Actividad completada: «Llamada seguimiento»", content: "Se confirmó interés en el producto. Cliente solicita propuesta formal para la próxima semana." },
      { id: "h2",  type: "stage_change", actor: "Kevin Collio", date: "05 mar 2026 · 09:00", month: "Marzo 2026", title: "Etapa cambiada a «Lead»" },
      { id: "h1",  type: "created",      actor: "Kevin Collio", date: "01 mar 2026 · 08:00", month: "Marzo 2026", title: "Oportunidad creada" },
    ],
    notes: [
      { id: "n1", title: "Evolución",        content: "El cliente mostró interés positivo en el módulo GPS avanzado. Solicita cotización detallada con desglose por unidad.\n\nLa solución está estable para demo. Se espera confirmación del directivo para avanzar con el primer contrato.", author: "Kevin Collio", tags: ["Desarrollo"],           created_at: "24 abr. 2026 · 12:18" },
      { id: "n2", title: "Feedback cliente", content: "El cliente evalúa también una propuesta de la competencia. Diferenciador clave: soporte 24/7 e integración con su ERP actual.",                                                                                                        author: "Kevin Collio", tags: [],                       created_at: "22 abr. 2026 · 11:00" },
      { id: "n3", title: "Contexto inicial", content: "Cliente llegó por referido de DHL Chile. Necesita solución para 12 vehículos refrigerados en ruta Santiago-Valparaíso.",                                                                                                               author: "Kevin Collio", tags: ["CamionGO", "Transporte"], created_at: "18 abr. 2026 · 09:00" },
      { id: "n4", title: "Próximos pasos",   content: "Agendar reunión técnica con equipo de IT de Transportes del Norte. Preparar demo del módulo GPS con datos en vivo.",                                                                                                                   author: "Rodrigo V.",   tags: ["Pendiente"],            created_at: "20 abr. 2026 · 14:00" },
    ],
    activities: [
      { id: "a1", title: "Demo plataforma TMS",                  type: "Video Llamada", status: "pendiente",   date_from: "28/04/2026 10:00", date_to: "28/04/2026 11:00",  ubication: "Google Meet",            is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "20/04/2026" },
      { id: "a2", title: "Reunión con CEO Transportes del Norte", type: "Reunión",       status: "en_progreso", date_from: "15/03/2026 09:00", date_to: "15/03/2026 10:30",  ubication: "Oficina del Cliente",    is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "10/03/2026" },
      { id: "a3", title: "Llamada seguimiento Q2",               type: "Llamada",       status: "completada",  date_from: "10/03/2026 11:30", date_to: "10/03/2026 11:50",                                       is_completed: true,  responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "05/03/2026" },
      { id: "a4", title: "Envío propuesta técnica",              type: "Email",         status: "completada",  date_from: "08/03/2026 09:00",                                                                     is_completed: true,  responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "08/03/2026" },
      { id: "a5", title: "Visita instalaciones cliente",         type: "Visita",        status: "cancelada",   date_from: "01/04/2026 10:00", date_to: "01/04/2026 12:00",  ubication: "Santiago - Planta Norte", is_completed: false, responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "25/03/2026" },
      { id: "a6", title: "Presentación ejecutiva Q2",           type: "Video Llamada", status: "pendiente",   date_from: "05/05/2026 14:00", date_to: "05/05/2026 15:00",  ubication: "Zoom",                   is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "25/04/2026" },
      { id: "a7", title: "Revisión borrador contrato",          type: "Reunión",       status: "pendiente",   date_from: "30/04/2026 11:00", date_to: "30/04/2026 12:00",  ubication: "Oficina GOXT",           is_completed: false, responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "24/04/2026" },
      { id: "a8", title: "Call seguimiento semanal",            type: "Llamada",       status: "completada",  date_from: "17/03/2026 09:00", date_to: "17/03/2026 09:30",                                       is_completed: true,  responsible: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "14/03/2026" },
    ],
    documents: [
      { id: "d1", name: "Contrato Marco 2026",         file_name: "contrato_marco_2026.pdf",             file_type: "pdf",  file_size: 2516582, category: "contrato",     visibility: "private", uploaded_by: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "22/04/2026" },
      { id: "d2", name: "Presentación CamionGO Pro",   file_name: "presentacion_camionGO_pro.pptx",      file_type: "pptx", file_size: 8493465, category: "presentacion", visibility: "public",  uploaded_by: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "19/04/2026" },
      { id: "d3", name: "Propuesta técnica GPS",       file_name: "propuesta_tecnica_gps.xlsx",          file_type: "xlsx", file_size: 1258291, category: "otro",         visibility: "private", uploaded_by: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "18/04/2026" },
      { id: "d4", name: "Factura servicios Q1",        file_name: "factura_servicios_q1.pdf",            file_type: "pdf",  file_size:  838861, category: "factura",      visibility: "private", uploaded_by: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "15/03/2026" },
      { id: "d5", name: "Manual integración TMS",      file_name: "manual_integracion_tms.docx",         file_type: "docx", file_size: 3670016, category: "manual",       visibility: "public",  uploaded_by: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "10/03/2026" },
    ],
    quotations: [
      { id: "q1", name: "Propuesta Q2 2026",      amount: 6300000, status: "enviada",   type: "sale",     valid_until: "30/06/2026", apply_discounts: false, created_by: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "19/04/2026", items_count: 2 },
      { id: "q2", name: "Propuesta ajustada Q2",   amount: 5800000, status: "borrador",  type: "sale",     valid_until: "31/05/2026", apply_discounts: false, created_by: { name: "Rodrigo V.",   initials: "RV", avatar: "https://github.com/shadcn.png" }, created_at: "22/04/2026", items_count: 2 },
      { id: "q3", name: "Cotización GPS avanzado", amount: 1800000, status: "aceptada",  type: "purchase", valid_until: "15/05/2026", apply_discounts: false, created_by: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "15/03/2026", items_count: 3 },
      { id: "q4", name: "Propuesta extendida Q3",  amount: 8500000, status: "rechazada", type: "sale",     valid_until: "31/07/2026", apply_discounts: true,  created_by: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" }, created_at: "01/04/2026", items_count: 4 },
    ],
    invoices: [
      { id: "inv1", invoice_number: "F-2026-001", quotation_id: "q1", unit_of_measure: "meses", period: 12, amount: 6300000, issue_date: "01/05/2026", due_date: "01/06/2026", status: "emitida"  },
      { id: "inv2", invoice_number: "F-2026-002", quotation_id: "q3", unit_of_measure: "meses", period: 6,  amount: 1800000, issue_date: "15/03/2026", due_date: "15/04/2026", status: "pagada"   },
      { id: "inv3", invoice_number: "F-2026-003", quotation_id: "q1", unit_of_measure: "años",  period: 1,  amount: 4500000, issue_date: "10/02/2026", due_date: "10/03/2026", status: "vencida"  },
    ],
    emails: [
      { id: "e1", subject: "Propuesta inicial CamionGO Pro", to: "juan.perez@transportesnorte.cl", from: "kevin.collio@goxt.io",         preview: "Estimado Juan, adjunto encontrará nuestra propuesta detallada para la implementación de CamionGO Pro...", sentAt: "23 abr 2026 · 09:45", status: "enviado"   },
      { id: "e2", subject: "Re: Seguimiento reunión",        to: "kevin.collio@goxt.io",           from: "juan.perez@transportesnorte.cl", preview: "Kevin, muchas gracias por la información. Estamos revisando la propuesta con nuestro equipo técnico...",    sentAt: "24 abr 2026 · 14:20", status: "recibido"  },
    ],
    whatsappMessages: [
      { id: "w1", subject: "Propuesta CamionGO Pro",  to: "+56 9 1234 5678 (Juan Pérez)",   preview: "Hola Juan, te compartimos el detalle de nuestra propuesta para CamionGO Pro. Puedes...", sentAt: "23 abr 2026 · 09:52", status: "plantilla" },
      { id: "w2", subject: "Re: Revisión propuesta",  from: "+56 9 1234 5678 (Juan Pérez)", preview: "Kevin, muchas gracias! Lo revisamos con el equipo y te escribimos esta semana con las...",    sentAt: "24 abr 2026 · 15:07", status: "recibido"  },
      { id: "w3", subject: "Cotización adjunta",      to: "+56 9 1234 5678 (Juan Pérez)",   preview: "📄 Cotizacion_CamionGO_Pro_v2.pdf",                                                           sentAt: "25 abr 2026 · 11:30", status: "enviado"   },
    ],
  },
}

// ─── Original deal list ───────────────────────────────────────────────────────

export const DEALS: Deal[] = [
  {
    id: "1",
    name: "Propuesta logística Q2",
    company: "Transportes del Norte",
    contact: "Juan Pérez",
    value: 6300000,
    priority: "alta",
    status: "open",
    closeDate: "28/02/26",
    stageId: "lead",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    quotationCount: 1,
    activityCount: 2,
  },
  {
    id: "2",
    name: "Renovación contrato anual",
    company: "Empresa ABC",
    contact: "María García",
    value: 24000000,
    priority: "alta",
    status: "open",
    closeDate: "16/01/26",
    stageId: "lead",
    responsible: { name: "María García", initials: "MG", avatar: "https://github.com/shadcn.png" },
    quotationCount: 0,
    activityCount: 1,
  },
  {
    id: "3",
    name: "Campaña Promoción Verano",
    company: "Copec",
    contact: "Fabrizio Raglianti",
    value: 0,
    priority: "alta",
    status: "open",
    closeDate: "08/01/26",
    stageId: "calificado",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    quotationCount: 0,
    activityCount: 0,
  },
  {
    id: "4",
    name: "Expansión flota norte",
    company: "Bayer Monsanto",
    contact: "Eduardo Fernández",
    value: 11520000,
    priority: "media",
    status: "open",
    closeDate: "06/02/26",
    stageId: "calificado",
    responsible: { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png" },
    quotationCount: 1,
    activityCount: 0,
  },
  {
    id: "5",
    name: "Contrato logística regional",
    company: "Traveltrans",
    contact: "Guillermo Porras",
    value: 30000000,
    priority: "alta",
    status: "open",
    closeDate: "28/02/26",
    stageId: "propuesta",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    quotationCount: 2,
    activityCount: 1,
  },
  {
    id: "6",
    name: "Integración sistema TMS",
    company: "Brightcell Logistics",
    contact: "Alejandro Martínez",
    value: 8500000,
    priority: "media",
    status: "open",
    closeDate: "31/03/26",
    stageId: "propuesta",
    responsible: { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png" },
    quotationCount: 1,
    activityCount: 3,
  },
  {
    id: "7",
    name: "Ampliación capacidad bodega",
    company: "SoRock",
    contact: "Kanushi Barnes",
    value: 31000000,
    priority: "alta",
    status: "open",
    closeDate: "02/02/26",
    stageId: "negociacion",
    responsible: { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png" },
    quotationCount: 3,
    activityCount: 2,
  },
  {
    id: "8",
    name: "Servicio mantenimiento anual",
    company: "Lorean",
    contact: "Carlos Mendoza",
    value: 22000000,
    priority: "baja",
    status: "open",
    closeDate: null,
    stageId: "negociacion",
    responsible: { name: "María García", initials: "MG", avatar: "https://github.com/shadcn.png" },
    quotationCount: 1,
    activityCount: 1,
  },
  {
    id: "9",
    name: "Flota de reparto urbano",
    company: "DHL Chile",
    contact: "Sofía Herrera",
    value: 45000000,
    priority: "alta",
    status: "won",
    closeDate: "15/03/26",
    stageId: "cierre",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    quotationCount: 2,
    activityCount: 4,
  },
  {
    id: "10",
    name: "Contrato mantenimiento TMS",
    company: "Transportes Silva",
    contact: "Roberto Silva",
    value: 9800000,
    priority: "media",
    status: "lost",
    closeDate: "10/03/26",
    stageId: "cierre",
    responsible: { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png" },
    quotationCount: 1,
    activityCount: 2,
  },
  {
    id: "11",
    name: "Oportunidad Extra 1",
    company: "Transportes OP",
    contact: "Roberto OP",
    value: 15000,
    priority: "media",
    status: "lost",
    closeDate: "10/03/26",
    stageId: "cierre",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    quotationCount: 1,
    activityCount: 2,
  },
]
