"use client"

import * as React from "react"
import { BellIcon, CheckCheckIcon, InboxIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/table-utils"
import { CHANNEL_COLORS, CHANNEL_LABELS, ChannelBadge } from "@/components/dashboard/messaging/ChannelBadge"
import type { ConversationChannel } from "@/components/dashboard/messaging/data"

// ─── Mock — solo para ver el diseño andar antes de conectar al backend real
// (tabla `notification` + socket, ver docs). Estructura pensada para calzar
// con esos campos (title/body/entity_type/created_at) sin rehacer el layout
// cuando se conecte de verdad.

interface MockNotification {
  id: number
  channel: ConversationChannel
  visitorName: string
  message: string
  createdAt: string
  read: boolean
}

const INITIAL_MOCK: MockNotification[] = [
  {
    id: 1,
    channel: "instagram",
    visitorName: "Visitante",
    message: "Estimado Kevin, un posible Lead te ha escrito por Instagram.",
    createdAt: "hace 2 min",
    read: false,
  },
  {
    id: 2,
    channel: "widget",
    visitorName: "Visitante",
    message: 'Un visitante escribió por el Widget IA en tu sitio web: "¿Hacen envíos a la Región de Valparaíso?"',
    createdAt: "hace 8 min",
    read: false,
  },
  {
    id: 3,
    channel: "facebook",
    visitorName: "Visitante",
    message: '"¿Tienen disponibilidad para un flete a Antofagasta esta semana?"',
    createdAt: "hace 15 min",
    read: false,
  },
  {
    id: 4,
    channel: "whatsapp",
    visitorName: "Visitante",
    message: '"Hola, quiero cotizar un flete nacional, ¿me pueden ayudar?"',
    createdAt: "hace 1 h",
    read: true,
  },
]

function NotificationRow({
  notification,
  onRead,
}: {
  notification: MockNotification
  onRead: (id: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onRead(notification.id)}
      className="relative flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      style={{ borderLeftWidth: 3, borderLeftColor: "var(--channel-color)" }}
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
          <span className={cn("truncate text-sm text-foreground", !notification.read && "font-semibold")}>
            Nuevo mensaje
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">{notification.createdAt}</span>
        </div>
        <p className="mb-0.5 truncate text-xs text-muted-foreground">
          {CHANNEL_LABELS[notification.channel]}
        </p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
      </div>

      {!notification.read && (
        <span className="absolute right-2.5 top-2.5 size-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  )
}

export function BellButton() {
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState(INITIAL_MOCK)

  const unreadCount = notifications.filter((n) => !n.read).length

  function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button size="icon" className="relative rounded-full bg-amber-500 text-white hover:bg-amber-600" />
        }
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3.5 py-2.5">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unreadCount > 0 && (
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
                <div key={n.id} style={{ "--channel-color": CHANNEL_COLORS[n.channel] } as React.CSSProperties}>
                  <NotificationRow notification={n} onRead={markRead} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Button type="button" variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
            Ver todas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
