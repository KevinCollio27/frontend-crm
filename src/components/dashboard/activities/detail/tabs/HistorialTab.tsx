"use client"

import * as React from "react"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import { BotIcon, ClockIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { systemLogService } from "@/services/system-log.service"
import { teamService } from "@/services/team.service"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { SystemLogRaw } from "@/types/system-log"
import type { TeamMemberRaw } from "@/types/team"

// ─── Config ───────────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<string, { label: string; className: string }> = {
  opportunity_activity: { label: "Actividad",   className: "bg-green-50 text-green-700"    },
  note:                 { label: "Nota",         className: "bg-yellow-50 text-yellow-700"  },
  opportunity:          { label: "Oportunidad",  className: "bg-amber-50 text-amber-700"    },
  person:               { label: "Contacto",     className: "bg-blue-50 text-blue-700"      },
  organization:         { label: "Empresa",      className: "bg-violet-50 text-violet-700"  },
}

const ROLE_CONFIG: Record<"owner" | "admin" | "member", { label: string; className: string }> = {
  owner:  { label: "Propietario",   className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400" },
  admin:  { label: "Administrador", className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400"             },
  member: { label: "Activo",        className: "bg-muted text-muted-foreground"                                          },
}

function roleOf(member: TeamMemberRaw | undefined): keyof typeof ROLE_CONFIG | null {
  if (!member) return null
  if (member.is_owner) return "owner"
  if (member.is_admin) return "admin"
  return "member"
}

const PAGE_SIZE = 25

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDay(logs: SystemLogRaw[]) {
  const groups: { label: string; key: string; logs: SystemLogRaw[] }[] = []
  const map = new Map<string, (typeof groups)[0]>()

  for (const log of logs) {
    const date = new Date(log.createdAt)
    const key  = format(date, "yyyy-MM-dd")
    if (!map.has(key)) {
      let label: string
      if (isToday(date)) {
        label = "Hoy"
      } else if (isYesterday(date)) {
        label = "Ayer"
      } else {
        const raw = format(date, "EEEE, d 'de' MMMM", { locale: es })
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HistorialSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {[4, 3].map((count, gi) => (
        <div key={gi}>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="flex-1 border-t" />
          </div>
          <div className="relative ml-3">
            <div className="absolute bottom-0 left-0 top-3 border-l-2" />
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="relative pb-6 pl-7 last:pb-0">
                <div className="absolute left-px top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-7 animate-pulse rounded-full bg-muted" />
                    <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  activityId: number
}

export function HistorialTab({ activityId }: Props) {
  const [logs, setLogs]               = React.useState<SystemLogRaw[]>([])
  const [hasMore, setHasMore]         = React.useState(false)
  const [page, setPage]               = React.useState(1)
  const [loading, setLoading]         = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [refreshKey, setRefreshKey]   = React.useState(0)
  const [teamById, setTeamById]       = React.useState<Map<number, TeamMemberRaw>>(new Map())

  // Roster del workspace, para mostrar el rol ACTUAL de quien hizo la acción
  // (no el que tenía al momento del log, que no se guarda en el historial).
  React.useEffect(() => {
    teamService.list({ take: 100 })
      .then((res) => setTeamById(new Map(res.data.map((m) => [m.user_id, m]))))
      .catch(() => {})
  }, [])

  // El historial se llena como efecto secundario de otras acciones (crear una
  // nota) — escucha las entidades que loguean contra esta actividad y refresca
  // cuando corresponde a este activityId.
  useEntityRealtime("activity", (payload) => {
    if ((payload.data as { id?: number })?.id === activityId) setRefreshKey((k) => k + 1)
  })
  useEntityRealtime("note", (payload) => {
    if ((payload.data as { opportunity_activity_id?: number | null })?.opportunity_activity_id === activityId) {
      setRefreshKey((k) => k + 1)
    }
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLogs([])
    setPage(1)
    systemLogService
      .list({ page: 1, take: PAGE_SIZE, keyEntity: "opportunity_activity", keyEntityId: activityId })
      .then((res) => {
        if (cancelled) return
        setLogs(res.data)
        setHasMore(res.nextPage !== null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activityId, refreshKey])

  function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    systemLogService
      .list({ page: nextPage, take: PAGE_SIZE, keyEntity: "opportunity_activity", keyEntityId: activityId })
      .then((res) => {
        setLogs((prev) => [...prev, ...res.data])
        setHasMore(res.nextPage !== null)
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  if (loading) return <HistorialSkeleton />

  if (!logs.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Sin actividad registrada.
      </p>
    )
  }

  const groups = groupByDay(logs)

  return (
    <div className="space-y-6 p-4">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold">{group.label}</span>
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">{group.logs.length} evento{group.logs.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="relative ml-3">
            <div className="absolute bottom-0 left-0 top-3 border-l-2" />
            {group.logs.map((log) => {
              const entity   = ENTITY_CONFIG[log.keyEntity] ?? { label: log.keyEntity, className: "bg-muted text-muted-foreground" }
              const time     = format(new Date(log.createdAt), "HH:mm")
              const isSystem = !log.userName
              const member   = log.userId ? teamById.get(log.userId) : undefined
              const role     = isSystem ? null : roleOf(member)

              return (
                <div key={log.id} className="relative pb-6 pl-7 last:pb-0">
                  <div className="absolute left-px top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {isSystem ? (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          <BotIcon className="size-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <Avatar size="sm">
                          <AvatarImage src={member?.user?.avatar_url ?? "https://github.com/shadcn.png"} />
                          <AvatarFallback className="text-base" />
                        </Avatar>
                      )}
                      <span className={cn("text-sm font-medium", isSystem && "text-muted-foreground")}>
                        {isSystem ? "Sistema" : log.userName}
                      </span>
                      {role && (
                        <Badge
                          className={cn("rounded-full border-0 text-xs", ROLE_CONFIG[role].className)}
                          variant="secondary"
                        >
                          {ROLE_CONFIG[role].label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{log.message}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ClockIcon className="size-3.5" />
                        <span>{time}</span>
                      </div>
                      <Badge className={cn("rounded-full border-0 text-xs", entity.className)} variant="secondary">
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
  )
}
