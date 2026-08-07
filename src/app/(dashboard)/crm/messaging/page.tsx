"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { MessagesSquareIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { MessagingNav, type AgentNavItem } from "@/components/dashboard/messaging/MessagingNav"
import { ConversationList } from "@/components/dashboard/messaging/ConversationList"
import { ConversationView } from "@/components/dashboard/messaging/ConversationView"
import { conversationKey } from "@/components/dashboard/messaging/data"
import type { Conversation, MessagingView } from "@/components/dashboard/messaging/data"
import { widgetAIService } from "@/services/widget-ai.service"
import { whatsappService } from "@/services/whatsapp.service"
import { instagramService } from "@/services/instagram.service"
import { facebookService } from "@/services/facebook.service"
import type { WidgetConversationRaw, WidgetMessageRaw } from "@/types/widget-conversation"
import type { WidgetAIRaw } from "@/types/widget-ai"
import type { WhatsAppConversationMessageRaw, WhatsAppConversationRaw } from "@/types/whatsapp-conversation"
import type { InstagramConversationMessageRaw, InstagramConversationRaw } from "@/types/instagram-conversation"
import type { FacebookConversationMessageRaw, FacebookConversationRaw } from "@/types/facebook-conversation"
import { useSidebar } from "@/components/ui/sidebar"
import { useSessionStore } from "@/store/session.store"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"

const PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateGroup(dateStr: string): Conversation["dateGroup"] {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date >= today) return "today"
  if (date >= yesterday) return "yesterday"
  return "older"
}

function getInitials(email: string | null): string {
  if (!email) return "?"
  const local = email.split("@")[0]
  const parts = local.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.substring(0, 2).toUpperCase()
}

function getPhoneInitials(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits ? digits.slice(-2) : "WA"
}

// Mensajes viejos (previos a agregar `author`) no distinguen IA de operador humano —
// por eso el default es "bot", no porque asumamos que todo assistant es la IA.
function assistantMessageRole(author: "ai" | "human" | undefined): "bot" | "agent" {
  return author === "human" ? "agent" : "bot"
}

function mapWhatsAppMessages(raws: WhatsAppConversationMessageRaw[]): Conversation["messages"] {
  return raws.map((m, i) => ({
    id: `${i}-${m.created_at}`,
    role: m.role === "assistant" ? assistantMessageRole(m.author) : ("user" as const),
    content: m.content,
    createdAt: formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es }),
  }))
}

function mapWhatsAppConversation(raw: WhatsAppConversationRaw): Conversation {
  const lastMessage = raw.messages[raw.messages.length - 1]
  return {
    id: String(raw.id),
    channel: "whatsapp",
    status: "open",
    isRead: false,
    isAiActive: raw.status !== "human_takeover",
    lastMessageAt: formatDistanceToNow(new Date(raw.updated_at), { addSuffix: true, locale: es }),
    lastMessageAtRaw: raw.updated_at,
    dateGroup: getDateGroup(raw.updated_at),
    visitorName: raw.visitor_name,
    visitorPhone: raw.from_number,
    visitorInitials: raw.visitor_name ? getNameInitials(raw.visitor_name) : getPhoneInitials(raw.from_number),
    lastMessage: lastMessage?.content ?? "Sin mensajes",
    messages: mapWhatsAppMessages(raw.messages),
    windowOpen: raw.window_open,
  }
}

function mapInstagramMessages(raws: InstagramConversationMessageRaw[]): Conversation["messages"] {
  return raws.map((m, i) => ({
    id: `${i}-${m.created_at}`,
    role: m.role === "assistant" ? assistantMessageRole(m.author) : ("user" as const),
    content: m.content,
    createdAt: formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es }),
  }))
}

function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

function mapInstagramConversation(raw: InstagramConversationRaw): Conversation {
  const lastMessage = raw.messages[raw.messages.length - 1]
  return {
    id: String(raw.id),
    channel: "instagram",
    status: "open",
    isRead: false,
    isAiActive: raw.status !== "human_takeover",
    lastMessageAt: formatDistanceToNow(new Date(raw.updated_at), { addSuffix: true, locale: es }),
    lastMessageAtRaw: raw.updated_at,
    dateGroup: getDateGroup(raw.updated_at),
    visitorName: raw.visitor_name,
    visitorUsername: raw.visitor_username ?? undefined,
    visitorAvatarUrl: raw.visitor_avatar_url ?? undefined,
    visitorInitials: raw.visitor_name ? getNameInitials(raw.visitor_name) : "IG",
    lastMessage: lastMessage?.content ?? "Sin mensajes",
    messages: mapInstagramMessages(raw.messages),
    windowOpen: raw.window_open,
  }
}

function mapFacebookMessages(raws: FacebookConversationMessageRaw[]): Conversation["messages"] {
  return raws.map((m, i) => ({
    id: `${i}-${m.created_at}`,
    role: m.role === "assistant" ? assistantMessageRole(m.author) : ("user" as const),
    content: m.content,
    createdAt: formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es }),
  }))
}

function mapFacebookConversation(raw: FacebookConversationRaw): Conversation {
  const lastMessage = raw.messages[raw.messages.length - 1]
  return {
    id: String(raw.id),
    channel: "facebook",
    status: "open",
    isRead: false,
    isAiActive: raw.status !== "human_takeover",
    lastMessageAt: formatDistanceToNow(new Date(raw.updated_at), { addSuffix: true, locale: es }),
    lastMessageAtRaw: raw.updated_at,
    dateGroup: getDateGroup(raw.updated_at),
    visitorName: raw.visitor_name,
    visitorAvatarUrl: raw.visitor_avatar_url ?? undefined,
    visitorInitials: raw.visitor_name ? getNameInitials(raw.visitor_name) : "FB",
    lastMessage: lastMessage?.content ?? "Sin mensajes",
    messages: mapFacebookMessages(raw.messages),
    windowOpen: raw.window_open,
  }
}

function mapWidgetConversation(raw: WidgetConversationRaw, widget: WidgetAIRaw): Conversation {
  return {
    id: String(raw.id),
    channel: "widget",
    status: "open",
    isRead: false,
    isAiActive: true,
    lastMessageAt: formatDistanceToNow(new Date(raw.last_message_at), { addSuffix: true, locale: es }),
    lastMessageAtRaw: raw.last_message_at,
    dateGroup: getDateGroup(raw.last_message_at),
    visitorName: raw.captured_email ?? null,
    visitorEmail: raw.captured_email ?? undefined,
    visitorInitials: getInitials(raw.captured_email),
    widgetName: widget.name,
    lastMessage: raw.last_message_preview ?? "Sin mensajes",
    messages: [],
    widgetId: widget.id,
  }
}

function mapMessages(raws: WidgetMessageRaw[]): Conversation["messages"] {
  return raws
    .filter((m) => m.role !== "system")
    .map((m) => ({
      id: String(m.id),
      role: m.role === "assistant" ? ("bot" as const) : ("user" as const),
      content: m.content,
      createdAt: formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es }),
    }))
}

function mergeAndSort(items: Conversation[]): Conversation[] {
  const byKey = new Map<string, Conversation>()
  for (const item of items) byKey.set(conversationKey(item), item)
  return [...byKey.values()].sort(
    (a, b) => new Date(b.lastMessageAtRaw ?? 0).getTime() - new Date(a.lastMessageAtRaw ?? 0).getTime()
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagingPage() {
  const { setOpen } = useSidebar()
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const [activeView, setActiveView] = React.useState<MessagingView>("my_inbox")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [hasMoreWhatsapp, setHasMoreWhatsapp] = React.useState(false)
  const [hasMoreInstagram, setHasMoreInstagram] = React.useState(false)
  const [hasMoreFacebook, setHasMoreFacebook] = React.useState(false)
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | undefined>(undefined)
  const [loadingMessages, setLoadingMessages] = React.useState(false)

  // widgetId -> próxima página a pedir (se borra cuando ese widget ya no tiene más)
  const cursorsRef = React.useRef<Map<number, number>>(new Map())
  const widgetsRef = React.useRef<WidgetAIRaw[]>([])
  // Cuántas conversaciones de WhatsApp/Instagram/Facebook ya se pidieron — offset para "cargar más"
  const whatsappOffsetRef = React.useRef(0)
  const instagramOffsetRef = React.useRef(0)
  const facebookOffsetRef = React.useRef(0)

  // Tiempo real: mensajes entrantes por webhook, o takeover/release/envío desde otra
  // sesión del mismo workspace. El backend emite whatsapp_conversation:updated/
  // instagram_conversation:updated con solo el id — acá se refetchea esa conversación
  // puntual y se hace upsert en la lista.
  useEntityRealtime("whatsapp_conversation", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (!changedId) return
    whatsappService.getConversation(changedId)
      .then((raw) => {
        const mapped = mapWhatsAppConversation(raw)
        setConversations((prev) => {
          const exists = prev.some((c) => c.channel === "whatsapp" && c.id === mapped.id)
          const next = exists
            ? prev.map((c) => (c.channel === "whatsapp" && c.id === mapped.id ? mapped : c))
            : [...prev, mapped]
          return mergeAndSort(next)
        })
      })
      .catch(() => {})
  })

  useEntityRealtime("instagram_conversation", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (!changedId) return
    instagramService.getConversation(changedId)
      .then((raw) => {
        const mapped = mapInstagramConversation(raw)
        setConversations((prev) => {
          const exists = prev.some((c) => c.channel === "instagram" && c.id === mapped.id)
          const next = exists
            ? prev.map((c) => (c.channel === "instagram" && c.id === mapped.id ? mapped : c))
            : [...prev, mapped]
          return mergeAndSort(next)
        })
      })
      .catch(() => {})
  })

  useEntityRealtime("facebook_conversation", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (!changedId) return
    facebookService.getConversation(changedId)
      .then((raw) => {
        const mapped = mapFacebookConversation(raw)
        setConversations((prev) => {
          const exists = prev.some((c) => c.channel === "facebook" && c.id === mapped.id)
          const next = exists
            ? prev.map((c) => (c.channel === "facebook" && c.id === mapped.id ? mapped : c))
            : [...prev, mapped]
          return mergeAndSort(next)
        })
      })
      .catch(() => {})
  })

  React.useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Trae la primera página de los 3 pools (Widget/WhatsApp/Instagram) y los combina.
  // La usan tanto la carga inicial como el botón "Refrescar" — a diferencia de la carga
  // inicial, refrescar NO debe tocar activeView/selectedId (el usuario puede estar viendo
  // un filtro puntual o una conversación abierta).
  const loadConversations = React.useCallback(async (): Promise<Conversation[]> => {
    cursorsRef.current = new Map()
    widgetsRef.current = []
    whatsappOffsetRef.current = 0
    instagramOffsetRef.current = 0
    facebookOffsetRef.current = 0

    const [widgetGroups, whatsappRows, instagramRows, facebookRows] = await Promise.all([
      (async () => {
        const widgetPage = await widgetAIService.list({ is_whatsapp_agent: false, take: 100 })
        const widgets = widgetPage.data.filter((w) => w.is_active)
        widgetsRef.current = widgets

        const pages = await Promise.all(
          widgets.map((widget) =>
            widgetAIService.conversations(widget.id, { page: 1, limit: PAGE_SIZE }).then((res) => {
              if (res.page >= res.totalPages) {
                cursorsRef.current.delete(widget.id)
              } else {
                cursorsRef.current.set(widget.id, res.page + 1)
              }
              return res.conversations.map((raw) => mapWidgetConversation(raw, widget))
            })
          )
        )
        return pages.flat()
      })(),
      whatsappService.listConversations({ limit: PAGE_SIZE, offset: 0 })
        .then((rows) => {
          whatsappOffsetRef.current = rows.length
          setHasMoreWhatsapp(rows.length === PAGE_SIZE)
          return rows.map(mapWhatsAppConversation)
        })
        .catch(() => []),
      instagramService.listConversations({ limit: PAGE_SIZE, offset: 0 })
        .then((rows) => {
          instagramOffsetRef.current = rows.length
          setHasMoreInstagram(rows.length === PAGE_SIZE)
          return rows.map(mapInstagramConversation)
        })
        .catch(() => []),
      facebookService.listConversations({ limit: PAGE_SIZE, offset: 0 })
        .then((rows) => {
          facebookOffsetRef.current = rows.length
          setHasMoreFacebook(rows.length === PAGE_SIZE)
          return rows.map(mapFacebookConversation)
        })
        .catch(() => []),
    ])

    setHasMore(cursorsRef.current.size > 0)
    return mergeAndSort([...widgetGroups, ...whatsappRows, ...instagramRows, ...facebookRows])
  }, [])

  // Carga inicial — se repite cada vez que cambia el workspace activo
  // (el componente no se desmonta al cambiar de workspace, así que no
  // alcanza con un guard de "una sola vez").
  React.useEffect(() => {
    if (!workspaceId) return
    let cancelled = false

    setConversations([])
    setHasMore(false)
    setHasMoreWhatsapp(false)
    setHasMoreInstagram(false)
    setHasMoreFacebook(false)
    setSelectedId(null)
    setSelectedConversation(undefined)
    setActiveView("my_inbox")
    setLoading(true)

    loadConversations()
      .then((merged) => { if (!cancelled) setConversations(merged) })
      .catch(() => { /* keep empty on error */ })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [workspaceId, loadConversations])

  const [refreshing, setRefreshing] = React.useState(false)
  function handleRefresh() {
    setRefreshing(true)
    loadConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setRefreshing(false))
  }

  function loadMoreConversations() {
    // Si hay un agente filtrado, solo pide más de ese agente — no de todo el workspace.
    const pendingWidgets = widgetsRef.current.filter((w) =>
      cursorsRef.current.has(w.id) && (typeof activeView !== "number" || w.id === activeView)
    )
    const loadWhatsapp = hasMoreWhatsapp && (activeView === "my_inbox" || activeView === "whatsapp")
    const loadInstagram = hasMoreInstagram && (activeView === "my_inbox" || activeView === "instagram")
    const loadFacebook = hasMoreFacebook && (activeView === "my_inbox" || activeView === "facebook")
    if (pendingWidgets.length === 0 && !loadWhatsapp && !loadInstagram && !loadFacebook) return
    setLoadingMore(true)

    const widgetPromise = Promise.all(
      pendingWidgets.map((widget) => {
        const page = cursorsRef.current.get(widget.id)!
        return widgetAIService.conversations(widget.id, { page, limit: PAGE_SIZE }).then((res) => {
          if (res.page >= res.totalPages) {
            cursorsRef.current.delete(widget.id)
          } else {
            cursorsRef.current.set(widget.id, page + 1)
          }
          return res.conversations.map((raw) => mapWidgetConversation(raw, widget))
        })
      })
    )

    const whatsappPromise = loadWhatsapp
      ? whatsappService.listConversations({ limit: PAGE_SIZE, offset: whatsappOffsetRef.current }).then((rows) => {
          whatsappOffsetRef.current += rows.length
          setHasMoreWhatsapp(rows.length === PAGE_SIZE)
          return rows.map(mapWhatsAppConversation)
        })
      : Promise.resolve<Conversation[]>([])

    const instagramPromise = loadInstagram
      ? instagramService.listConversations({ limit: PAGE_SIZE, offset: instagramOffsetRef.current }).then((rows) => {
          instagramOffsetRef.current += rows.length
          setHasMoreInstagram(rows.length === PAGE_SIZE)
          return rows.map(mapInstagramConversation)
        })
      : Promise.resolve<Conversation[]>([])

    const facebookPromise = loadFacebook
      ? facebookService.listConversations({ limit: PAGE_SIZE, offset: facebookOffsetRef.current }).then((rows) => {
          facebookOffsetRef.current += rows.length
          setHasMoreFacebook(rows.length === PAGE_SIZE)
          return rows.map(mapFacebookConversation)
        })
      : Promise.resolve<Conversation[]>([])

    Promise.all([widgetPromise, whatsappPromise, instagramPromise, facebookPromise])
      .then(([widgetPages, whatsappRows, instagramRows, facebookRows]) => {
        setConversations((prev) => mergeAndSort([...prev, ...widgetPages.flat(), ...whatsappRows, ...instagramRows, ...facebookRows]))
        setHasMore(cursorsRef.current.size > 0)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  // Agentes con al menos una conversación cargada — si un widget nunca interactuó, no aparece en el filtro
  const agents = React.useMemo<AgentNavItem[]>(() => {
    const byWidget = new Map<number, AgentNavItem>()
    for (const c of conversations) {
      if (!c.widgetId || !c.widgetName) continue
      const entry = byWidget.get(c.widgetId)
      if (entry) entry.count += 1
      else byWidget.set(c.widgetId, { id: c.widgetId, name: c.widgetName, count: 1 })
    }
    return [...byWidget.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [conversations])

  const whatsappCount = React.useMemo(
    () => conversations.filter((c) => c.channel === "whatsapp").length,
    [conversations]
  )

  const instagramCount = React.useMemo(
    () => conversations.filter((c) => c.channel === "instagram").length,
    [conversations]
  )

  const facebookCount = React.useMemo(
    () => conversations.filter((c) => c.channel === "facebook").length,
    [conversations]
  )

  // "Cargar más" solo debe verse si lo que estás viendo (bandeja completa, WhatsApp,
  // Instagram, Facebook o un agente puntual) todavía tiene páginas pendientes.
  const hasMoreForView = typeof activeView === "number"
    ? cursorsRef.current.has(activeView)
    : activeView === "whatsapp"
      ? hasMoreWhatsapp
      : activeView === "instagram"
        ? hasMoreInstagram
        : activeView === "facebook"
          ? hasMoreFacebook
          : hasMore || hasMoreWhatsapp || hasMoreInstagram || hasMoreFacebook

  const listTitle = activeView === "my_inbox"
    ? "Mi bandeja"
    : activeView === "whatsapp"
      ? "WhatsApp"
      : activeView === "instagram"
        ? "Instagram"
        : activeView === "facebook"
          ? "Facebook Messenger"
          : agents.find((a) => a.id === activeView)?.name ?? "Agente"

  // Sync selectedConversation when view, selectedId, or conversations change.
  // Si no hay nada seleccionado todavía (o lo seleccionado no está en este pool),
  // cae en el primero — así no dependemos de fijar una selección "a mano" en cada fetch.
  React.useEffect(() => {
    const pool = typeof activeView === "number"
      ? conversations.filter((c) => c.widgetId === activeView)
      : activeView === "whatsapp"
        ? conversations.filter((c) => c.channel === "whatsapp")
        : activeView === "instagram"
          ? conversations.filter((c) => c.channel === "instagram")
          : activeView === "facebook"
            ? conversations.filter((c) => c.channel === "facebook")
            : conversations
    const found = pool.find((c) => conversationKey(c) === selectedId)
    if (found) {
      // Widget carga sus mensajes aparte (lazy) — si ya era la seleccionada, conservar
      // los que ya se cargaron en vez de pisarlos con el `messages: []` del pool.
      // WhatsApp ya trae los mensajes completos en el pool, así que se toma tal cual
      // (incluye lo que se acaba de enviar/tomar control vía onConversationChange).
      setSelectedConversation((prev) => {
        if (found.channel === "widget" && prev && conversationKey(prev) === selectedId) {
          return { ...found, messages: prev.messages }
        }
        return found
      })
    } else if (pool.length > 0) {
      setSelectedId(conversationKey(pool[0]))
    } else {
      setSelectedConversation(undefined)
    }
  }, [activeView, selectedId, conversations])

  // Lazy-load messages when a widget conversation is selected — WhatsApp ya trae sus
  // mensajes completos desde el fetch inicial (mapWhatsAppConversation), así que este
  // efecto no aplica a esas conversaciones (conv.widgetId queda undefined para WhatsApp).
  React.useEffect(() => {
    if (!selectedId) return
    const conv = conversations.find((c) => conversationKey(c) === selectedId)
    if (!conv?.widgetId) return

    const controller = new AbortController()
    setLoadingMessages(true)

    ;(async () => {
      try {
        const msgs = await widgetAIService.messages(conv.widgetId!, Number(conv.id))
        if (controller.signal.aborted) return
        setSelectedConversation((prev) =>
          prev && conversationKey(prev) === selectedId ? { ...prev, messages: mapMessages(msgs) } : prev
        )
      } catch {
        // keep empty
      } finally {
        if (!controller.signal.aborted) setLoadingMessages(false)
      }
    })()

    return () => controller.abort()
  }, [selectedId, conversations])

  return (
    <>
      <PageHeader
        icon={MessagesSquareIcon}
        title="Mensajería"
        description="Conversaciones de WhatsApp, Instagram, Facebook Messenger y tus agentes de Widget IA"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex w-52 shrink-0 flex-col overflow-hidden border-r">
          <MessagingNav
            activeView={activeView}
            onViewChange={setActiveView}
            inboxCount={conversations.length}
            whatsappCount={whatsappCount}
            instagramCount={instagramCount}
            facebookCount={facebookCount}
            agents={agents}
          />
        </div>
        <div className="flex w-105 shrink-0 flex-col overflow-hidden border-r">
          <ConversationList
            activeView={activeView}
            title={listTitle}
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            hasMore={hasMoreForView}
            loadingMore={loadingMore}
            onLoadMore={loadMoreConversations}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <ConversationView
            conversation={selectedConversation}
            loadingMessages={loadingMessages}
            onConversationChange={(updated) =>
              setConversations((prev) => prev.map((c) => (conversationKey(c) === conversationKey(updated) ? updated : c)))
            }
          />
        </div>
      </div>
    </>
  )
}
