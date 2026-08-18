"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { BellIcon, CheckCheckIcon, ChevronDownIcon, InboxIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/table-utils"
import { CHANNEL_COLORS, CHANNEL_LABELS, ChannelBadge } from "@/components/dashboard/messaging/ChannelBadge"
import { notificationService } from "@/services/notification.service"
import { whatsappService } from "@/services/whatsapp.service"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { UnreadConversationNotificationRaw } from "@/types/notification"

// Campanita real — reemplaza al mock. Se deriva del mismo last_read_at/unread_count
// que ya alimenta los badges de Mensajería (WhatsApp + Widget IA por ahora; IG/FB
// quedan pendientes de validación de Meta). Se actualiza en vivo vía socket
// (whatsapp_conversation:updated / ai_conversation:updated, ya emitidos al llegar
// un mensaje entrante) y además por polling como respaldo si el socket se cae.

const POLL_INTERVAL_MS = 45_000

function keyOf(n: UnreadConversationNotificationRaw): string {
  return `${n.channel}-${n.conversationId}`
}

async function markRead(n: UnreadConversationNotificationRaw): Promise<void> {
  if (n.channel === "whatsapp") {
    await whatsappService.markConversationRead(n.conversationId)
  } else if (n.channel === "widget" && n.widgetId) {
    await notificationService.markWidgetConversationRead(n.widgetId, n.conversationId)
  }
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: UnreadConversationNotificationRaw
  onOpen: (n: UnreadConversationNotificationRaw) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const hasThread = notification.unreadCount > 1

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-lg border transition-colors hover:bg-muted/50"
      style={{ borderLeftWidth: 3, borderLeftColor: "var(--channel-color)" }}
    >
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
      >
        <Avatar className="mt-0.5 size-9 shrink-0">
          <AvatarImage src="https://github.com/shadcn.png" alt="" />
          <AvatarFallback className="text-[13px] font-medium">
            {getInitials(notification.visitorName)}
          </AvatarFallback>
          <ChannelBadge channel={notification.channel} />
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between gap-1">
            <span className="truncate text-sm font-semibold text-foreground">
              {notification.visitorName} te ha escrito ({notification.unreadCount})
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.lastActivityAt), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="mb-0.5 truncate text-xs text-muted-foreground">
            {CHANNEL_LABELS[notification.channel]}
          </p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{notification.lastMessage}</p>
        </div>
      </button>

      {hasThread && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger className="flex w-full items-center justify-center gap-1 border-t px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">
            {expanded ? "Ocultar conversación" : `Ver conversación (${notification.unreadCount})`}
            <ChevronDownIcon className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 border-t bg-muted/30 px-3 py-2">
            {notification.messages.map((m, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 rounded-md bg-background px-2.5 py-1.5 text-xs">
                <span className="min-w-0 flex-1 text-foreground">{m.content}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

export function BellButton() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<UnreadConversationNotificationRaw[]>([])

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await notificationService.getUnreadConversations()
      setNotifications(res)
    } catch {
      // silencioso — la campanita no debe romper el resto del layout si falla
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEntityRealtime("whatsapp_conversation", () => fetchNotifications(), { includeSelf: true })
  useEntityRealtime("ai_conversation", () => fetchNotifications(), { includeSelf: true })

  const totalUnread = notifications.reduce((sum, n) => sum + n.unreadCount, 0)

  function handleOpen(n: UnreadConversationNotificationRaw) {
    setOpen(false)
    setNotifications((prev) => prev.filter((x) => keyOf(x) !== keyOf(n)))
    const params = new URLSearchParams({ channel: n.channel, id: String(n.conversationId) })
    if (n.widgetId) params.set("widgetId", String(n.widgetId))
    router.push(`/crm/messaging?${params.toString()}`)
    markRead(n).catch(() => {})
  }

  function markAllRead() {
    const pending = notifications
    setNotifications([])
    pending.forEach((n) => { markRead(n).catch(() => {}) })
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchNotifications() }}>
      <PopoverTrigger
        render={
          <Button size="icon" className="relative rounded-full bg-amber-500 text-white hover:bg-amber-600" />
        }
      >
        <BellIcon className="size-4" />
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3.5 py-2.5">
          <p className="text-sm font-semibold">Notificaciones</p>
          {notifications.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={markAllRead}>
              <CheckCheckIcon className="size-3.5" />
              Marcar como leídas
            </Button>
          )}
        </div>

        <div className="max-h-100 overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <InboxIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Sin notificaciones nuevas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {notifications.map((n) => (
                <div key={keyOf(n)} style={{ "--channel-color": CHANNEL_COLORS[n.channel] } as React.CSSProperties}>
                  <NotificationRow notification={n} onOpen={handleOpen} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => { setOpen(false); router.push("/crm/messaging") }}
          >
            Ver todas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
