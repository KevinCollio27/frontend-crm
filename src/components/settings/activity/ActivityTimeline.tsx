"use client"

import * as React from "react"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import { ClockIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type EventType = "create" | "update" | "delete" | "login" | "export"
type EntityType =
  | "contact"
  | "organization"
  | "opportunity"
  | "activity"
  | "funnel"
  | "product"
  | "user"
  | "workspace"

interface ActivityEvent {
  id: string
  type: EventType
  entity: EntityType
  user: { name: string; avatar: string }
  description: string
  target: string
  timestamp: Date
}

const USERS = {
  kevin: { name: "Kevin Collio", avatar: "https://github.com/shadcn.png" },
  maria: { name: "María García", avatar: "https://github.com/leerob.png" },
  carlos: { name: "Carlos López", avatar: "https://github.com/shadcn.png" },
}

const now = new Date()
const h = (n: number) => new Date(now.getTime() - n * 36e5)
const d = (n: number, hh = 12, mm = 0) => {
  const t = new Date(now)
  t.setDate(t.getDate() - n)
  t.setHours(hh, mm, 0, 0)
  return t
}

const MOCK_EVENTS: ActivityEvent[] = [
  { id: "1", type: "create", entity: "contact", user: USERS.kevin, description: "creó el contacto", target: "Juan Pérez", timestamp: h(1) },
  { id: "2", type: "update", entity: "opportunity", user: USERS.maria, description: "actualizó la oportunidad", target: "Empresa ABC — Renovación 2025", timestamp: h(2) },
  { id: "3", type: "create", entity: "organization", user: USERS.kevin, description: "creó la empresa", target: "Transportes del Norte S.A.", timestamp: h(4) },
  { id: "4", type: "delete", entity: "activity", user: USERS.carlos, description: "eliminó la actividad", target: "Llamada de seguimiento — Carlos Ruiz", timestamp: h(5) },
  { id: "5", type: "login", entity: "workspace", user: USERS.maria, description: "inició sesión en el workspace", target: "", timestamp: h(7) },
  { id: "6", type: "create", entity: "opportunity", user: USERS.kevin, description: "creó la oportunidad", target: "Propuesta logística Q2", timestamp: d(1, 16, 45) },
  { id: "7", type: "update", entity: "contact", user: USERS.carlos, description: "actualizó el contacto", target: "Ana Martínez", timestamp: d(1, 14, 30) },
  { id: "8", type: "export", entity: "contact", user: USERS.kevin, description: "exportó la lista de contactos", target: "contactos-abril-2025.csv", timestamp: d(1, 10, 0) },
  { id: "9", type: "create", entity: "funnel", user: USERS.maria, description: "creó el embudo", target: "Prospección Transporte", timestamp: d(1, 9, 15) },
  { id: "10", type: "create", entity: "product", user: USERS.kevin, description: "creó el producto", target: "Plan Empresarial — Anual", timestamp: d(3, 16, 0) },
  { id: "11", type: "update", entity: "workspace", user: USERS.kevin, description: "actualizó la configuración del workspace", target: "", timestamp: d(3, 11, 30) },
  { id: "12", type: "create", entity: "user", user: USERS.kevin, description: "invitó al usuario", target: "carlos.lopez@goxt.io", timestamp: d(3, 10, 0) },
  { id: "13", type: "update", entity: "funnel", user: USERS.maria, description: "renombró el embudo", target: "Pipeline de Ventas", timestamp: d(5, 15, 20) },
  { id: "14", type: "create", entity: "contact", user: USERS.carlos, description: "creó el contacto", target: "Roberto Silva", timestamp: d(5, 11, 45) },
  { id: "15", type: "delete", entity: "product", user: USERS.maria, description: "eliminó el producto", target: "Plan Básico — Prueba", timestamp: d(5, 9, 30) },
]

const ENTITY_CONFIG: Record<EntityType, { label: string; className: string }> = {
  contact: { label: "Contacto", className: "bg-blue-50 text-blue-700" },
  organization: { label: "Empresa", className: "bg-violet-50 text-violet-700" },
  opportunity: { label: "Oportunidad", className: "bg-amber-50 text-amber-700" },
  activity: { label: "Actividad", className: "bg-green-50 text-green-700" },
  funnel: { label: "Embudo", className: "bg-orange-50 text-orange-700" },
  product: { label: "Producto", className: "bg-rose-50 text-rose-700" },
  user: { label: "Usuario", className: "bg-cyan-50 text-cyan-700" },
  workspace: { label: "Workspace", className: "bg-muted text-muted-foreground" },
}


const ENTITY_FILTERS: Array<{ key: EntityType | "all"; label: string }> = [
  { key: "all", label: "Todo" },
  { key: "contact", label: "Contactos" },
  { key: "organization", label: "Empresas" },
  { key: "opportunity", label: "Oportunidades" },
  { key: "activity", label: "Actividades" },
  { key: "funnel", label: "Embudos" },
  { key: "product", label: "Productos" },
  { key: "user", label: "Usuarios" },
]

function groupByDay(events: ActivityEvent[]) {
  const groups: { label: string; key: string; events: ActivityEvent[] }[] = []
  const map = new Map<string, (typeof groups)[0]>()

  for (const event of events) {
    const key = format(event.timestamp, "yyyy-MM-dd")
    if (!map.has(key)) {
      let label: string
      if (isToday(event.timestamp)) {
        label = "Hoy"
      } else if (isYesterday(event.timestamp)) {
        label = "Ayer"
      } else {
        const raw = format(event.timestamp, "EEEE, d 'de' MMMM", { locale: es })
        label = raw.charAt(0).toUpperCase() + raw.slice(1)
      }
      const group = { label, key, events: [] }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key)!.events.push(event)
  }

  return groups
}

export function ActivityTimeline() {
  const [search, setSearch] = React.useState("")
  const [userFilter, setUserFilter] = React.useState("all")
  const [entityFilter, setEntityFilter] = React.useState<EntityType | "all">("all")

  const filtered = React.useMemo(() => {
    return MOCK_EVENTS.filter((e) => {
      if (userFilter !== "all" && e.user.name !== userFilter) return false
      if (entityFilter !== "all" && e.entity !== entityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.description.toLowerCase().includes(q) &&
          !e.target.toLowerCase().includes(q) &&
          !e.user.name.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [search, userFilter, entityFilter])

  const groups = groupByDay(filtered)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en el historial..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none"
          >
            <option value="all">Todos los usuarios</option>
            {Object.values(USERS).map((u) => (
              <option key={u.name} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1.5 overflow-x-auto">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setEntityFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
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
      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay actividad que coincida con los filtros.
        </p>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              {/* Day header */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm font-semibold">{group.label}</span>
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">{group.events.length} eventos</span>
              </div>

              {/* Timeline entries */}
              <div className="relative ml-3">
                <div className="absolute top-3 bottom-0 left-0 border-l-2" />

                {group.events.map((event) => {
                  const entity = ENTITY_CONFIG[event.entity]
                  const title =
                    event.description.charAt(0).toUpperCase() + event.description.slice(1)

                  return (
                    <div key={event.id} className="relative pb-6 pl-7 last:pb-0">
                      {/* Dot */}
                      <div className="absolute top-2.5 left-px h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />

                      {/* Content */}
                      <div className="space-y-1.5">
                        {/* User avatar + name */}
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 shrink-0 overflow-hidden rounded-full bg-accent">
                            <img
                              src={event.user.avatar}
                              alt={event.user.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium">{event.user.name}</span>
                        </div>

                        {/* Title + timestamp */}
                        <div>
                          <p className="text-sm font-medium">
                            {title}
                            {event.target && (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                {event.target}
                              </span>
                            )}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ClockIcon className="size-3.5" />
                            <span>{format(event.timestamp, "HH:mm")}</span>
                          </div>
                        </div>

                        {/* Entity badge */}
                        <div>
                          <Badge
                            className={cn("rounded-full border-0 text-xs", entity.className)}
                            variant="secondary"
                          >
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
        </div>
      )}
    </div>
  )
}
