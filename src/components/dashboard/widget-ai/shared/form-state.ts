import type { WidgetAIDocument } from "@/types/widget-ai"

export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left"

export interface WidgetDocFile {
  id: string
  file: File
}

export interface WidgetFaq {
  id: string
  question: string
  answer: string
}

export interface WidgetResource {
  id: string
  name: string
  url: string
}

export interface WidgetFormState {
  // ── Información General — campos reales (WidgetAIRaw) ──
  name: string
  description: string
  chatTitle: string
  brandColor: string
  logoFile: File | null
  existingLogoUrl: string // URL firmada ya guardada — solo edición
  isActive: boolean

  // ── Información General — mock ──
  welcomeMessage: string

  // ── Conocimiento ──
  docFiles: WidgetDocFile[] // nuevos, pendientes de subir
  existingDocs: WidgetAIDocument[] // ya subidos — solo edición
  faqs: WidgetFaq[] // real
  prompt: string // real (→ system_prompt)

  // ── Acciones — mock ──
  actionSchedule: boolean
  scheduleDuration: string
  actionLead: boolean
  leadFields: { nombre: boolean; correo: boolean; telefono: boolean }
  leadFunnel: string
  actionOpportunity: boolean
  opportunityTrigger: string
  actionHuman: boolean
  humanWhen: string
  humanWho: string
  actionResource: boolean
  resources: WidgetResource[]

  // ── Leads y Disponibilidad — campos reales ──
  leadCaptureEnabled: boolean
  leadCaptureMessage: string

  // ── Apariencia — campos reales ──
  position: WidgetPosition
  allowedDomains: string // separado por coma, se parsea a array al enviar
}

export function createEmptyWidgetForm(): WidgetFormState {
  return {
    name: "",
    description: "",
    chatTitle: "Asistente",
    brandColor: "#7C5CFF",
    logoFile: null,
    existingLogoUrl: "",
    isActive: true,

    welcomeMessage: "¡Hola! ¿En qué puedo ayudarte hoy?",

    docFiles: [],
    existingDocs: [],
    faqs: [],
    prompt: "Eres un asistente virtual de nuestra empresa. Responde las preguntas de nuestros visitantes de forma amable y profesional.",

    actionSchedule: false,
    scheduleDuration: "30",
    actionLead: true,
    leadFields: { nombre: true, correo: true, telefono: false },
    leadFunnel: "",
    actionOpportunity: false,
    opportunityTrigger: "",
    actionHuman: false,
    humanWhen: "ambas",
    humanWho: "",
    actionResource: false,
    resources: [],

    leadCaptureEnabled: true,
    leadCaptureMessage: "Déjanos tu correo para enviarte más información.",

    position: "bottom-right",
    allowedDomains: "",
  }
}
