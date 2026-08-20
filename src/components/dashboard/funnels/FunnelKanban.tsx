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
  ActivityIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  Columns3Icon,
  EyeIcon,
  FileTextIcon,
  KanbanSquareIcon,
  ListIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  SparklesIcon,
  PlusCircleIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  TrophyIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSidebar } from "@/components/ui/sidebar"
import { SingleSelectFilter, type SingleSelectOption } from "@/components/ui/single-select-filter"
import { KanbanFacetedFilter } from "@/components/ui/faceted-filter"
import { FunnelTable, COLUMN_LABELS, DEFAULT_COLUMN_VISIBILITY, MOBILE_COLUMN_VISIBILITY, mapOpportunity, type Opportunity } from "./FunnelTable"
import { SuggestionsView } from "./suggestions/SuggestionsView"
import type { VisibilityState } from "@tanstack/react-table"
import { FunnelPreviewSheet } from "./FunnelPreviewSheet"
import { CreateOpportunitySheet } from "./CreateOpportunitySheet"
import { flowService } from "@/services/flow.service"
import { opportunityService } from "@/services/opportunity.service"
import { notify, opportunityNotify } from "@/lib/notify"
import { opportunityConfirm } from "@/lib/confirm"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Flow, FlowStage } from "@/types/flow"

// ─── Configs ─────────────────────────────────────────────────────────────────

// Cuántas oportunidades carga cada columna al abrir el board, y cuántas trae cada
// "Cargar más" — antes un solo fetch de todo el flow (tope 500) alimentaba todas
// las columnas juntas, así que en flows grandes (Prohabla, 500+) algunas columnas
// podían quedar vacías mientras otras se llevaban todo el cupo.
const STAGE_PAGE_SIZE = 30

type OppStatus = "en_progreso" | "ganada" | "perdida" | "reabierta"

interface StagePageState {
  page: number
  hasMore: boolean
  loadingMore: boolean
}

const STATUS_CONFIG: Record<OppStatus, { label: string; className: string; border: string }> = {
  en_progreso: { label: "En Progreso", className: "bg-blue-50 text-blue-700",       border: ""                                },
  ganada:      { label: "Ganada",      className: "bg-emerald-50 text-emerald-700", border: "border-l-2 border-l-emerald-500" },
  perdida:     { label: "Perdida",     className: "bg-red-50 text-red-700",         border: "border-l-2 border-l-red-400"    },
  reabierta:   { label: "Reabierta",   className: "bg-amber-50 text-amber-700",     border: "border-l-2 border-l-amber-400"  },
}

type FunnelView = "board" | "lista" | "sugerencias"

const VIEW_OPTIONS: { value: FunnelView; label: string; icon: React.ElementType }[] = [
  { value: "lista",       label: "Lista",       icon: ListIcon         },
  { value: "board",       label: "Board",       icon: KanbanSquareIcon },
  { value: "sugerencias", label: "Sugerencias", icon: SparklesIcon     },
]

const STATUS_FILTERS: { key: OppStatus | "all"; label: string }[] = [
  { key: "all",         label: "Todas"       },
  { key: "en_progreso", label: "En Progreso" },
  { key: "ganada",      label: "Ganadas"     },
  { key: "perdida",     label: "Perdidas"    },
  { key: "reabierta",   label: "Reabiertas"  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTotal(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString("es-CL")}`
}

function stageDropId(stageId: number) {
  return `stage-${stageId}`
}

function isStageId(id: string | number): boolean {
  return typeof id === "string" && id.startsWith("stage-")
}

function parseStageId(id: string | number): number {
  return parseInt((id as string).replace("stage-", ""), 10)
}

// ─── OppCard ─────────────────────────────────────────────────────────────────

interface OppCardProps {
  opp: Opportunity
  stages: FlowStage[]
  onMove: (stageId: number) => void
  onPreview: () => void
  onViewDetail: () => void
  onEdit: () => void
  onDelete: () => void
  onWon: () => void
  onLost: () => void
  onReopen: () => void
  isDragging?: boolean
}

const OppCard = React.memo(function OppCard({
  opp,
  stages,
  onMove,
  onPreview,
  onViewDetail,
  onEdit,
  onDelete,
  onWon,
  onLost,
  onReopen,
  isDragging,
}: OppCardProps) {
  const statusCfg = STATUS_CONFIG[opp.status as OppStatus] ?? STATUS_CONFIG.en_progreso

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2 transition-shadow select-none",
        !isDragging && "hover:shadow-sm cursor-grab active:cursor-grabbing",
        isDragging  && "cursor-grabbing shadow-lg",
        statusCfg.border,
      )}
    >
      <div className="flex items-start gap-1">
        <p className="flex-1 text-sm font-medium leading-snug">{opp.name}</p>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-6 shrink-0 -mt-0.5" />}
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={onPreview}>
                <EyeIcon />
                Vista Previa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewDetail}>
                <ArrowUpRightIcon />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon />
                Editar
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {(opp.status === "en_progreso" || opp.status === "reabierta") && (
                <>
                  <DropdownMenuItem onClick={onWon} className="text-emerald-600 focus:text-emerald-600">
                    <TrophyIcon />
                    Ganada
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLost} className="text-red-500 focus:text-red-500">
                    <XCircleIcon />
                    Perdida
                  </DropdownMenuItem>
                </>
              )}
              {(opp.status === "ganada" || opp.status === "perdida") && (
                <DropdownMenuItem onClick={onReopen}>
                  <RotateCcwIcon />
                  Reabrir
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mover a</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {stages
              .filter((s) => s.id !== opp.stageId)
              .map((stage) => (
                <DropdownMenuItem key={stage.id} onClick={() => onMove(stage.id)}>
                  {stage.name}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 items-center gap-1.5">
        <Avatar className="size-5 shrink-0">
          <AvatarImage src={opp.responsible.avatarUrl ?? "https://github.com/shadcn.png"} alt={opp.responsible.name} />
          <AvatarFallback className="text-[9px] font-semibold">{opp.responsible.initials}</AvatarFallback>
        </Avatar>
        <span className="truncate text-xs text-muted-foreground">{opp.responsible.name}</span>
      </div>

      <p className="text-xs text-muted-foreground truncate">
        {[opp.company, opp.contact].filter(Boolean).join(" · ")}
      </p>

      <div className="flex items-center gap-1.5 min-w-0">
        <Badge className={cn("rounded-full border-0 text-xs px-2 py-0 shrink-0", statusCfg.className)}>
          {statusCfg.label}
        </Badge>
        {opp.closeDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <CalendarIcon className="size-3 shrink-0" />
            {opp.closeDate}
          </span>
        )}
        {opp.value > 0 && (
          <span className="ml-auto shrink-0 text-xs font-semibold text-primary">
            {opp.currency}{opp.value.toLocaleString("es-CL")}
          </span>
        )}
      </div>

      {/* stopPropagation prevents drag from firing on button clicks */}
      <div
        className="flex items-center justify-center gap-2 border-t pt-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FileTextIcon className="size-3.5 shrink-0" />
          {opp.quotationCount > 0 ? `Cotización (${opp.quotationCount})` : "Cotización"}
        </button>
        <button
          type="button"
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ActivityIcon className="size-3.5 shrink-0" />
          {opp.activityCount > 0 ? `Actividad (${opp.activityCount})` : "Actividad"}
        </button>
      </div>
    </div>
  )
})

// ─── SortableCard ─────────────────────────────────────────────────────────────

function SortableCard({
  opp,
  stages,
  onMove,
  onPreview,
  onViewDetail,
  onEdit,
  onDelete,
  onWon,
  onLost,
  onReopen,
}: {
  opp: Opportunity
  stages: FlowStage[]
  onMove: (oppId: number, stageId: number) => void
  onPreview: (opp: Opportunity) => void
  onViewDetail: (opp: Opportunity) => void
  onEdit: (opp: Opportunity) => void
  onDelete: (opp: Opportunity) => void
  onWon: (opp: Opportunity) => void
  onLost: (opp: Opportunity) => void
  onReopen: (opp: Opportunity) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opp.id,
    data: { stageId: opp.stageId },
  })

  const handleMove       = React.useCallback((stageId: number) => onMove(opp.id, stageId), [opp.id, onMove])
  const handlePreview    = React.useCallback(() => onPreview(opp), [opp, onPreview])
  const handleViewDetail = React.useCallback(() => onViewDetail(opp), [opp, onViewDetail])
  const handleEdit       = React.useCallback(() => onEdit(opp), [opp, onEdit])
  const handleDelete     = React.useCallback(() => onDelete(opp), [opp, onDelete])
  const handleWon        = React.useCallback(() => onWon(opp), [opp, onWon])
  const handleLost       = React.useCallback(() => onLost(opp), [opp, onLost])
  const handleReopen     = React.useCallback(() => onReopen(opp), [opp, onReopen])

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <OppCard
        opp={opp}
        stages={stages}
        onMove={handleMove}
        onPreview={handlePreview}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onWon={handleWon}
        onLost={handleLost}
        onReopen={handleReopen}
      />
    </div>
  )
}

// ─── DroppableColumn ──────────────────────────────────────────────────────────

interface DroppableColumnProps {
  stage: FlowStage
  opps: Opportunity[]
  statsOpps: Opportunity[]
  realCount?: number
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore: (stageId: number) => void
  stages: FlowStage[]
  onMove: (oppId: number, stageId: number) => void
  onPreview: (opp: Opportunity) => void
  onViewDetail: (opp: Opportunity) => void
  onEdit: (opp: Opportunity) => void
  onDelete: (opp: Opportunity) => void
  onWon: (opp: Opportunity) => void
  onLost: (opp: Opportunity) => void
  onReopen: (opp: Opportunity) => void
}

function DroppableColumn({
  stage,
  opps,
  statsOpps,
  realCount,
  hasMore,
  loadingMore,
  onLoadMore,
  stages,
  onMove,
  onPreview,
  onViewDetail,
  onEdit,
  onDelete,
  onWon,
  onLost,
  onReopen,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stageDropId(stage.id) })

  const stageOpps  = opps.filter((o) => o.stageId === stage.id)
  const oppIds     = stageOpps.map((o) => o.id)
  const stageStats = statsOpps.filter((o) => o.stageId === stage.id)
  const stageTotal = stageStats.reduce((sum, o) => sum + o.value, 0)

  return (
    <KanbanColumn
      ref={setNodeRef}
      title={stage.name}
      count={realCount ?? stageStats.length}
      subtitle={stageTotal > 0 ? formatTotal(stageTotal) : undefined}
      className={cn(isOver && "ring-2 ring-inset ring-primary/30 bg-primary/5")}
    >
      <SortableContext items={oppIds} strategy={verticalListSortingStrategy}>
        {stageOpps.map((opp) => (
          <SortableCard
            key={opp.id}
            opp={opp}
            stages={stages}
            onMove={onMove}
            onPreview={onPreview}
            onViewDetail={onViewDetail}
            onEdit={onEdit}
            onDelete={onDelete}
            onWon={onWon}
            onLost={onLost}
            onReopen={onReopen}
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

// ─── FunnelKanban ─────────────────────────────────────────────────────────────

export function FunnelKanban() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { setOpen }  = useSidebar()

  const [view, setView] = React.useState<FunnelView>(
    () => (searchParams.get("view") as FunnelView) ?? "lista"
  )

  // Board y Sugerencias necesitan todo el ancho disponible — solo Lista deja el
  // sidebar abierto.
  React.useEffect(() => {
    setOpen(view === "lista")
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    return () => setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function changeView(v: FunnelView) {
    setView(v)
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", v)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // ── Shared state ────────────────────────────────────────────────────────────
  const [search, setSearch]                     = React.useState("")
  const [flowId, setFlowId]                     = React.useState<number | null>(null)
  const [flows, setFlows]                       = React.useState<Flow[]>([])
  const [statusFilter, setStatusFilter]         = React.useState<OppStatus | "all">("all")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [oppTotal, setOppTotal]                 = React.useState(0)
  const [filtersOpen, setFiltersOpen]           = React.useState(false)
  const [columnsOpen, setColumnsOpen]           = React.useState(false)

  // ── Board state ─────────────────────────────────────────────────────────────
  const [kanbanOpps, setKanbanOpps]         = React.useState<Opportunity[]>([])
  const [stagePages, setStagePages]         = React.useState<Record<number, StagePageState>>({})
  const [activeOpp, setActiveOpp]           = React.useState<Opportunity | null>(null)
  const [previewOpp, setPreviewOpp]         = React.useState<Opportunity | null>(null)
  const [sheetOpen, setSheetOpen]           = React.useState(false)
  const [createOpen, setCreateOpen]         = React.useState(false)
  const [editOppId, setEditOppId]           = React.useState<number | null>(null)
  const [refreshKey, setRefreshKey]         = React.useState(0)
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])

  // Tiempo real: si otra sesión crea/edita/elimina/mueve una oportunidad en este
  // workspace, refresca tanto el Board como la Lista — ambos comparten el mismo
  // refreshKey (Board lo usa directo, Lista lo recibe como prop y lo mete en su
  // propio fetch). Cubre also won/lost/reOpen, que el backend emite como "updated".
  useEntityRealtime("opportunity", () => setRefreshKey((k) => k + 1))

  // ── Derived stages from selected flow ────────────────────────────────────────
  const stages = React.useMemo(() => {
    const flow = flows.find((f) => f.id === flowId)
    return (flow?.flow_stage ?? []).slice().sort((a, b) => a.order_number - b.order_number)
  }, [flows, flowId])

  // ── Fetch flows + auto-select default ────────────────────────────────────────
  React.useEffect(() => {
    flowService.all().then((list) => {
      setFlows(list)
      const def = list.find((f) => f.is_default)
      if (def) setFlowId(def.id)
    }).catch(() => {})
  }, [])

  // ── Fetch kanban opportunities por etapa (paginado) cuando cambia flowId/refreshKey ──
  // Un fetch independiente por columna, no uno solo para todo el flow — así ninguna
  // etapa queda vacía esperando que el cupo global "le toque" en el orden del fetch.
  React.useEffect(() => {
    if (flowId === null || stages.length === 0) return
    let cancelled = false

    Promise.all(
      stages.map((stage) =>
        opportunityService
          .list({ flow_id: flowId, flow_stage_id: stage.id, take: STAGE_PAGE_SIZE, page: 1 })
          .then((page) => ({ stageId: stage.id, page }))
      )
    ).then((results) => {
      if (cancelled) return
      const allOpps: Opportunity[] = []
      const pages: Record<number, StagePageState> = {}
      for (const { stageId, page } of results) {
        allOpps.push(...page.data.map(mapOpportunity))
        pages[stageId] = { page: 1, hasMore: page.nextPage !== null, loadingMore: false }
      }
      setKanbanOpps(allOpps)
      setStagePages(pages)
    }).catch(() => {
      if (!cancelled) { setKanbanOpps([]); setStagePages({}) }
    })

    return () => { cancelled = true }
  }, [flowId, refreshKey, stages])

  function loadMoreForStage(stageId: number) {
    if (flowId === null) return
    const current = stagePages[stageId]
    if (!current || !current.hasMore || current.loadingMore) return
    const nextPage = current.page + 1

    setStagePages((prev) => ({ ...prev, [stageId]: { ...prev[stageId], loadingMore: true } }))

    opportunityService
      .list({ flow_id: flowId, flow_stage_id: stageId, take: STAGE_PAGE_SIZE, page: nextPage })
      .then((page) => {
        setKanbanOpps((prev) => {
          const existingIds = new Set(prev.map((o) => o.id))
          const fresh = page.data.map(mapOpportunity).filter((o) => !existingIds.has(o.id))
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

  // Conteo real por etapa — independiente del tope de 500 de arriba, para que el
  // número de cada columna sea siempre correcto aunque el flow tenga muchas más
  // oportunidades de las que se llegan a cargar (ej. Prohabla, 500+).
  const [stageCounts, setStageCounts] = React.useState<Record<number, number>>({})
  React.useEffect(() => {
    if (flowId === null) return
    let cancelled = false
    opportunityService
      .getStageCounts(flowId)
      .then((counts) => {
        if (cancelled) return
        setStageCounts(Object.fromEntries(counts.map((c) => [c.stage_id, c.count])))
      })
      .catch(() => { if (!cancelled) setStageCounts({}) })
    return () => { cancelled = true }
  }, [flowId, refreshKey])

  // ── Filter options ───────────────────────────────────────────────────────────
  const flowOptions = React.useMemo<SingleSelectOption[]>(() => [
    { value: "all", label: "Todas" },
    ...flows.map((f) => ({
      value: String(f.id),
      label: f.name,
      meta: f.is_default
        ? <span className="ml-auto text-[10px] text-muted-foreground">default</span>
        : undefined,
    })),
  ], [flows])

  const statusOptions = React.useMemo<SingleSelectOption[]>(
    () => STATUS_FILTERS.map((f) => ({ value: f.key, label: f.label })),
    [],
  )

  // ── Responsible options from real data ───────────────────────────────────────
  const responsibleOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return kanbanOpps
      .filter((o) => {
        if (seen.has(o.responsible.name)) return false
        seen.add(o.responsible.name)
        return true
      })
      .map((o) => ({ value: o.responsible.name, label: o.responsible.name }))
  }, [kanbanOpps])

  // Con un filtro activo, el número de columna debe reflejar lo filtrado (lo que
  // ya hacía antes) — el conteo real de backend solo aplica a la vista sin filtrar.
  // Ojo: no incluye flowId a propósito — cambiar de Pipeline ya recarga los datos
  // del board desde el backend (no es un filtro client-side como los demás), así
  // que el conteo real por etapa sigue siendo válido aunque haya un Pipeline elegido.
  const hasActiveFilters = !!search || statusFilter !== "all" || responsibleFilter.length > 0

  // Para el botón "Restablecer" del toolbar sí cuenta el Pipeline — acá el usuario
  // quiere limpiar todo lo que haya tocado, a diferencia del caso de arriba.
  const hasFilterActive = hasActiveFilters || !!flowId

  function resetFilters() {
    setSearch("")
    setFlowId(null)
    setStatusFilter("all")
    setResponsibleFilter([])
  }

  // ── Board filtering ──────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return kanbanOpps.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false
      if (responsibleFilter.length > 0 && !responsibleFilter.includes(o.responsible.name)) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !o.name.toLowerCase().includes(q) &&
          !o.company.toLowerCase().includes(q) &&
          !o.contact.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [kanbanOpps, search, statusFilter, responsibleFilter])

  // Snapshot on drag start so column stats don't jump at 60fps during drag
  const predragFilteredRef = React.useRef(filtered)
  const statsOpps = activeOpp ? predragFilteredRef.current : filtered

  const totalValue = filtered.reduce((sum, o) => sum + o.value, 0)

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), [])

  const handlePreview    = React.useCallback((opp: Opportunity) => { setPreviewOpp(opp); setSheetOpen(true) }, [])
  const handleViewDetail = React.useCallback((opp: Opportunity) => { router.push(`/crm/funnels/${opp.id}`) }, [router])
  const handleEdit       = React.useCallback((opp: Opportunity) => { setEditOppId(opp.id) }, [])

  const handleDelete = React.useCallback(async (opp: Opportunity) => {
    const confirmed = await opportunityConfirm.delete(opp.name)
    if (!confirmed) return

    // Optimistic: remove from UI immediately — no wait for API
    setKanbanOpps((prev) => prev.filter((o) => o.id !== opp.id))
    opportunityNotify.deleted(opp.name)

    // FunnelTable (vista Lista) tiene su propia data interna, ajena a kanbanOpps —
    // necesita el refetch (via refreshKey) tanto en éxito como en error para reflejar
    // el borrado; el Board ya se actualizó optimista arriba.
    opportunityService.delete(opp.id)
      .catch(() => opportunityNotify.error())
      .finally(refresh)
  }, [refresh])

  // Ref to always read current opps without stale closures in callbacks
  const kanbanOppsRef = React.useRef<Opportunity[]>([])
  React.useEffect(() => { kanbanOppsRef.current = kanbanOpps }, [kanbanOpps])

  const stagesRef = React.useRef<FlowStage[]>([])
  React.useEffect(() => { stagesRef.current = stages }, [stages])

  // Stage captured at drag-start so handleDragEnd can detect cross-column moves
  const preDragStageRef = React.useRef<number | null>(null)

  const handleMoveStage = React.useCallback((oppId: number, targetStageId: number) => {
    const originalStageId = kanbanOppsRef.current.find((o) => o.id === oppId)?.stageId ?? null
    if (originalStageId === targetStageId) return

    const prevStage = stagesRef.current.find((s) => s.id === originalStageId)?.name
    const nextStage = stagesRef.current.find((s) => s.id === targetStageId)?.name

    setKanbanOpps((prev) => prev.map((o) => o.id === oppId ? { ...o, stageId: targetStageId } : o))
    // Contador optimista — si no, queda desactualizado hasta el próximo refresh
    // (el conteo real del backend no se refresca en cada drag).
    if (originalStageId !== null) {
      setStageCounts((prev) => ({
        ...prev,
        [originalStageId]: Math.max(0, (prev[originalStageId] ?? 0) - 1),
        [targetStageId]: (prev[targetStageId] ?? 0) + 1,
      }))
    }
    if (nextStage) notify.success({ title: `Oportunidad movida a ${nextStage}`, description: "El pipeline se actualizó correctamente." })

    opportunityService.moveStage(oppId, targetStageId, prevStage, nextStage)
      .catch(() => {
        setKanbanOpps((prev) => prev.map((o) => o.id === oppId ? { ...o, stageId: originalStageId } : o))
        if (originalStageId !== null) {
          setStageCounts((prev) => ({
            ...prev,
            [originalStageId]: (prev[originalStageId] ?? 0) + 1,
            [targetStageId]: Math.max(0, (prev[targetStageId] ?? 0) - 1),
          }))
        }
        opportunityNotify.error()
      })
  }, [])

  const handleStatusChange = React.useCallback((opp: Opportunity, newStatus: "ganada" | "perdida" | "en_progreso") => {
    const originalStatus = kanbanOppsRef.current.find((o) => o.id === opp.id)?.status ?? opp.status
    if (originalStatus === newStatus) return

    setKanbanOpps((prev) => prev.map((o) => o.id === opp.id ? { ...o, status: newStatus } : o))

    if (newStatus === "ganada") opportunityNotify.won(opp.name)
    else if (newStatus === "perdida") opportunityNotify.lost(opp.name)
    else opportunityNotify.reopened(opp.name)

    const apiCall = newStatus === "ganada"
      ? opportunityService.won(opp.id)
      : newStatus === "perdida"
      ? opportunityService.lost(opp.id)
      : opportunityService.reOpen(opp.id)

    apiCall.catch(() => {
      setKanbanOpps((prev) => prev.map((o) => o.id === opp.id ? { ...o, status: originalStatus } : o))
      opportunityNotify.error()
    })
  }, [])

  const handleWon    = React.useCallback((opp: Opportunity) => handleStatusChange(opp, "ganada"),      [handleStatusChange])
  const handleLost   = React.useCallback((opp: Opportunity) => handleStatusChange(opp, "perdida"),     [handleStatusChange])
  const handleReopen = React.useCallback((opp: Opportunity) => handleStatusChange(opp, "en_progreso"), [handleStatusChange])

  // ── DnD sensors ──────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  function handleDragStart({ active }: DragStartEvent) {
    predragFilteredRef.current = filtered
    const opp = kanbanOppsRef.current.find((o) => o.id === active.id) ?? null
    preDragStageRef.current = opp?.stageId ?? null
    setActiveOpp(opp)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return

    const activeId = active.id as number
    const overId   = over.id

    setKanbanOpps((prev) => {
      const activeIndex = prev.findIndex((o) => o.id === activeId)
      if (activeIndex === -1) return prev

      const activeItem   = prev[activeIndex]
      const overIsColumn = isStageId(overId)
      const overOpp      = prev.find((o) => o.id === overId)
      const overStageId  = overIsColumn ? parseStageId(overId) : overOpp?.stageId

      if (overStageId == null) return prev
      if (activeItem.stageId === overStageId) return prev

      const updated = prev.map((o) => o.id === activeId ? { ...o, stageId: overStageId } : o)
      const overIndex = overIsColumn
        ? updated.findLastIndex((o) => o.stageId === overStageId)
        : updated.findIndex((o) => o.id === overId)

      return arrayMove(updated, updated.findIndex((o) => o.id === activeId), overIndex)
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveOpp(null)
    if (!over) return

    const activeId        = active.id as number
    const overId          = over.id
    const originalStageId = preDragStageRef.current
    const currentStageId  = kanbanOppsRef.current.find((o) => o.id === activeId)?.stageId ?? null

    // Reorder within the same column (cosmetic only — no API needed for position)
    if (!isStageId(overId) && active.id !== over.id) {
      setKanbanOpps((prev) => {
        const ai = prev.findIndex((o) => o.id === activeId)
        const oi = prev.findIndex((o) => o.id === overId)
        if (ai === -1 || oi === -1) return prev
        if (prev[ai].stageId === prev[oi].stageId) return arrayMove(prev, ai, oi)
        return prev
      })
    }

    // Fire API if the card crossed into a different stage (handleDragOver already updated stageId)
    if (currentStageId != null && currentStageId !== originalStageId) {
      const prevStage = stagesRef.current.find((s) => s.id === originalStageId)?.name
      const nextStage = stagesRef.current.find((s) => s.id === currentStageId)?.name
      if (nextStage) notify.success({ title: `Oportunidad movida a ${nextStage}`, description: "El pipeline se actualizó correctamente." })
      opportunityService.moveStage(activeId, currentStageId, prevStage, nextStage)
        .catch(() => {
          setKanbanOpps((prev) => prev.map((o) => o.id === activeId ? { ...o, stageId: originalStageId } : o))
          opportunityNotify.error()
        })
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Row 1 — view toggle + create */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        {/* Mobile — el grupo de píldoras no cabe junto al botón "Crear Oportunidad",
            se colapsa en un selector (mismo patrón que Formularios). */}
        <Select value={view} onValueChange={(v) => changeView(v as FunnelView)}>
          <SelectTrigger size="sm" className="w-32 shrink-0 md:hidden">
            <SelectValue placeholder="Vista">
              {(v: FunnelView) => {
                const opt = VIEW_OPTIONS.find((o) => o.value === v)
                if (!opt) return v
                return (
                  <span className="flex items-center gap-1.5">
                    <opt.icon className="size-3.5" />
                    {opt.label}
                  </span>
                )
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {VIEW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <opt.icon className="size-3.5" />
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Desktop — grupo de píldoras original, sin cambios */}
        <div className="hidden items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5 md:flex">
          <button
            type="button"
            onClick={() => changeView("lista")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              view === "lista"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
              view === "board"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <KanbanSquareIcon className="size-3.5" />
            Board
          </button>
          <button
            type="button"
            onClick={() => changeView("sugerencias")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              view === "sugerencias"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <SparklesIcon className="size-3.5" />
            Sugerencias
          </button>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Crear Oportunidad</Button>
      </div>

      {/* Row 2 — búsqueda + toggle de filtros. En mobile se apila en filas propias
          en vez de forzar scroll horizontal; desde md hacia arriba queda igual que antes. */}
      {view !== "sugerencias" && (
      <div className="flex shrink-0 flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar oportunidad..."
              className="h-8 pl-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Columnas solo aplica a la vista Lista — Board no tiene columnas configurables */}
            {view === "lista" && (
              <div className="[&_button]:w-full md:[&_button]:w-auto">
                <DropdownMenu open={columnsOpen} onOpenChange={setColumnsOpen}>
                  <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1.5" />}>
                    <Columns3Icon className="size-3.5" />
                    Columnas
                    <ChevronDownIcon className={cn("size-3.5 transition-transform", columnsOpen && "rotate-180")} />
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
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              Filtros
              <ChevronDownIcon className={cn("size-3.5 transition-transform", filtersOpen && "rotate-180")} />
            </Button>

            {hasFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={resetFilters}
              >
                <XIcon className="size-3.5" />
                Restablecer
              </Button>
            )}
          </div>
        </div>

        {view === "lista" && (
          <span className="md:ml-auto shrink-0 text-xs text-muted-foreground">{oppTotal} oportunidades</span>
        )}

        {view === "board" && (
          <span className="md:ml-auto shrink-0 text-xs text-muted-foreground">
            {filtered.length} oportunidades · {formatTotal(totalValue)}
          </span>
        )}
      </div>
      )}

      {/* Row 3 — filtros avanzados, colapsados por defecto (botón "Filtros" en fila 2) */}
      {view !== "sugerencias" && filtersOpen && (
        <div className="flex shrink-0 flex-col gap-2 border-b bg-muted/30 px-4 py-2 md:flex-row md:items-center">
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Pipeline"
                options={flowOptions}
                selected={flowId === null ? "all" : String(flowId)}
                onChange={(v) => setFlowId(v === "all" ? null : Number(v))}
              />
            </div>

            <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />

            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Estado"
                options={statusOptions}
                selected={statusFilter}
                onChange={(v) => setStatusFilter(v as OppStatus | "all")}
              />
            </div>

            {view === "board" && (
              <>
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
          </div>
        </div>
      )}

      {/* Board */}
      {view === "board" && (
        <DndContext
          id="funnel-kanban"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveOpp(null)}
        >
          <KanbanBoard>
            {stages.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                opps={filtered}
                statsOpps={statsOpps}
                realCount={hasActiveFilters ? undefined : stageCounts[stage.id]}
                hasMore={stagePages[stage.id]?.hasMore}
                loadingMore={stagePages[stage.id]?.loadingMore}
                onLoadMore={loadMoreForStage}
                stages={stages}
                onMove={handleMoveStage}
                onPreview={handlePreview}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onWon={handleWon}
                onLost={handleLost}
                onReopen={handleReopen}
              />
            ))}
          </KanbanBoard>

          <DragOverlay dropAnimation={{ duration: 160, easing: "ease" }}>
            {activeOpp && (
              <OppCard
                opp={activeOpp}
                stages={stages}
                onMove={() => {}}
                onPreview={() => {}}
                onViewDetail={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onWon={() => {}}
                onLost={() => {}}
                onReopen={() => {}}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* List */}
      {view === "lista" && (
        <FunnelTable
          search={search}
          statusFilter={statusFilter}
          flowId={flowId}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onTotalChange={setOppTotal}
          refreshKey={refreshKey}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Sugerencias — mock con datos estáticos, ver SugerenciasIA_Plan.md */}
      {view === "sugerencias" && <SuggestionsView />}

      <FunnelPreviewSheet
        deal={previewOpp}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <CreateOpportunitySheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultFlowId={flowId ?? undefined}
        onSuccess={refresh}
      />

      {editOppId !== null && (
        <CreateOpportunitySheet
          open
          onOpenChange={(v) => { if (!v) setEditOppId(null) }}
          opportunityId={editOppId}
          defaultFlowId={flowId ?? undefined}
          onSuccess={() => { setEditOppId(null); refresh() }}
        />
      )}
    </div>
  )
}
