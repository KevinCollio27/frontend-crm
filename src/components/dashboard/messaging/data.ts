import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { WhatsAppConversationMessageRaw, WhatsAppConversationRaw } from "@/types/whatsapp-conversation"

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
  // Presente cuando el mensaje saliente fue una plantilla de WhatsApp (no texto libre) —
  // `vars` son los valores reales usados, no placeholders, para poder renderizarla tal
  // cual la vio el destinatario.
  template?: { name: string; language: string; vars: string[] }
}

export interface Conversation {
  id: string
  channel: ConversationChannel
  status: ConversationStatus
  isRead: boolean
  unreadCount: number
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

// ─── Mapeo WhatsApp raw → Conversation ─────────────────────────────────────────
// Vive acá (no en page.tsx) porque WhatsAppTab (detalle de oportunidad) también
// necesita mapear una conversación puntual para reusar ConversationView.

export function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date >= today) return "today"
  if (date >= yesterday) return "yesterday"
  return "older"
}

export function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

export function getPhoneInitials(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits ? digits.slice(-2) : "WA"
}

// Mensajes viejos (previos a agregar `author`) no distinguen IA de operador humano —
// por eso el default es "bot", no porque asumamos que todo assistant es la IA.
export function assistantMessageRole(author: "ai" | "human" | undefined): "bot" | "agent" {
  return author === "human" ? "agent" : "bot"
}

// `updated_at` de la conversación se pisa con cualquier escritura a la fila (ej. el
// refresh de avatar de IG/FB en cada vista de la bandeja), no solo con mensajes nuevos —
// para "hace X" y para ordenar la lista, lo que importa es el último mensaje real.
export function lastActivityAt(updatedAt: string, lastMessageCreatedAt?: string): string {
  return lastMessageCreatedAt ?? updatedAt
}

export function mapWhatsAppMessages(raws: WhatsAppConversationMessageRaw[]): ConversationMessage[] {
  return raws.map((m, i) => ({
    id: `${i}-${m.created_at}`,
    role: m.role === "assistant" ? assistantMessageRole(m.author) : ("user" as const),
    content: m.content,
    createdAt: formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es }),
    template: m.template,
  }))
}

export function mapWhatsAppConversation(raw: WhatsAppConversationRaw): Conversation {
  const lastMessage = raw.messages[raw.messages.length - 1]
  const lastActivity = lastActivityAt(raw.updated_at, lastMessage?.created_at)
  return {
    id: String(raw.id),
    channel: "whatsapp",
    status: "open",
    isRead: (raw.unread_count ?? 0) === 0,
    unreadCount: raw.unread_count ?? 0,
    isAiActive: raw.status !== "human_takeover",
    lastMessageAt: formatDistanceToNow(new Date(lastActivity), { addSuffix: true, locale: es }),
    lastMessageAtRaw: lastActivity,
    dateGroup: getDateGroup(lastActivity),
    visitorName: raw.visitor_name,
    visitorPhone: raw.from_number,
    visitorInitials: raw.visitor_name ? getNameInitials(raw.visitor_name) : getPhoneInitials(raw.from_number),
    lastMessage: lastMessage?.content ?? "Sin mensajes",
    messages: mapWhatsAppMessages(raw.messages),
    windowOpen: raw.window_open,
  }
}
