"use client"

import * as React from "react"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import {
  BotIcon,
  Building2Icon,
  CalendarIcon,
  ChevronDown,
  ClockIcon,
  FileIcon,
  FileTextIcon,
  FlagIcon,
  GitBranchIcon,
  GlobeIcon,
  Loader2Icon,
  MegaphoneIcon,
  PackageIcon,
  TagIcon,
  TrendingUpIcon,
  UserCogIcon,
  UserIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { systemLogService } from "@/services/system-log.service"
import { teamService } from "@/services/team.service"
import type { SystemLogRaw } from "@/types/system-log"
import { useSessionStore } from "@/store/session.store"
import { getInitials } from "@/lib/table-utils"

// ─── Configuración de entidades ──────────────────────────────────────────────

// Un color por tipo de entidad (a diferencia de Fuente/Cargo, acá sí importa
// distinguir cada valor a simple vista dentro del mismo timeline) — colores ya
// probados en el resto de la app: Oportunidad y Embudo reusan el violeta e
// ícono de Funnels, Actividad reusa el calendario genérico de Actividades.
// Llaves = key_entity real en system_log (revisado en la base — la mayoría
// snake_case, userWorkspace es la excepción). "opportunity_activity" antes
// estaba mal escrito como "opportunityActivity" y nunca matcheaba nada, ni
// acá ni en el filtro de abajo.
const ENTITY_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  person:              { label: "Contacto",    icon: UserIcon,       className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  organization:        { label: "Empresa",     icon: Building2Icon,  className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400" },
  opportunity:         { label: "Oportunidad", icon: TrendingUpIcon, className: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  opportunity_activity:{ label: "Actividad",   icon: CalendarIcon,   className: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" },
  quotation:           { label: "Cotización",  icon: FileTextIcon,   className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400" },
  document:            { label: "Documento",   icon: FileIcon,       className: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" },
  flow:                { label: "Embudo",      icon: GitBranchIcon,  className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
  flow_stage:          { label: "Etapa",       icon: FlagIcon,       className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  product:             { label: "Producto",    icon: PackageIcon,    className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" },
  label:               { label: "Catálogo",    icon: TagIcon,        className: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400" },
  marketing:           { label: "Marketing",   icon: MegaphoneIcon,  className: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-400" },
  userWorkspace:       { label: "Usuario",     icon: UserCogIcon,    className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" },
  workspace:           { label: "Workspace",   icon: GlobeIcon,      className: "bg-muted text-muted-foreground" },
}

const ENTITY_FILTERS = [
  { key: "",               label: "Todo" },
  { key: "person",         label: "Contactos" },
  { key: "organization",   label: "Empresas" },
  { key: "opportunity",    label: "Oportunidades" },
  { key: "opportunity_activity", label: "Actividades" },
  { key: "quotation",      label: "Cotizaciones" },
  { key: "document",       label: "Documentos" },
  { key: "flow",           label: "Embudos" },
  { key: "flow_stage",     label: "Etapas" },
  { key: "product",        label: "Productos" },
  { key: "label",          label: "Catálogo" },
  { key: "marketing",      label: "Marketing" },
  { key: "userWorkspace",  label: "Usuarios" },
  { key: "workspace",      label: "Workspace" },
]

const PAGE_SIZE = 25

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByDay(logs: SystemLogRaw[]) {
  const groups: { label: string; key: string; logs: SystemLogRaw[] }[] = []
  const map = new Map<string, (typeof groups)[0]>()

  for (const log of logs) {
    const date = new Date(log.createdAt)
    const key = format(date, "yyyy-MM-dd")
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

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {[5, 3, 4].map((count, gi) => (
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
                    <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function ActivityTimeline() {
  const currentUser = useSessionStore((s) => s.user)

  const [logs, setLogs] = React.useState<SystemLogRaw[]>([])
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)

  const [userFilter, setUserFilter] = React.useState<number | "">("")
  const [entityFilter, setEntityFilter] = React.useState("")
  const [members, setMembers] = React.useState<{ userId: number; name: string; avatarUrl: string | null }[]>([])

  React.useEffect(() => {
    teamService.list({ take: 100 }).then((res) => {
      setMembers(res.data.map((m) => ({ userId: m.user_id, name: m.user?.name ?? m.user?.email ?? "—", avatarUrl: m.user?.avatar_url ?? null })))
    }).catch(() => {})
  }, [])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLogs([])
    setPage(1)

    systemLogService.list({
      page: 1,
      take: PAGE_SIZE,
      user_id: userFilter !== "" ? userFilter : undefined,
      keyEntity: entityFilter || undefined,
    }).then((res) => {
      if (cancelled) return
      setLogs(res.data)
      setHasMore(res.nextPage !== null)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [userFilter, entityFilter])

  function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    systemLogService.list({
      page: nextPage,
      take: PAGE_SIZE,
      user_id: userFilter !== "" ? userFilter : undefined,
      keyEntity: entityFilter || undefined,
    }).then((res) => {
      setLogs((prev) => [...prev, ...res.data])
      setHasMore(res.nextPage !== null)
      setPage(nextPage)
      setLoadingMore(false)
    }).catch(() => setLoadingMore(false))
  }

  const groups = React.useMemo(() => groupByDay(logs), [logs])

  const selectedUserLabel = React.useMemo(() => {
    if (userFilter === "") return "Todos los usuarios"
    if (userFilter === currentUser?.id) return `Yo (${currentUser?.name})`
    return members.find((m) => m.userId === userFilter)?.name ?? "Usuario"
  }, [userFilter, currentUser, members])

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              {selectedUserLabel}
              <ChevronDown className="ml-1 size-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuRadioGroup
                value={String(userFilter)}
                onValueChange={(v) => setUserFilter(v === "" ? "" : Number(v))}
              >
                <DropdownMenuRadioItem value="">Todos los usuarios</DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                {currentUser && (
                  <DropdownMenuRadioItem value={String(currentUser.id)}>
                    Yo ({currentUser.name})
                  </DropdownMenuRadioItem>
                )}
                {members
                  .filter((m) => m.userId !== currentUser?.id)
                  .map((m) => (
                    <DropdownMenuRadioItem key={m.userId} value={String(m.userId)}>
                      {m.name}
                    </DropdownMenuRadioItem>
                  ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setEntityFilter(f.key)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                entityFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <TimelineSkeleton />
      ) : groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay actividad registrada.
        </p>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm font-semibold">{group.label}</span>
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">{group.logs.length} eventos</span>
              </div>

              <div className="relative ml-3">
                <div className="absolute bottom-0 left-0 top-3 border-l-2" />

                {group.logs.map((log) => {
                  const entity = ENTITY_CONFIG[log.keyEntity] ?? { label: log.keyEntity, icon: TagIcon, className: "bg-muted text-muted-foreground" }
                  const time = format(new Date(log.createdAt), "HH:mm")
                  const userName = log.userName
                  const isSystem = !userName
                  const member   = log.userId ? members.find((m) => m.userId === log.userId) : undefined
                  const message = isSystem
                    ? log.message.replace(/El usuario\s+""\s*/i, "El widget ")
                    : log.message

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
                              <AvatarImage src={member?.avatarUrl ?? "https://github.com/shadcn.png"} />
                              <AvatarFallback className="text-base">
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className={cn("text-sm font-medium", isSystem && "text-muted-foreground")}>
                            {isSystem ? "Widget | Sistema" : userName}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{message}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ClockIcon className="size-3.5" />
                            <span>{time}</span>
                          </div>
                          <Badge
                            className={cn("gap-1 rounded-full border-0 text-xs", entity.className)}
                            variant="secondary"
                          >
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
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                {loadingMore ? "Cargando..." : "Cargar más"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
