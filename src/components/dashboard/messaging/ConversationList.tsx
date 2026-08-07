"use client"

import * as React from "react"
import { Loader2Icon, RefreshCwIcon, SearchIcon, ZapIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChannelBadge } from "./ChannelBadge"
import {
  type Conversation,
  type MessagingView,
  conversationKey,
} from "./data"

type FilterTab = "all" | "unread"

// El backend todavía no tiene un campo real de "leído/no leído" — el toggle se
// muestra (misma armonía visual que correo) pero "No leídos" queda deshabilitado
// hasta que exista tracking real, en vez de filtrar con datos poco confiables.
const SHOW_READ_FILTER = false

interface ConversationListProps {
  activeView: MessagingView
  title: string
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  onRefresh?: () => void
  refreshing?: boolean
}

export function ConversationList({
  activeView,
  title,
  conversations,
  selectedId,
  onSelect,
  loading = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onRefresh,
  refreshing = false,
}: ConversationListProps) {
  const [search, setSearch]   = React.useState("")
  const [tab, setTab]         = React.useState<FilterTab>("all")

  const filtered = React.useMemo(() => {
    return conversations.filter((c) => {
      if (tab === "unread" && c.isRead) return false
      if (typeof activeView === "number" && c.widgetId !== activeView) return false
      if (activeView === "whatsapp" && c.channel !== "whatsapp") return false
      if (activeView === "instagram" && c.channel !== "instagram") return false
      if (activeView === "facebook" && c.channel !== "facebook") return false
      if (search) {
        const q = search.toLowerCase()
        const name = c.visitorName ?? ""
        return (
          name.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q) ||
          (c.companyName ?? "").toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [conversations, tab, activeView, search])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <h2 className="flex-1 truncate text-base font-semibold">{title}</h2>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-sm"
            title="Refrescar"
            disabled={refreshing}
            onClick={onRefresh}
          >
            <RefreshCwIcon className={cn("size-3.5", refreshing && "animate-spin")} />
          </Button>
        )}
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="unread" disabled={!SHOW_READ_FILTER} title="Próximamente">
              No leídos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <div className="flex flex-col gap-1 px-2 pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5 animate-pulse">
                <div className="mt-0.5 size-9 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-2.5 w-full rounded bg-muted" />
                  <div className="h-2 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
        ) : (
          <div className="flex flex-col gap-1 px-2 pb-2">
            {filtered.map((conv) => {
              const subtitle = conv.widgetName ?? conv.companyName
              const key = conversationKey(conv)
              const isActive = selectedId === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(key)}
                  className={cn(
                    "relative flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  {/* Avatar + canal badge */}
                  <Avatar className="mt-0.5 size-9 shrink-0">
                    <AvatarImage src={conv.visitorAvatarUrl || "https://github.com/shadcn.png"} alt="" />
                    <AvatarFallback className="text-[13px] font-medium">
                      {conv.visitorInitials}
                    </AvatarFallback>
                    <ChannelBadge channel={conv.channel} />
                  </Avatar>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    {/* Línea 1: visitante + hora */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={cn(
                        "truncate text-sm text-foreground",
                        SHOW_READ_FILTER && !conv.isRead ? "font-semibold" : "font-medium"
                      )}>
                        {conv.visitorName ?? "Visitante"}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {conv.lastMessageAt}
                      </span>
                    </div>

                    {/* Línea 2: nombre de widget/empresa + ícono IA — hace de "asunto", igual de claro que el nombre */}
                    {subtitle && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="truncate text-sm text-foreground">
                          {subtitle}
                        </span>
                        {conv.isAiActive && (
                          <ZapIcon className="size-2.5 shrink-0 text-violet-500 dark:text-violet-400" />
                        )}
                      </div>
                    )}

                    {/* Línea 3: último mensaje — hace de "contenido", chico y gris */}
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {SHOW_READ_FILTER && !conv.isRead && (
                    <span className="absolute right-2.5 top-3.5 size-2 rounded-full bg-blue-500" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center py-3">
            <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {loadingMore ? "Cargando..." : "Cargar más"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
