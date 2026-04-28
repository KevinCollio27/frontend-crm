export type ActivityPriority = "alta" | "media" | "baja"

export interface ActivityStage {
  id: string
  name: string
}

export interface Activity {
  id: string
  title: string
  type: string
  priority: ActivityPriority
  startDate: string
  endDate: string
  stageId: string
  createdAt: string
  responsible: { name: string; initials: string; avatar?: string }
  opportunityName?: string
  funnelName?: string
}

export const STAGES: ActivityStage[] = [
  { id: "pendiente",   name: "Pendiente"   },
  { id: "en_progreso", name: "En Progreso" },
  { id: "completada",  name: "Completada"  },
  { id: "cancelada",   name: "Cancelada"   },
]

export const ACTIVITY_TYPES = [
  "Reunión",
  "Llamada",
  "Correo",
  "Seguimiento",
  "Revisión",
  "Planificación",
  "Video Llamada",
  "Visita",
] as const

// ─── Historial ────────────────────────────────────────────────────────────────

export type ActivityHistorialType =
  | "created"
  | "updated"
  | "note"
  | "status_changed"
  | "assigned"

export interface ActivityHistorialEntry {
  id: string
  type: ActivityHistorialType
  actor: string
  date: string
  month: string
  title: string
  content?: string
}

// ─── Notas ────────────────────────────────────────────────────────────────────

export interface ActivityNote {
  id: string
  title: string
  content: string
  author: string
  tags?: string[]
  created_at: string
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface ActivityDetail extends Activity {
  ubicacion?: string
  historial: ActivityHistorialEntry[]
  notes: ActivityNote[]
  contact?: { id: string; name: string; position?: string }
  organization?: { id: string; name: string; industry?: string }
}

export const ACTIVITY_DETAILS: Record<string, ActivityDetail> = {
  "1": {
    id: "1",
    title: "Reunión con CEO Transportes del Norte",
    type: "Reunión",
    priority: "alta",
    startDate: "2026-03-10",
    endDate: "2026-03-15",
    stageId: "pendiente",
    createdAt: "2026-03-01",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Propuesta logística Q2",
    funnelName: "Flujo Predeterminado",
    ubicacion: "Oficina del cliente",
    contact: { id: "1", name: "Juan Pérez", position: "Gerente de Operaciones" },
    organization: { id: "1", name: "Transportes del Norte", industry: "Transporte y Logística" },
    historial: [
      { id: "ah3", type: "note",           actor: "Kevin Collio", date: "12 mar 2026 · 09:00", month: "Marzo 2026", title: "Nota agregada: «Puntos clave»",  content: "Discutir la integración GPS avanzada y mostrar el módulo de flotas refrigeradas." },
      { id: "ah2", type: "status_changed", actor: "Kevin Collio", date: "05 mar 2026 · 14:30", month: "Marzo 2026", title: "Estado cambiado a Pendiente" },
      { id: "ah1", type: "created",        actor: "Kevin Collio", date: "01 mar 2026 · 08:00", month: "Marzo 2026", title: "Actividad creada" },
    ],
    notes: [
      { id: "an1", title: "Puntos clave", content: "Discutir la integración GPS avanzada y mostrar el módulo de flotas refrigeradas.\n\nPresentar casos de éxito similares en el sector transporte.", author: "Kevin Collio", tags: ["Reunión", "GPS"], created_at: "12 mar. 2026 · 09:00" },
    ],
  },
}

// ─── Lista ────────────────────────────────────────────────────────────────────

export const ACTIVITIES: Activity[] = [
  {
    id: "1",
    title: "Reunión con CEO Transportes del Norte",
    type: "Reunión",
    priority: "alta",
    startDate: "2026-03-10",
    endDate: "2026-03-15",
    stageId: "pendiente",
    createdAt: "2026-03-01",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Propuesta logística Q2",
    funnelName: "Flujo Predeterminado",
  },
  {
    id: "2",
    title: "Llamada seguimiento Empresa ABC",
    type: "Llamada",
    priority: "media",
    startDate: "2026-05-10",
    endDate: "2026-05-10",
    stageId: "pendiente",
    createdAt: "2026-04-01",
    responsible: { name: "María García", initials: "MG", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Renovación contrato anual",
  },
  {
    id: "3",
    title: "Envío propuesta Brightcell",
    type: "Correo",
    priority: "alta",
    startDate: "2026-04-25",
    endDate: "2026-04-28",
    stageId: "pendiente",
    createdAt: "2026-04-10",
    responsible: { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Integración sistema TMS",
  },
  {
    id: "4",
    title: "Planificación Q2 equipo comercial",
    type: "Planificación",
    priority: "alta",
    startDate: "2026-04-01",
    endDate: "2026-04-05",
    stageId: "pendiente",
    createdAt: "2026-03-25",
    responsible: { name: "María García", initials: "MG", avatar: "https://github.com/shadcn.png" },
  },
  {
    id: "5",
    title: "Demo plataforma TMS - SoRock",
    type: "Video Llamada",
    priority: "alta",
    startDate: "2026-04-08",
    endDate: "2026-04-10",
    stageId: "en_progreso",
    createdAt: "2026-04-01",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Ampliación capacidad bodega",
    funnelName: "Enterprise",
  },
  {
    id: "6",
    title: "Revisión contrato Q2 SoRock",
    type: "Revisión",
    priority: "media",
    startDate: "2026-04-20",
    endDate: "2026-05-30",
    stageId: "en_progreso",
    createdAt: "2026-04-15",
    responsible: { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Ampliación capacidad bodega",
  },
  {
    id: "7",
    title: "Onboarding DHL Chile",
    type: "Reunión",
    priority: "alta",
    startDate: "2026-01-15",
    endDate: "2026-01-20",
    stageId: "completada",
    createdAt: "2026-01-10",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Flota de reparto urbano",
  },
  {
    id: "8",
    title: "Capacitación equipo Copec",
    type: "Planificación",
    priority: "baja",
    startDate: "2026-02-05",
    endDate: "2026-02-10",
    stageId: "completada",
    createdAt: "2026-01-28",
    responsible: { name: "María García", initials: "MG", avatar: "https://github.com/shadcn.png" },
    funnelName: "Flujo Predeterminado",
  },
  {
    id: "9",
    title: "Seguimiento propuesta Bayer Monsanto",
    type: "Seguimiento",
    priority: "media",
    startDate: "2026-02-20",
    endDate: "2026-03-01",
    stageId: "completada",
    createdAt: "2026-02-15",
    responsible: { name: "Rodrigo V.", initials: "RV", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Expansión flota norte",
  },
  {
    id: "10",
    title: "Visita terreno Traveltrans",
    type: "Visita",
    priority: "baja",
    startDate: "2026-02-25",
    endDate: "2026-02-28",
    stageId: "cancelada",
    createdAt: "2026-02-10",
    responsible: { name: "Kevin Collio", initials: "KC", avatar: "https://github.com/shadcn.png" },
    opportunityName: "Contrato logística regional",
  },
]
