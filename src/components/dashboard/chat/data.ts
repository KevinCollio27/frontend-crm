import {
  IconDatabase,
  IconSearch,
  IconChartBar,
  IconGitMerge,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

export type ChatDateGroup = "today" | "yesterday" | "thisWeek" | "thisMonth" | "older"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  images?: string[]
}

export interface ChatConversation {
  id: string
  title: string
  lastMessageAt: string
  dateGroup: ChatDateGroup
  preview: string
  messages: ChatMessage[]
}

export interface QuickAction {
  id: string
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  prompt: string
}

export const DATE_GROUP_LABELS: Record<ChatDateGroup, string> = {
  today:     "Hoy",
  yesterday: "Ayer",
  thisWeek:  "Esta semana",
  thisMonth: "Este mes",
  older:     "Más antiguas",
}

export const DATE_GROUP_ORDER: ChatDateGroup[] = [
  "today", "yesterday", "thisWeek", "thisMonth", "older",
]

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "crm",
    icon: IconDatabase,
    label: "Gestión CRM",
    prompt: "¿Qué contactos u oportunidades debo atender hoy?",
  },
  {
    id: "search",
    icon: IconSearch,
    label: "Búsqueda semántica",
    prompt: "Busca empresas similares a ",
  },
  {
    id: "quality",
    icon: IconChartBar,
    label: "Evaluación de calidad",
    prompt: "Evalúa la calidad de mis oportunidades activas",
  },
  {
    id: "matchmaking",
    icon: IconGitMerge,
    label: "Matchmaking",
    prompt: "Conecta mis oportunidades abiertas con los contactos más relevantes",
  },
]

export const mockConversations: ChatConversation[] = [
  {
    id: "1",
    title: "Análisis de oportunidades Q2",
    lastMessageAt: "hace 10 min",
    dateGroup: "today",
    preview: "Aquí está el análisis de tus oportunidades del Q2...",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Analiza mis oportunidades del Q2 por industria",
        createdAt: "hace 12 min",
      },
      {
        id: "m2",
        role: "assistant",
        content: "Aquí está el análisis de tus oportunidades del Q2 agrupadas por industria:\n\n**Transporte**: 4 oportunidades · $120.000 estimado\n**Logística**: 3 oportunidades · $85.000 estimado\n**Retail**: 2 oportunidades · $40.000 estimado\n\nEl sector transporte concentra el 52% del pipeline total.",
        createdAt: "hace 10 min",
      },
    ],
  },
  {
    id: "2",
    title: "Crear contacto Acme Corp",
    lastMessageAt: "hace 2h",
    dateGroup: "today",
    preview: "Contacto creado exitosamente en el CRM",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Crea un contacto para Juan Pérez de Acme Corp, email juan@acme.com",
        createdAt: "hace 2h",
      },
      {
        id: "m2",
        role: "assistant",
        content: "Contacto creado exitosamente:\n\n**Juan Pérez**\nEmpresa: Acme Corp\nEmail: juan@acme.com\n\n¿Quieres agregar algún campo adicional o crear una actividad de seguimiento?",
        createdAt: "hace 2h",
      },
    ],
  },
  {
    id: "3",
    title: "Búsqueda empresas transporte",
    lastMessageAt: "ayer 16:30",
    dateGroup: "yesterday",
    preview: "Encontré 8 empresas similares en tu CRM...",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Busca empresas similares a Transportes del Sur en mi CRM",
        createdAt: "ayer 16:30",
      },
      {
        id: "m2",
        role: "assistant",
        content: "Encontré 8 empresas similares a Transportes del Sur. Las 3 más relevantes:\n\n1. **LogiChile SpA** — Transporte de carga, Santiago\n2. **Transportes Maule** — Logística regional, Talca\n3. **Cargo Norte SpA** — Distribución, Antofagasta",
        createdAt: "ayer 16:30",
      },
    ],
  },
  {
    id: "4",
    title: "Evaluación pipeline octubre",
    lastMessageAt: "lun 10:15",
    dateGroup: "thisWeek",
    preview: "Tu pipeline tiene 12 oportunidades activas...",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Evalúa la calidad de mi pipeline para este mes",
        createdAt: "lun 10:15",
      },
      {
        id: "m2",
        role: "assistant",
        content: "Tu pipeline tiene **12 oportunidades activas**. Calidad general: **Alta**.\n\n4 oportunidades están listas para cerrar este mes con un valor estimado de $210.000.",
        createdAt: "lun 10:15",
      },
    ],
  },
]
