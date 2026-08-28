"use client"

import * as React from "react"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import {
  BotIcon,
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  FileIcon,
  FileTextIcon,
  FlagIcon,
  GitBranchIcon,
  GlobeIcon,
  HistoryIcon,
  Loader2Icon,
  MegaphoneIcon,
  PackageIcon,
  TagIcon,
  TrendingUpIcon,
  UserCogIcon,
  UserIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollDownHint } from "./ScrollDownHint"
import { useScrollHint } from "@/hooks/useScrollHint"
import { cn } from "@/lib/utils"
import { systemLogService } from "@/services/system-log.service"
import { teamService } from "@/services/team.service"
import type { SystemLogRaw } from "@/types/system-log"

// Versión compacta de ActivityTimeline.tsx (Configuración → Actividad) para el
// Dashboard — mismo mecanismo (systemLogService.list sin keyEntity/keyEntityId ya
// trae el feed del workspace completo, no hace falta nada nuevo en el backend), mismo
// criterio de avatar (imagen real del usuario, o el placeholder de shadcn si no tiene).
const ENTITY_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  person:               { label: "Contacto",    icon: UserIcon,       className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  organization:         { label: "Empresa",     icon: Building2Icon,  className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400" },
  opportunity:          { label: "Oportunidad", icon: TrendingUpIcon, className: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  opportunity_activity: { label: "Actividad",   icon: CalendarIcon,   className: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" },
  quotation:            { label: "Cotización",  icon: FileTextIcon,   className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400" },
  document:             { label: "Documento",   icon: FileIcon,       className: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" },
  flow:                 { label: "Embudo",      icon: GitBranchIcon,  className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
  flow_stage:           { label: "Etapa",       icon: FlagIcon,       className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  product:              { label: "Producto",    icon: PackageIcon,    className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" },
  label:                { label: "Catálogo",    icon: TagIcon,        className: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400" },
  marketing:            { label: "Marketing",   icon: MegaphoneIcon,  className: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-400" },
  userWorkspace:        { label: "Usuario",     icon: UserCogIcon,    className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" },
  workspace:            { label: "Workspace",   icon: GlobeIcon,      className: "bg-muted text-muted-foreground" },
}

const TAKE = 8

function groupByDay(logs: SystemLogRaw[]) {
  const groups: { label: string; key: string; logs: SystemLogRaw[] }[] = []
  const map = new Map<string, (typeof groups)[0]>()

  for (const log of logs) {
    const date = new Date(log.createdAt)
    const key = format(date, "yyyy-MM-dd")
    if (!map.has(key)) {
      let label: string
      if (isToday(date)) label = "Hoy"
      else if (isYesterday(date)) label = "Ayer"
      else {
        const raw = format(date, "EEEE d 'de' MMMM", { locale: es })
        label = raw.charAt(0).toUpperCase() + raw.slice(1)
      }
      const group = { label, key, logs: [] }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key)!.logs.push(log)
  }
  return groups
}

function HistorySkeleton() {
  return (
    <div className="relative ml-2.5">
      <div className="absolute top-2 bottom-0 left-0 border-l-2" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="relative pb-4 pl-6 last:pb-0">
          <div className="absolute top-2 left-px h-2 w-2 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="size-5 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function WorkspaceHistoryCard() {
  const [logs, setLogs] = React.useState<SystemLogRaw[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [members, setMembers] = React.useState<{ userId: number; avatarUrl: string | null }[]>([])

  React.useEffect(() => {
    teamService.list({ take: 100 })
      .then((res) => setMembers(res.data.map((m) => ({ userId: m.user_id, avatarUrl: m.user?.avatar_url ?? null }))))
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    let cancelled = false
    systemLogService.list({ page: 1, take: TAKE })
      .then((res) => {
        if (cancelled) return
        setLogs(res.data)
        setHasMore(res.nextPage !== null)
      })
      .catch(() => { if (!cancelled) setLogs([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    systemLogService.list({ page: nextPage, take: TAKE })
      .then((res) => {
        setLogs((prev) => [...prev, ...res.data])
        setHasMore(res.nextPage !== null)
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const groups = React.useMemo(() => groupByDay(logs), [logs])
  const { ref: scrollRef, canScrollDown, scrollStep, onScroll } = useScrollHint<HTMLDivElement>([groups])

  // Altura fija apuntando al alto natural de MiniCalendarCard (no se tocó ese, éste se
  // ajusta al de al lado) para que la fila quede alineada sin importar cuántos eventos
  // traiga ni el tamaño del skeleton — el header queda fijo, la lista de abajo es lo
  // único que scrollea. El "Cargar más" para traer más registros queda pendiente.
  return (
    <Card className="h-92">
      <CardContent className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2.5">
          <HistoryIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Historial</p>
            <p className="text-base font-semibold">Actividad reciente</p>
          </div>
        </div>

        {loading ? (
          <HistorySkeleton />
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin actividad registrada.</p>
        ) : (
          <div className="relative flex-1 overflow-hidden">
            <div ref={scrollRef} onScroll={onScroll} className="h-full space-y-5 overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-semibold">{group.label}</span>
                  <div className="flex-1 border-t" />
                </div>

                <div className="relative ml-2.5">
                  <div className="absolute top-2 bottom-0 left-0 border-l-2" />

                  {group.logs.map((log) => {
                    const entity = ENTITY_CONFIG[log.keyEntity] ?? { label: log.keyEntity, icon: TagIcon, className: "bg-muted text-muted-foreground" }
                    const time = format(new Date(log.createdAt), "HH:mm")
                    const isSystem = !log.userName
                    const member = log.userId ? members.find((m) => m.userId === log.userId) : undefined

                    return (
                      <div key={log.id} className="relative pb-4 pl-6 last:pb-0">
                        <div className="absolute top-2 left-px h-2 w-2 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isSystem ? (
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                <BotIcon className="size-4 text-muted-foreground" />
                              </div>
                            ) : (
                              <Avatar className="shrink-0">
                                <AvatarImage src={member?.avatarUrl ?? "https://github.com/shadcn.png"} />
                                <AvatarFallback className="text-[13px] font-medium" />
                              </Avatar>
                            )}
                            <span className={cn("text-sm font-medium", isSystem && "text-muted-foreground")}>
                              {isSystem ? "Sistema" : log.userName}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{log.message}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ClockIcon className="size-3" /> {time}
                            </span>
                            <Badge className={cn("gap-1 rounded-full border-0 px-1.5 py-0 text-xs", entity.className)} variant="secondary">
                              <entity.icon className="size-3" />
                              {entity.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-1">
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
    </Card>
  )
}
