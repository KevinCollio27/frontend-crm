export type MessagingView =
  | "my_inbox"
  | "all"
  | "unassigned"
  | "resolved"
  | "whatsapp"
  | "widget"

export type ConversationChannel = "whatsapp" | "widget"
export type ConversationStatus  = "open" | "pending" | "resolved"
export type DateGroup           = "today" | "yesterday" | "older"

export interface ConversationMessage {
  id: string
  role: "user" | "agent" | "bot"
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  channel: ConversationChannel
  status: ConversationStatus
  isRead: boolean
  isAiActive: boolean
  lastMessageAt: string
  dateGroup: DateGroup

  // Contacto (puede ser anónimo en widget sin lead)
  visitorName: string | null   // null = anónimo
  visitorPhone?: string        // WhatsApp
  visitorEmail?: string
  visitorInitials: string
  visitorAvatarColor: "green" | "blue" | "amber" | "purple" | "teal" | "red"

  // Widget origin
  widgetName?: string

  // CRM link
  companyName?: string
  crmContactId?: string

  lastMessage: string
  messages: ConversationMessage[]
}

export const conversations: Conversation[] = [
  {
    id: "1",
    channel: "whatsapp",
    status: "open",
    isRead: false,
    isAiActive: false,
    lastMessageAt: "hace 5 min",
    dateGroup: "today",
    visitorName: "Githa Watson",
    visitorPhone: "+56912345678",
    visitorInitials: "GW",
    visitorAvatarColor: "green",
    companyName: "Slep Maule Costa",
    lastMessage: "Hola, quería confirmar la demo de mañana...",
    messages: [
      { id: "m1", role: "user",  content: "Hola! Quería confirmar si la demo de mañana sigue en pie 🙌", createdAt: "09:41" },
      { id: "m2", role: "agent", content: "Hola Githa! Sí, confirmado para las 10:00 AM. Te enviaré el link de Zoom en un momento 👍", createdAt: "09:43" },
      { id: "m3", role: "user",  content: "Perfecto, muchas gracias. ¿Habrá tiempo para ver el tema de las rutas adicionales también?", createdAt: "09:45" },
      { id: "m4", role: "bot",   content: "Sí, tenemos tiempo reservado para revisar rutas adicionales. La agenda incluye: presentación general (20 min), demo técnica (25 min) y preguntas (15 min).", createdAt: "09:46" },
      { id: "m5", role: "agent", content: "Claro que sí! Tenemos espacio para verlo todo. Nos vemos mañana 😊", createdAt: "09:48" },
      { id: "m6", role: "user",  content: "Hola, quería confirmar la demo de mañana... ¿me puede enviar el link?", createdAt: "hace 5 min" },
    ],
  },
  {
    id: "2",
    channel: "widget",
    status: "open",
    isRead: false,
    isAiActive: true,
    lastMessageAt: "hace 23 min",
    dateGroup: "today",
    visitorName: "Carlos Riquelme",
    visitorEmail: "carlos@empresa.cl",
    visitorInitials: "CR",
    visitorAvatarColor: "blue",
    widgetName: "Agente GOXT CRM",
    lastMessage: "Necesito info sobre el plan empresarial",
    messages: [
      { id: "m1", role: "user", content: "Hola, necesito información sobre el plan empresarial", createdAt: "hace 23 min" },
      { id: "m2", role: "bot",  content: "¡Hola! Con gusto te ayudo. El plan empresarial incluye: usuarios ilimitados, CRM completo, IA integrada y soporte prioritario. ¿Te gustaría agendar una demo?", createdAt: "hace 22 min" },
    ],
  },
  {
    id: "3",
    channel: "whatsapp",
    status: "pending",
    isRead: true,
    isAiActive: false,
    lastMessageAt: "hace 1h",
    dateGroup: "today",
    visitorName: "María Fuentes",
    visitorPhone: "+56987654321",
    visitorInitials: "MF",
    visitorAvatarColor: "amber",
    companyName: "Transportes Sur",
    lastMessage: "Perfecto, les envío los documentos hoy",
    messages: [
      { id: "m1", role: "user", content: "Perfecto, les envío los documentos hoy", createdAt: "hace 1h" },
    ],
  },
  {
    id: "4",
    channel: "widget",
    status: "open",
    isRead: true,
    isAiActive: false,
    lastMessageAt: "hace 2h",
    dateGroup: "today",
    visitorName: null,
    visitorInitials: "?",
    visitorAvatarColor: "purple",
    widgetName: "Agente GOXT CRM",
    lastMessage: "¿Tienen integración con sistemas ERP?",
    messages: [
      { id: "m1", role: "user", content: "¿Tienen integración con sistemas ERP?", createdAt: "hace 2h" },
    ],
  },
  {
    id: "5",
    channel: "whatsapp",
    status: "pending",
    isRead: true,
    isAiActive: false,
    lastMessageAt: "hace 3h",
    dateGroup: "today",
    visitorName: "Paula López",
    visitorPhone: "+56911223344",
    visitorInitials: "PL",
    visitorAvatarColor: "teal",
    companyName: "LogiChile SpA",
    lastMessage: "Gracias por la información, lo revisamos",
    messages: [
      { id: "m1", role: "user", content: "Gracias por la información, lo revisamos", createdAt: "hace 3h" },
    ],
  },
  {
    id: "6",
    channel: "widget",
    status: "resolved",
    isRead: true,
    isAiActive: false,
    lastMessageAt: "ayer 11:05",
    dateGroup: "yesterday",
    visitorName: "Sofia Núñez",
    visitorEmail: "sofia@logistica.cl",
    visitorInitials: "SN",
    visitorAvatarColor: "blue",
    widgetName: "Agente Web GOXT",
    lastMessage: "Entendido, muchas gracias por la ayuda",
    messages: [
      { id: "m1", role: "user", content: "Entendido, muchas gracias por la ayuda", createdAt: "ayer 11:05" },
    ],
  },
]

export const VIEW_COUNTS: Record<MessagingView, number> = {
  my_inbox:   4,
  all:        18,
  unassigned: 3,
  resolved:   12,
  whatsapp:   8,
  widget:     10,
}

export const VIEW_LABELS: Record<MessagingView, string> = {
  my_inbox:   "Mi bandeja",
  all:        "Todos",
  unassigned: "Sin asignar",
  resolved:   "Resueltos",
  whatsapp:   "WhatsApp",
  widget:     "Widget web",
}

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today:     "Hoy",
  yesterday: "Ayer",
  older:     "Anteriores",
}

export const STATUS_CONFIG: Record<ConversationStatus, { label: string; className: string }> = {
  open:     { label: "Abierto",   className: "bg-blue-500/10 text-blue-600"    },
  pending:  { label: "Pendiente", className: "bg-amber-500/10 text-amber-600"  },
  resolved: { label: "Resuelto",  className: "bg-emerald-500/10 text-emerald-600" },
}

export const AVATAR_COLOR_CLASSES: Record<Conversation["visitorAvatarColor"], string> = {
  green:  "bg-emerald-100 text-emerald-700",
  blue:   "bg-blue-100 text-blue-700",
  amber:  "bg-amber-100 text-amber-700",
  purple: "bg-violet-100 text-violet-700",
  teal:   "bg-teal-100 text-teal-700",
  red:    "bg-red-100 text-red-700",
}
