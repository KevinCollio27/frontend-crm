"use client"

import * as React from "react"
import { ArrowUpDownIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  type Conversation,
  type MessagingView,
  AVATAR_COLOR_CLASSES,
  DATE_GROUP_LABELS,
  STATUS_CONFIG,
  VIEW_COUNTS,
  VIEW_LABELS,
} from "./data"

type FilterTab = "all" | "unread" | "open" | "resolved"

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all",      label: "Todos"     },
  { id: "unread",   label: "No leídos" },
  { id: "open",     label: "Abiertos"  },
  { id: "resolved", label: "Resueltos" },
]

function ChannelBadge({ channel }: { channel: Conversation["channel"] }) {
  if (channel === "whatsapp") {
    return (
      <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-[1.5px] border-background bg-[#25D366]">
        <img src="/images/WhatsApp.svg" alt="WhatsApp" className="size-2" />
      </span>
    )
  }
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-[1.5px] border-background bg-violet-600">
      <img src="/images/Asistente AI.svg" alt="Widget" className="size-2" />
    </span>
  )
}

interface ConversationListProps {
  activeView: MessagingView
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({
  activeView,
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [search, setSearch]   = React.useState("")
  const [tab, setTab]         = React.useState<FilterTab>("all")

  const filtered = React.useMemo(() => {
    return conversations.filter((c) => {
      if (tab === "unread"   && c.isRead)             return false
      if (tab === "open"     && c.status !== "open")  return false
      if (tab === "resolved" && c.status !== "resolved") return false
      if (activeView === "whatsapp" && c.channel !== "whatsapp") return false
      if (activeView === "widget"   && c.channel !== "widget")   return false
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

  // Agrupar por dateGroup manteniendo el orden original
  const groups = React.useMemo(() => {
    const map = new Map<string, Conversation[]>()
    for (const c of filtered) {
      const key = c.dateGroup
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return map
  }, [filtered])

  const groupOrder = ["today", "yesterday", "older"] as const

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{VIEW_LABELS[activeView]}</h2>
            <p className="text-xs text-muted-foreground">
              {VIEW_COUNTS[activeView]} conversaciones
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowUpDownIcon className="size-3" />
            Última actividad
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mt-2.5 flex gap-0.5">
          {FILTER_TABS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTab(f.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] transition-colors border",
                tab === f.id
                  ? "border-border bg-muted text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
        ) : (
          groupOrder.map((group) => {
            const items = groups.get(group)
            if (!items?.length) return null
            return (
              <React.Fragment key={group}>
                {/* Date separator */}
                <div className="border-b border-t bg-muted/50 px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {DATE_GROUP_LABELS[group]}
                </div>

                {items.map((conv) => {
                  const statusCfg = STATUS_CONFIG[conv.status]
                  const displayName = conv.visitorName ?? `Visitante · ${conv.widgetName ?? "Widget"}`
                  const isActive = selectedId === conv.id

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => onSelect(conv.id)}
                      className={cn(
                        "relative flex w-full items-start gap-2.5 border-b px-3.5 py-2.5 text-left transition-colors last:border-0",
                        isActive
                          ? "bg-violet-50 dark:bg-violet-950/20"
                          : "hover:bg-muted/50"
                      )}
                    >
                      {/* Avatar + canal badge */}
                      <div className="relative mt-0.5 shrink-0">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-full text-[13px] font-medium",
                          AVATAR_COLOR_CLASSES[conv.visitorAvatarColor]
                        )}>
                          {conv.visitorInitials}
                        </div>
                        <ChannelBadge channel={conv.channel} />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={cn(
                            "truncate text-xs",
                            !conv.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"
                          )}>
                            {displayName}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {conv.lastMessageAt}
                          </span>
                        </div>

                        <p className={cn(
                          "truncate text-[11px] mb-1",
                          !conv.isRead ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {conv.lastMessage}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            statusCfg.className
                          )}>
                            {statusCfg.label}
                          </span>
                          {conv.isAiActive && (
                            <span className="inline-flex items-center rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                              IA activa
                            </span>
                          )}
                          {conv.companyName && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              · {conv.companyName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!conv.isRead && (
                        <span className="absolute right-2.5 top-3.5 size-1.5 rounded-full bg-violet-600" />
                      )}
                    </button>
                  )
                })}
              </React.Fragment>
            )
          })
        )}
      </div>
    </div>
  )
}
