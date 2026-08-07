// "my_inbox" = todas las conversaciones combinadas; "whatsapp"/"instagram"/"facebook" = solo
// ese canal; un número = filtrar por ese agente (widget) puntual.
export type MessagingView = "my_inbox" | "whatsapp" | "instagram" | "facebook" | number

export type ConversationChannel = "whatsapp" | "widget" | "instagram" | "facebook"
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
  lastMessageAtRaw?: string // ISO — solo widget, para reordenar al cargar más
  dateGroup: DateGroup

  // Contacto (puede ser anónimo en widget sin lead)
  visitorName: string | null   // null = anónimo
  visitorPhone?: string        // WhatsApp
  visitorEmail?: string
  visitorUsername?: string     // Instagram (@handle)
  visitorAvatarUrl?: string    // Instagram — URL temporal de Meta, puede expirar
  visitorInitials: string

  // Widget origin
  widgetName?: string

  // CRM link
  companyName?: string
  crmContactId?: string

  lastMessage: string
  messages: ConversationMessage[]

  // Backend ref (widget conversations)
  widgetId?: number

  // WhatsApp — ventana de 24h de Meta: si está cerrada, solo se puede reabrir con un template
  windowOpen?: boolean
}

// El id de conversación viene numerado por widget — dos widgets distintos
// pueden compartir el mismo id, así que la identidad real es (widget, id).
export function conversationKey(c: Conversation): string {
  return `${c.widgetId ?? c.channel}-${c.id}`
}

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today:     "Hoy",
  yesterday: "Ayer",
  older:     "Anteriores",
}

export const STATUS_CONFIG: Record<ConversationStatus, { label: string; className: string }> = {
  open:     { label: "Abierto",   className: "bg-blue-500/10 text-blue-600 dark:text-blue-400"       },
  pending:  { label: "Pendiente", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400"    },
  resolved: { label: "Resuelto",  className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
}
