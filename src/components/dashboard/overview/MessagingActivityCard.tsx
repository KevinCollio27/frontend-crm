"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ExternalLinkIcon, Loader2Icon, MessagesSquareIcon } from "lucide-react"
import { SiWhatsapp } from "react-icons/si"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CHANNEL_LABELS, ChannelBadge } from "@/components/dashboard/messaging/ChannelBadge"
import type { ConversationChannel } from "@/components/dashboard/messaging/data"
import { WhatsAppIntegrationSheet } from "@/components/settings/integrations/WhatsAppIntegrationSheet"
import { ScrollDownHint } from "./ScrollDownHint"
import { useScrollHint } from "@/hooks/useScrollHint"
import { cn } from "@/lib/utils"
import { whatsappService } from "@/services/whatsapp.service"
import { instagramService } from "@/services/instagram.service"
import { facebookService } from "@/services/facebook.service"
import type { WhatsAppConversationRaw } from "@/types/whatsapp-conversation"
import type { InstagramConversationRaw } from "@/types/instagram-conversation"
import type { FacebookConversationRaw } from "@/types/facebook-conversation"

// Adaptación real de Ref15 — "Mensajería" (no solo WhatsApp), reutilizando ChannelBadge/
// Avatar reales de /crm/messaging (misma regla de avatar: imagen real o shadcn de
// fallback). Widget IA queda fuera de esta primera versión — a diferencia de WhatsApp/
// Instagram/Facebook (una sola llamada cada uno), listar sus conversaciones requiere
// primero listar los widgets activos y después las conversaciones de cada uno (N+1),
// más pesado para una card de dashboard — se puede sumar después si hace falta.
// Altura fija con scroll interno — igual que Correo (h-104, no el h-92 del resto): cada
// fila son 3 líneas de texto y con h-92 el 3er ítem quedaba cortado antes de tiempo.
const TAKE = 8

interface RecentConversation {
  key: string
  channel: ConversationChannel
  id: number
  name: string
  username?: string
  avatarUrl?: string
  initials: string
  lastMessage: string
  lastActivityAt: string
  unreadCount: number
}

function initials(name: string) {
  const clean = name.replace(/[^\p{L}\s]/gu, "").trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

function mapWhatsApp(raw: WhatsAppConversationRaw): RecentConversation {
  const last = raw.messages[raw.messages.length - 1]
  const name = raw.visitor_name || raw.from_number
  return {
    key: `whatsapp-${raw.id}`,
    channel: "whatsapp",
    id: raw.id,
    name,
    initials: initials(name),
    lastMessage: last?.content ?? "Sin mensajes",
    lastActivityAt: last?.created_at ?? raw.updated_at,
    unreadCount: raw.unread_count ?? 0,
  }
}

function mapInstagram(raw: InstagramConversationRaw): RecentConversation {
  const last = raw.messages[raw.messages.length - 1]
  const name = raw.visitor_name || "Instagram"
  return {
    key: `instagram-${raw.id}`,
    channel: "instagram",
    id: raw.id,
    name,
    username: raw.visitor_username ?? undefined,
    avatarUrl: raw.visitor_avatar_url ?? undefined,
    initials: initials(name),
    lastMessage: last?.content ?? "Sin mensajes",
    lastActivityAt: last?.created_at ?? raw.updated_at,
    unreadCount: raw.unread_count ?? 0,
  }
}

function mapFacebook(raw: FacebookConversationRaw): RecentConversation {
  const last = raw.messages[raw.messages.length - 1]
  const name = raw.visitor_name || "Facebook"
  return {
    key: `facebook-${raw.id}`,
    channel: "facebook",
    id: raw.id,
    name,
    avatarUrl: raw.visitor_avatar_url ?? undefined,
    initials: initials(name),
    lastMessage: last?.content ?? "Sin mensajes",
    lastActivityAt: last?.created_at ?? raw.updated_at,
    unreadCount: raw.unread_count ?? 0,
  }
}

function ConversationSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export function MessagingActivityCard() {
  const router = useRouter()
  const [conversations, setConversations] = React.useState<RecentConversation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const { ref: scrollRef, canScrollDown, scrollStep, onScroll } = useScrollHint<HTMLDivElement>([conversations])

  // Offset por canal — cada uno pagina aparte (mismo criterio que /crm/messaging),
  // "hay más" es true si algún canal todavía tiene página pendiente.
  const offsets = React.useRef({ whatsapp: 0, instagram: 0, facebook: 0 })
  const [hasMore, setHasMore] = React.useState({ whatsapp: false, instagram: false, facebook: false })
  const anyHasMore = hasMore.whatsapp || hasMore.instagram || hasMore.facebook

  const [whatsappConnected, setWhatsappConnected] = React.useState(true)
  const [whatsappSheetOpen, setWhatsappSheetOpen] = React.useState(false)

  // Reutilizable para volver a cargar después de conectar WhatsApp desde el botón — a
  // diferencia del efecto de montaje (abajo), esta sí se puede llamar con setLoading(true)
  // síncrono porque corre desde un handler de evento, no desde un efecto.
  function loadConversations() {
    setLoading(true)
    Promise.all([
      whatsappService.listConversations({ limit: TAKE, offset: 0 }).then((rows) => rows.map(mapWhatsApp)).catch(() => []),
      instagramService.listConversations({ limit: TAKE, offset: 0 }).then((rows) => rows.map(mapInstagram)).catch(() => []),
      facebookService.listConversations({ limit: TAKE, offset: 0 }).then((rows) => rows.map(mapFacebook)).catch(() => []),
    ])
      .then(([wa, ig, fb]) => {
        offsets.current = { whatsapp: wa.length, instagram: ig.length, facebook: fb.length }
        setHasMore({ whatsapp: wa.length === TAKE, instagram: ig.length === TAKE, facebook: fb.length === TAKE })
        const merged = [...wa, ...ig, ...fb].sort(
          (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        )
        setConversations(merged)
      })
      .finally(() => setLoading(false))
  }

  React.useEffect(() => {
    let cancelled = false
    Promise.all([
      whatsappService.listConversations({ limit: TAKE, offset: 0 }).then((rows) => rows.map(mapWhatsApp)).catch(() => []),
      instagramService.listConversations({ limit: TAKE, offset: 0 }).then((rows) => rows.map(mapInstagram)).catch(() => []),
      facebookService.listConversations({ limit: TAKE, offset: 0 }).then((rows) => rows.map(mapFacebook)).catch(() => []),
    ])
      .then(([wa, ig, fb]) => {
        if (cancelled) return
        offsets.current = { whatsapp: wa.length, instagram: ig.length, facebook: fb.length }
        setHasMore({ whatsapp: wa.length === TAKE, instagram: ig.length === TAKE, facebook: fb.length === TAKE })
        const merged = [...wa, ...ig, ...fb].sort(
          (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        )
        setConversations(merged)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => {
    whatsappService.getMetaConfig()
      .then((config) => setWhatsappConnected(!!config))
      .catch(() => setWhatsappConnected(false))
  }, [])

  function loadMore() {
    setLoadingMore(true)
    Promise.all([
      hasMore.whatsapp
        ? whatsappService.listConversations({ limit: TAKE, offset: offsets.current.whatsapp }).then((rows) => rows.map(mapWhatsApp)).catch(() => [])
        : Promise.resolve<RecentConversation[]>([]),
      hasMore.instagram
        ? instagramService.listConversations({ limit: TAKE, offset: offsets.current.instagram }).then((rows) => rows.map(mapInstagram)).catch(() => [])
        : Promise.resolve<RecentConversation[]>([]),
      hasMore.facebook
        ? facebookService.listConversations({ limit: TAKE, offset: offsets.current.facebook }).then((rows) => rows.map(mapFacebook)).catch(() => [])
        : Promise.resolve<RecentConversation[]>([]),
    ])
      .then(([wa, ig, fb]) => {
        offsets.current = {
          whatsapp: offsets.current.whatsapp + wa.length,
          instagram: offsets.current.instagram + ig.length,
          facebook: offsets.current.facebook + fb.length,
        }
        setHasMore({ whatsapp: wa.length === TAKE, instagram: ig.length === TAKE, facebook: fb.length === TAKE })
        setConversations((prev) =>
          [...prev, ...wa, ...ig, ...fb].sort(
            (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
          )
        )
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  return (
    <Card className="h-104">
      <CardContent className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2.5">
          <MessagesSquareIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Mensajería</p>
            <p className="text-base font-semibold">Conversaciones Recientes</p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 divide-y overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => <ConversationSkeleton key={i} />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {whatsappConnected ? "Sin conversaciones recientes." : "Conecta WhatsApp para ver tus conversaciones acá."}
            </p>
            {!whatsappConnected && (
              <Button size="sm" className="gap-1.5" onClick={() => setWhatsappSheetOpen(true)}>
                <SiWhatsapp className="size-3.5" />
                Conectar WhatsApp
              </Button>
            )}
          </div>
        ) : (
          <div className="relative flex-1 overflow-hidden">
            <div ref={scrollRef} onScroll={onScroll} className="h-full divide-y overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {conversations.map((c) => (
                <div key={c.key} className="flex items-start gap-3 py-3.5">
                  <Avatar className="mt-0.5 shrink-0">
                    <AvatarImage src={c.avatarUrl || "https://github.com/shadcn.png"} alt={c.name} />
                    <AvatarFallback className="text-[13px] font-medium">{c.initials}</AvatarFallback>
                    <ChannelBadge channel={c.channel} />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", c.unreadCount > 0 ? "font-semibold" : "font-medium")}>{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.username ? `@${c.username}` : CHANNEL_LABELS[c.channel]}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.lastMessage}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {c.unreadCount > 0 && (
                        <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {c.unreadCount > 9 ? "9+" : c.unreadCount}
                        </span>
                      )}
                      {formatDistanceToNow(new Date(c.lastActivityAt), { addSuffix: true, locale: es })}
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      title="Ver Detalles"
                      onClick={() => router.push(`/crm/messaging?channel=${c.channel}&id=${c.id}`)}
                    >
                      <ExternalLinkIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}

              {anyHasMore && (
                <div className="flex justify-center py-3">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                    {loadingMore ? "Cargando..." : "Cargar más"}
                  </Button>
                </div>
              )}
            </div>
            <ScrollDownHint visible={canScrollDown} onClick={scrollStep} />
          </div>
        )}
      </CardContent>

      <WhatsAppIntegrationSheet
        open={whatsappSheetOpen}
        onOpenChange={setWhatsappSheetOpen}
        onSuccess={() => {
          setWhatsappConnected(true)
          loadConversations()
        }}
      />
    </Card>
  )
}
