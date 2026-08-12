"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  EyeIcon,
  KanbanSquareIcon,
  ListIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import type { VisibilityState } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/table-utils"
import { notify } from "@/lib/notify"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { KanbanBoard, KanbanColumn } from "@/components/ui/kanban"
import { SingleSelectFilter, type SingleSelectOption } from "@/components/ui/single-select-filter"
import { KanbanFacetedFilter } from "@/components/ui/faceted-filter"
import { ActivitiesTable, COLUMN_LABELS, DEFAULT_COLUMN_VISIBILITY, MOBILE_COLUMN_VISIBILITY } from "./ActivitiesTable"
import { ActivityPreviewSheet } from "./ActivityPreviewSheet"
import { CreateActivitySheet } from "./CreateActivitySheet"
import { activityService } from "@/services/activity.service"
import { flowService } from "@/services/flow.service"
import { toWorkspaceDateTimeParts } from "@/lib/activity-utils"
import { useWorkspaceTimezone } from "@/hooks/useWorkspaceTimezone"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ActivityRaw } from "@/types/activity"
import type { Flow } from "@/types/flow"

interface OppOption { id: number; name: string }

// Cuántas actividades carga cada columna al abrir el board, y cuántas trae cada
// "Cargar más" — antes un solo fetch (tope 300) alimentaba las 4 columnas juntas,
// así que en flows con muchas actividades algunas columnas podían quedar vacías
// mientras otras se llevaban todo el cupo (mismo problema que tuvo Oportunidades).
const STAGE_PAGE_SIZE = 30

interface StagePageState {
  page: number
  hasMore: boolean
  loadingMore: boolean
}

// ─── Board types ─────────────────────────────────────────────────────────────

interface BoardActivity {
  id: string
  rawId: number
  title: string
  type: string
  priority: string
  stageId: string
  startDate: string
  endDate: string
  responsible: { name: string; initials: string; avatarUrl: string | null }
  opportunityName: string
  funnelName: string
}

function mapBoardActivity(d: ActivityRaw, timezone: string): BoardActivity {
  const typeDetail = d.opportunity_activity_detail.find((det) => det.label?.key === "activity_type")
  const prioDetail = d.opportunity_activity_detail.find((det) => det.label?.key === "priority")
  return {
    id:              String(d.id),
    rawId:           d.id,
    title:           d.title ?? "Sin título",
    type:            typeDetail?.value ?? "",
    priority:        prioDetail?.value?.toLowerCase() ?? "",
    stageId:         d.status ?? (d.is_completed ? "completada" : "pendiente"),
    startDate:       d.date_from ? toWorkspaceDateTimeParts(d.date_from, timezone).date : "",
    endDate:         d.date_to   ? toWorkspaceDateTimeParts(d.date_to, timezone).date   : "",
    responsible: {
      name:      d.user?.name ?? "—",
      initials:  getInitials(d.user?.name ?? ""),
      avatarUrl: d.user?.avatar_url ?? null,
    },
    opportunityName: d.opportunity?.name ?? "",
    funnelName:      d.opportunity?.flow?.name ?? "",
  }
}

// ─── Configs ─────────────────────────────────────────────────────────────────

const BOARD_STAGES = [
  { id: "pendiente",   name: "Pendiente",   color: "bg-amber-500"   },
  { id: "en_progreso", name: "En Progreso", color: "bg-blue-500"    },
  { id: "completada",  name: "Completada",  color: "bg-emerald-500" },
  { id: "cancelada",   name: "Cancelada",   color: "bg-slate-400"   },
]

const BOARD_ACTIVITY_TYPES = [
  "Llamada", "Reunión", "Video Llamada", "Email", "Visita",
]

// Estado — solo tiene sentido en Lista: en Board las columnas YA son esta
// misma partición (pendiente/en_progreso/...), filtrar sería redundante.
const STATUS_OPTIONS: SingleSelectOption[] = [
  { value: "all", label: "Todas" },
  ...BOARD_STAGES.map((s) => ({ value: s.id, label: s.name })),
]

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  alta:  { label: "Alta",  className: "bg-red-50 text-red-700"         },
  media: { label: "Media", className: "bg-amber-50 text-amber-700"     },
  baja:  { label: "Baja",  className: "bg-emerald-50 text-emerald-700" },
}

const TYPE_CONFIG: Record<string, { className: string }> = {
  "Reunión":       { className: "bg-blue-50 text-blue-700"     },
  "Llamada":       { className: "bg-violet-50 text-violet-700" },
  "Correo":        { className: "bg-sky-50 text-sky-700"       },
  "Seguimiento":   { className: "bg-orange-50 text-orange-700" },
  "Revisión":      { className: "bg-teal-50 text-teal-700"     },
  "Planificación": { className: "bg-indigo-50 text-indigo-700" },
  "Video Llamada": { className: "bg-purple-50 text-purple-700" },
  "Visita":        { className: "bg-emerald-50 text-emerald-700" },
  "Email":         { className: "bg-sky-50 text-sky-700"       },
}

const TODAY = new Date().toISOString().slice(0, 10)

// Mismo criterio visual que Oportunidades: completada ≈ ganada, cancelada ≈ perdida.
const CARD_BORDER: Record<string, string> = {
  completada: "border-l-2 border-l-emerald-500",
  cancelada:  "border-l-2 border-l-red-400",
}

function isOverdue(activity: BoardActivity) {
  return (
    activity.stageId !== "completada" &&
    activity.stageId !== "cancelada" &&
    !!activity.endDate &&
    activity.endDate < TODAY
  )
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—"
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y.slice(2)}`
}

// ─── FlowFilter ──────────────────────────────────────────────────────────────

function FlowFilter({ flows, selected, onChange }: {
  flows: Flow[]
  selected: number | null
  onChange: (id: number | null) => void
}) {
  const selectedFlow = flows.find((f) => f.id === selected)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}>
        <PlusCircleIcon className="size-3.5" />
        Embudo
        {selected !== null && (
          <>
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto" />
            <span className="inline-block max-w-32 truncate align-middle rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {selectedFlow?.name ?? "…"}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-60 min-w-44 overflow-y-auto">
        {flows.map((flow) => (
          <DropdownMenuCheckboxItem
            key={flow.id}
            checked={selected === flow.id}
            onCheckedChange={() => onChange(selected === flow.id ? null : flow.id)}
          >
            {flow.name}
            {flow.is_default && (
              <span className="ml-auto text-[10px] text-muted-foreground">default</span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
        {selected !== null && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange(null)}
            >
              Todos los embudos
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── ActivityCard ─────────────────────────────────────────────────────────────

interface ActivityCardProps {
  activity: BoardActivity
  onMove: (stageId: string) => void
  onPreview: () => void
  onViewDetail: () => void
  isDragging?: boolean
}

const ActivityCard = React.memo(function ActivityCard({
  activity, onMove, onPreview, onViewDetail, isDragging,
}: ActivityCardProps) {
  const priority  = PRIORITY_CONFIG[activity.priority]
  const typeStyle = TYPE_CONFIG[activity.type] ?? { className: "bg-muted text-muted-foreground" }
  const overdue   = isOverdue(activity)

  const dateDisplay =
    activity.startDate === activity.endDate || !activity.startDate
      ? formatDate(activity.endDate)
      : `${formatDate(activity.startDate)} → ${formatDate(activity.endDate)}`

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2 transition-shadow select-none",
        !isDragging && "hover:shadow-sm cursor-grab active:cursor-grabbing",
        isDragging  && "cursor-grabbing shadow-lg",
        CARD_BORDER[activity.stageId],
      )}
    >
      <div className="flex items-start gap-1">
        <p className="flex-1 text-sm font-medium leading-snug">{activity.title}</p>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-6 shrink-0 -mt-0.5" />}>
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={onPreview}>
                <EyeIcon /> Vista Previa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewDetail}>
                <ArrowUpRightIcon /> Ver detalles
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mover a</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {BOARD_STAGES.filter((s) => s.id !== activity.stageId).map((stage) => (
              <DropdownMenuItem key={stage.id} onClick={() => onMove(stage.id)}>
                <span className={cn("size-2 rounded-full shrink-0", stage.color)} />
                {stage.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 items-center gap-1.5">
        <Avatar className="size-5 shrink-0">
          <AvatarImage src={activity.responsible.avatarUrl ?? "https://github.com/shadcn.png"} alt={activity.responsible.name} />
          <AvatarFallback className="text-[9px] font-semibold">{activity.responsible.initials}</AvatarFallback>
        </Avatar>
        <span className="truncate text-xs text-muted-foreground">{activity.responsible.name}</span>
      </div>

      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        {activity.type && (
          <Badge className={cn("rounded-full border-0 text-xs px-2 py-0 shrink-0", typeStyle.className)}>
            {activity.type}
          </Badge>
        )}
        {priority && (
          <Badge className={cn("rounded-full border-0 text-xs px-2 py-0 shrink-0", priority.className)}>
            {priority.label}
          </Badge>
        )}
        {overdue && (
          <Badge className="rounded-full border-0 text-xs px-2 py-0 shrink-0 bg-red-50 text-red-600">
            Atrasada
          </Badge>
        )}
      </div>

      {(activity.startDate || activity.endDate) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarIcon className="size-3 shrink-0" />
          <span>{dateDisplay}</span>
        </div>
      )}

      {(activity.opportunityName || activity.funnelName) && (
        <p className="text-xs text-muted-foreground truncate border-t pt-2">
          {[activity.funnelName, activity.opportunityName].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  )
})

// ─── SortableCard ─────────────────────────────────────────────────────────────

function SortableCard({ activity, onMove, onPreview, onViewDetail }: {
  activity: BoardActivity
  onMove: (activityId: string, stageId: string) => void
  onPreview: (activity: BoardActivity) => void
  onViewDetail: (activity: BoardActivity) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
    data: { stageId: activity.stageId },
  })

  const handleMove       = React.useCallback((stageId: string) => onMove(activity.id, stageId), [activity.id, onMove])
  const handlePreview    = React.useCallback(() => onPreview(activity), [activity, onPreview])
  const handleViewDetail = React.useCallback(() => onViewDetail(activity), [activity, onViewDetail])

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      {...attributes}
      {...listeners}
    >
      <ActivityCard activity={activity} onMove={handleMove} onPreview={handlePreview} onViewDetail={handleViewDetail} />
    </div>
  )
}

// ─── DroppableColumn ──────────────────────────────────────────────────────────

function DroppableColumn({
  stage,
  activities,
  statsActivities,
  realCount,
  hasMore,
  loadingMore,
  onLoadMore,
  onMove,
  onPreview,
  onViewDetail,
}: {
  stage: typeof BOARD_STAGES[number]
  activities: BoardActivity[]
  statsActivities: BoardActivity[]
  realCount?: number
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore: (stageId: string) => void
  onMove: (activityId: string, stageId: string) => void
  onPreview: (activity: BoardActivity) => void
  onViewDetail: (activity: BoardActivity) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const stageActivities = activities.filter((a) => a.stageId === stage.id)
  const stageIds        = stageActivities.map((a) => a.id)
  const stageStats      = statsActivities.filter((a) => a.stageId === stage.id)

  return (
    <KanbanColumn
      ref={setNodeRef}
      title={stage.name}
      count={realCount ?? stageStats.length}
      className={cn(isOver && "ring-2 ring-inset ring-primary/30 bg-primary/5")}
    >
      <SortableContext items={stageIds} strategy={verticalListSortingStrategy}>
        {stageActivities.map((activity) => (
          <SortableCard
            key={activity.id}
            activity={activity}
            onMove={onMove}
            onPreview={onPreview}
            onViewDetail={onViewDetail}
          />
        ))}
      </SortableContext>
      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          disabled={loadingMore}
          onClick={() => onLoadMore(stage.id)}
        >
          {loadingMore ? <Loader2Icon className="size-3.5 animate-spin" /> : "Cargar más"}
        </Button>
      )}
    </KanbanColumn>
  )
}

// ─── ActivityKanban ──────────────────────────────────────────────────────────

export function ActivityKanban() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { setOpen }  = useSidebar()
  const timezone     = useWorkspaceTimezone()

  const [view, setView] = React.useState<"board" | "lista">(
    () => (searchParams.get("view") as "board" | "lista") ?? "lista"
  )

  React.useEffect(() => {
    setOpen(view !== "board")
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    return () => setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function changeView(v: "board" | "lista") {
    setView(v)
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", v)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const [activities, setActivities] = React.useState<BoardActivity[]>([])
  const [loading, setLoading]       = React.useState(false)
  const [flows, setFlows]                 = React.useState<Flow[]>([])
  const [flowId, setFlowId]               = React.useState<number | null>(null)
  const [opportunityId, setOpportunityId] = React.useState<number | null>(null)
  const [activeActivity, setActiveActivity]     = React.useState<BoardActivity | null>(null)
  const [previewActivity, setPreviewActivity]   = React.useState<BoardActivity | null>(null)
  const [previewRawId, setPreviewRawId]         = React.useState<number | null>(null)
  const [sheetOpen, setSheetOpen]               = React.useState(false)

  const [search, setSearch]                       = React.useState("")
  const [status, setStatus]                       = React.useState("all")
  const [typeFilter, setTypeFilter]               = React.useState<string[]>([])
  const [priorityFilter, setPriorityFilter]       = React.useState<string[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [refreshKey, setRefreshKey]               = React.useState(0)
  const [opps, setOpps]                           = React.useState<OppOption[]>([])
  const [loadingOpps, setLoadingOpps]             = React.useState(false)
  const [columnVisibility, setColumnVisibility]   = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [listTotal, setListTotal]                 = React.useState(0)
  const [createOpen, setCreateOpen]               = React.useState(false)

  // Tiempo real: único listener, compartido — Board lo usa directo y la Lista
  // lo recibe como prop (refreshKey) para disparar su propio refetch.
  useEntityRealtime("activity", () => setRefreshKey((k) => k + 1))

  // Load flows once and auto-select default
  React.useEffect(() => {
    flowService.all()
      .then((list) => {
        setFlows(list)
        const def = list.find((f) => f.is_default)
        if (def) setFlowId(def.id)
      })
      .catch(() => {})
  }, [])

  // Reset opp selection when funnel changes
  React.useEffect(() => { setOpportunityId(null) }, [flowId])

  // Oportunidades únicas con actividades en el embudo seleccionado — para el
  // filtro "Oportunidad", compartido entre Board y Lista (no depende de la
  // vista activa, por eso es un fetch aparte del de Board).
  React.useEffect(() => {
    if (!flowId) { setOpps([]); return }
    setLoadingOpps(true)
    activityService.list({ flowId, take: 300 })
      .then((res) => {
        const seen = new Map<number, string>()
        for (const a of res.data) {
          if (a.opportunity && !seen.has(a.opportunity.id)) {
            seen.set(a.opportunity.id, a.opportunity.name)
          }
        }
        setOpps(Array.from(seen.entries()).map(([id, name]) => ({ id, name })))
      })
      .catch(() => {})
      .finally(() => setLoadingOpps(false))
  }, [flowId])

  // Fetch de actividades del board por columna (paginado) — un fetch independiente
  // por status, no uno solo para las 4 columnas juntas, así ninguna se queda vacía
  // esperando que el cupo global "le toque" en el orden del fetch.
  const [stagePages, setStagePages] = React.useState<Record<string, StagePageState>>({})

  React.useEffect(() => {
    if (view !== "board") return
    let cancelled = false
    setLoading(true)

    Promise.all(
      BOARD_STAGES.map((stage) =>
        activityService
          .list({
            status: stage.id,
            take: STAGE_PAGE_SIZE,
            page: 1,
            ...(flowId        !== null ? { flowId }        : {}),
            ...(opportunityId !== null ? { opportunityId } : {}),
          })
          .then((page) => ({ stageId: stage.id, page }))
      )
    ).then((results) => {
      if (cancelled) return
      const all: BoardActivity[] = []
      const pages: Record<string, StagePageState> = {}
      for (const { stageId, page } of results) {
        all.push(...page.data.map((a) => mapBoardActivity(a, timezone)))
        pages[stageId] = { page: 1, hasMore: page.nextPage !== null, loadingMore: false }
      }
      setActivities(all)
      setStagePages(pages)
    }).catch(() => {
      if (!cancelled) { setActivities([]); setStagePages({}) }
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [view, flowId, opportunityId, timezone, refreshKey])

  function loadMoreForStage(stageId: string) {
    const current = stagePages[stageId]
    if (!current || !current.hasMore || current.loadingMore) return
    const nextPage = current.page + 1

    setStagePages((prev) => ({ ...prev, [stageId]: { ...prev[stageId], loadingMore: true } }))

    activityService
      .list({
        status: stageId,
        take: STAGE_PAGE_SIZE,
        page: nextPage,
        ...(flowId        !== null ? { flowId }        : {}),
        ...(opportunityId !== null ? { opportunityId } : {}),
      })
      .then((page) => {
        setActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id))
          const fresh = page.data.map((a) => mapBoardActivity(a, timezone)).filter((a) => !existingIds.has(a.id))
          return [...prev, ...fresh]
        })
        setStagePages((prev) => ({
          ...prev,
          [stageId]: { page: nextPage, hasMore: page.nextPage !== null, loadingMore: false },
        }))
      })
      .catch(() => {
        setStagePages((prev) => ({ ...prev, [stageId]: { ...prev[stageId], loadingMore: false } }))
      })
  }

  // Conteo real por status (groupBy liviano en el backend) — independiente de lo
  // cargado, para que el número de cada columna sea correcto aunque no se hayan
  // traído todavía todas las actividades de esa columna.
  const [stageCounts, setStageCounts]           = React.useState<Record<string, number>>({})
  const [realOverdueCount, setRealOverdueCount] = React.useState(0)
  React.useEffect(() => {
    if (view !== "board") return
    let cancelled = false
    activityService
      .getStatusCounts(flowId ?? undefined, opportunityId ?? undefined)
      .then(({ counts, overdue }) => {
        if (cancelled) return
        setStageCounts(Object.fromEntries(counts.map((c) => [c.status, c.count])))
        setRealOverdueCount(overdue)
      })
      .catch(() => { if (!cancelled) { setStageCounts({}); setRealOverdueCount(0) } })
    return () => { cancelled = true }
  }, [view, flowId, opportunityId, refreshKey])

  const handlePreview = React.useCallback((activity: BoardActivity) => {
    setPreviewActivity(activity)
    setPreviewRawId(activity.rawId)
    setSheetOpen(true)
  }, [])

  const handleViewDetail = React.useCallback((activity: BoardActivity) => {
    router.push(`/crm/activities/${activity.rawId}?from=board`)
  }, [router])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const responsibleOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return activities.filter((a) => {
      if (seen.has(a.responsible.initials)) return false
      seen.add(a.responsible.initials)
      return true
    }).map((a) => ({ value: a.responsible.initials, label: a.responsible.name }))
  }, [activities])

  const filtered = React.useMemo(() => {
    return activities.filter((a) => {
      if (typeFilter.length        > 0 && !typeFilter.includes(a.type))                             return false
      if (priorityFilter.length    > 0 && !priorityFilter.includes(a.priority))                     return false
      if (responsibleFilter.length > 0 && !responsibleFilter.includes(a.responsible.initials))      return false
      if (search) {
        if (!a.title.toLowerCase().includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [activities, search, typeFilter, priorityFilter, responsibleFilter])

  // opportunityId no cuenta acá — ya se lo pasamos al endpoint de conteo real, así
  // que el número de columna sigue siendo exacto con ese filtro activo. Solo los
  // filtros que el backend no ve (tipo/prioridad/responsable/búsqueda) invalidan
  // el conteo real y hacen caer al conteo local (lo cargado hasta el momento).
  const hasClientOnlyFilters = typeFilter.length > 0 || priorityFilter.length > 0 || responsibleFilter.length > 0 || !!search

  // Mirror activities state in a ref so drag handlers always read the latest value
  const activitiesRef   = React.useRef<BoardActivity[]>([])
  React.useEffect(() => { activitiesRef.current = activities }, [activities])

  // Capture drag-start info so handleDragEnd can detect cross-column moves
  const preDragInfoRef  = React.useRef<{ id: string; rawId: number; stageId: string } | null>(null)
  const predragFilteredRef = React.useRef(filtered)
  const statsActivities    = activeActivity ? predragFilteredRef.current : filtered
  const overdueCount       = filtered.filter(isOverdue).length

  // Mismo criterio que el conteo por columna: el total/atrasadas real del backend
  // solo vale si no hay filtros que el backend no ve — si no, cae a lo cargado.
  const realTotalCount = Object.values(stageCounts).reduce((sum, n) => sum + n, 0)
  const displayTotal   = hasClientOnlyFilters ? filtered.length : realTotalCount
  const displayOverdue = hasClientOnlyFilters ? overdueCount    : realOverdueCount

  const moveActivity = React.useCallback((activityId: string, targetStageId: string) => {
    const activity = activities.find((a) => a.id === activityId)
    if (!activity || activity.stageId === targetStageId) return

    const originalStageId = activity.stageId
    const stageName = BOARD_STAGES.find((s) => s.id === targetStageId)?.name ?? targetStageId
    setActivities((prev) =>
      prev.map((a) => a.id === activityId ? { ...a, stageId: targetStageId } : a)
    )
    // Contador optimista — si no, queda desactualizado hasta el próximo refresh
    // (el conteo real del backend no se refresca en cada drag).
    setStageCounts((prev) => ({
      ...prev,
      [originalStageId]: Math.max(0, (prev[originalStageId] ?? 0) - 1),
      [targetStageId]:   (prev[targetStageId] ?? 0) + 1,
    }))
    notify.success({ title: `Actividad movida a ${stageName}`, description: "El estado se actualizó correctamente." })

    activityService.updateStatus(activity.rawId, targetStageId)
      .catch(() => {
        setActivities((prev) =>
          prev.map((a) => a.id === activityId ? { ...a, stageId: activity.stageId } : a)
        )
        setStageCounts((prev) => ({
          ...prev,
          [originalStageId]: (prev[originalStageId] ?? 0) + 1,
          [targetStageId]:   Math.max(0, (prev[targetStageId] ?? 0) - 1),
        }))
        notify.error({ title: "No se pudo mover la actividad", description: "Intenta de nuevo o recarga la página." })
      })
  }, [activities])

  function handleDragStart({ active }: DragStartEvent) {
    predragFilteredRef.current = filtered
    const found = activitiesRef.current.find((a) => a.id === active.id) ?? null
    preDragInfoRef.current = found ? { id: found.id, rawId: found.rawId, stageId: found.stageId } : null
    setActiveActivity(found)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return
    const activeId = active.id as string
    const overId   = over.id  as string

    setActivities((prev) => {
      const activeIndex = prev.findIndex((a) => a.id === activeId)
      if (activeIndex === -1) return prev
      const activeItem  = prev[activeIndex]
      const isOverStage = BOARD_STAGES.some((s) => s.id === overId)
      const overItem    = prev.find((a) => a.id === overId)
      const overStageId = isOverStage ? overId : overItem?.stageId
      if (!overStageId || activeItem.stageId === overStageId) return prev
      const updated  = prev.map((a) => a.id === activeId ? { ...a, stageId: overStageId } : a)
      const overIndex = isOverStage
        ? updated.findLastIndex((a) => a.stageId === overStageId)
        : updated.findIndex((a) => a.id === overId)
      return arrayMove(updated, updated.findIndex((a) => a.id === activeId), overIndex)
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const dragInfo = preDragInfoRef.current
    preDragInfoRef.current = null
    setActiveActivity(null)
    if (!over || !dragInfo) return

    const activeId        = active.id as string
    const overId          = over.id  as string
    const isOverStage     = BOARD_STAGES.some((s) => s.id === overId)
    const currentStageId  = activitiesRef.current.find((a) => a.id === activeId)?.stageId ?? null

    // Reorder within same column (cosmetic only)
    if (!isOverStage && active.id !== over.id) {
      setActivities((prev) => {
        const activeIndex = prev.findIndex((a) => a.id === activeId)
        const overIndex   = prev.findIndex((a) => a.id === overId)
        if (activeIndex === -1 || overIndex === -1) return prev
        if (prev[activeIndex].stageId === prev[overIndex].stageId) {
          return arrayMove(prev, activeIndex, overIndex)
        }
        return prev
      })
    }

    // Fire API if card crossed into a different stage
    if (currentStageId && currentStageId !== dragInfo.stageId) {
      const stageName = BOARD_STAGES.find((s) => s.id === currentStageId)?.name ?? currentStageId
      setStageCounts((prev) => ({
        ...prev,
        [dragInfo.stageId]: Math.max(0, (prev[dragInfo.stageId] ?? 0) - 1),
        [currentStageId]:   (prev[currentStageId] ?? 0) + 1,
      }))
      notify.success({ title: `Actividad movida a ${stageName}`, description: "El estado se actualizó correctamente." })
      activityService.updateStatus(dragInfo.rawId, currentStageId)
        .catch(() => {
          setActivities((prev) =>
            prev.map((a) => a.id === activeId ? { ...a, stageId: dragInfo.stageId } : a)
          )
          setStageCounts((prev) => ({
            ...prev,
            [dragInfo.stageId]: (prev[dragInfo.stageId] ?? 0) + 1,
            [currentStageId]:   Math.max(0, (prev[currentStageId] ?? 0) - 1),
          }))
          notify.error({ title: "No se pudo mover la actividad", description: "Intenta de nuevo o recarga la página." })
        })
    }
  }

  // Restablecer limpia lo relevante a la vista activa — search/Embudo/Oportunidad
  // son compartidos, pero cada vista decide qué tan a fondo resetea (igual
  // criterio que Funnels: Board no toca el Embudo seleccionado, Lista sí).
  const hasActiveFilters = view === "board"
    ? (typeFilter.length > 0 || priorityFilter.length > 0 || responsibleFilter.length > 0 || !!search || !!opportunityId)
    : (!!search || status !== "all" || !!flowId || !!opportunityId)

  function resetFilters() {
    setSearch("")
    setOpportunityId(null)
    if (view === "board") {
      setTypeFilter([])
      setPriorityFilter([])
      setResponsibleFilter([])
    } else {
      setStatus("all")
      setFlowId(null)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Row 1 — view toggle */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => changeView("lista")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              view === "lista" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ListIcon className="size-3.5" />
            Lista
          </button>
          <button
            type="button"
            onClick={() => changeView("board")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              view === "board" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <KanbanSquareIcon className="size-3.5" />
            Board
          </button>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Crear Actividad</Button>
      </div>

      {/* Row 2 — filters (compartida entre Lista y Board). En mobile se apila en
          filas propias en vez de forzar scroll horizontal; desde md queda igual. */}
      <div className="flex shrink-0 flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar actividad..."
              className="h-8 pl-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grid de 2 columnas — "Restablecer" es un ítem más del grid (no fila propia),
              así que cuando el número de filtros sale impar, se empareja con él en vez
              de quedar solo. Si no hay filtro activo, Restablecer no se muestra, pero en
              ese caso el número de filtros base (Embudo+Estado, o los 4 de Board) es par. */}
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <FlowFilter flows={flows} selected={flowId} onChange={setFlowId} />
            </div>

            {flowId !== null && (loadingOpps || opps.length > 0) && (
              <>
                <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />
                <div className="[&_button]:w-full md:[&_button]:w-auto">
                  <KanbanFacetedFilter
                    title="Oportunidad"
                    options={opps.map((o) => ({ value: String(o.id), label: o.name }))}
                    selected={opportunityId !== null ? [String(opportunityId)] : []}
                    onChange={(vals) => setOpportunityId(vals.length > 0 ? Number(vals[0]) : null)}
                    single
                  />
                </div>
              </>
            )}

            {view === "lista" && (
              <>
                <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />
                <div className="[&_button]:w-full md:[&_button]:w-auto">
                  <SingleSelectFilter
                    title="Estado"
                    options={STATUS_OPTIONS}
                    selected={status}
                    onChange={setStatus}
                  />
                </div>
              </>
            )}

            {view === "board" && (
              <>
                <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />
                <div className="[&_button]:w-full md:[&_button]:w-auto">
                  <KanbanFacetedFilter
                    title="Tipo"
                    options={BOARD_ACTIVITY_TYPES.map((t) => ({ value: t, label: t }))}
                    selected={typeFilter}
                    onChange={setTypeFilter}
                  />
                </div>
                <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />
                <div className="[&_button]:w-full md:[&_button]:w-auto">
                  <KanbanFacetedFilter
                    title="Prioridad"
                    options={[
                      { value: "alta",  label: "Alta"  },
                      { value: "media", label: "Media" },
                      { value: "baja",  label: "Baja"  },
                    ]}
                    selected={priorityFilter}
                    onChange={setPriorityFilter}
                  />
                </div>
                <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />
                <div className="[&_button]:w-full md:[&_button]:w-auto">
                  <KanbanFacetedFilter
                    title="Responsable"
                    options={responsibleOptions}
                    selected={responsibleFilter}
                    onChange={setResponsibleFilter}
                  />
                </div>
              </>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 px-2 text-xs md:w-auto"
                onClick={resetFilters}
              >
                <XIcon className="size-3.5" />
                Restablecer
              </Button>
            )}
          </div>
        </div>

        {view === "lista" && (
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
            <span className="w-full text-xs text-muted-foreground md:w-auto">{listTotal} actividades</span>
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
                  Columnas <ChevronDownIcon className="ml-1.5 size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(COLUMN_LABELS).map(([id, label]) => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={columnVisibility[id] !== false}
                      onCheckedChange={(v) => setColumnVisibility((prev) => ({ ...prev, [id]: !!v }))}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {view === "board" && (
          <span className="md:ml-auto shrink-0 text-xs text-muted-foreground">
            {loading ? "Cargando…" : `${displayTotal} actividades`}
            {!loading && displayOverdue > 0 && (
              <span className="text-amber-600">
                {" · "}{displayOverdue} atrasada{displayOverdue > 1 ? "s" : ""}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Board */}
      {view === "board" && (
        <DndContext
          id="activity-kanban"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveActivity(null)}
        >
          <KanbanBoard>
            {BOARD_STAGES.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                activities={filtered}
                statsActivities={statsActivities}
                realCount={hasClientOnlyFilters ? undefined : stageCounts[stage.id]}
                hasMore={stagePages[stage.id]?.hasMore}
                loadingMore={stagePages[stage.id]?.loadingMore}
                onLoadMore={loadMoreForStage}
                onMove={moveActivity}
                onPreview={handlePreview}
                onViewDetail={handleViewDetail}
              />
            ))}
          </KanbanBoard>

          <DragOverlay dropAnimation={{ duration: 160, easing: "ease" }}>
            {activeActivity && (
              <ActivityCard
                activity={activeActivity}
                onMove={() => {}}
                onPreview={() => {}}
                onViewDetail={() => {}}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* List */}
      {view === "lista" && (
        <ActivitiesTable
          search={search}
          status={status === "all" ? null : status}
          flowId={flowId}
          opportunityId={opportunityId}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onTotalChange={setListTotal}
          refreshKey={refreshKey}
        />
      )}

      <ActivityPreviewSheet
        activity={previewActivity as any}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onViewDetail={previewRawId ? () => { setSheetOpen(false); router.push(`/crm/activities/${previewRawId}?from=board`) } : undefined}
      />

      <CreateActivitySheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
