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
