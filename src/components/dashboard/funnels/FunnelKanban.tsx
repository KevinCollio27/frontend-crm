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
  EyeIcon,
  FileTextIcon,
  KanbanSquareIcon,
  ListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SparklesIcon,
  PlusCircleIcon,
  RotateCcwIcon,
  SearchIcon,
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
import { useSidebar } from "@/components/ui/sidebar"
import { SingleSelectFilter, type SingleSelectOption } from "@/components/ui/single-select-filter"
import { KanbanFacetedFilter } from "@/components/ui/faceted-filter"
import { FunnelTable, COLUMN_LABELS, DEFAULT_COLUMN_VISIBILITY, mapOpportunity, type Opportunity } from "./FunnelTable"
import { SuggestionsView } from "./suggestions/SuggestionsView"
import type { VisibilityState } from "@tanstack/react-table"
import { FunnelPreviewSheet } from "./FunnelPreviewSheet"
import { CreateOpportunitySheet } from "./CreateOpportunitySheet"
import { flowService } from "@/services/flow.service"
import { opportunityService } from "@/services/opportunity.service"
import { notify, opportunityNotify } from "@/lib/notify"
import { opportunityConfirm } from "@/lib/confirm"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { Flow, FlowStage } from "@/types/flow"

// ─── Configs ─────────────────────────────────────────────────────────────────

type OppStatus = "en_progreso" | "ganada" | "perdida" | "reabierta"

const STATUS_CONFIG: Record<OppStatus, { label: string; className: string; border: string }> = {
  en_progreso: { label: "En Progreso", className: "bg-blue-50 text-blue-700",       border: ""                                },
  ganada:      { label: "Ganada",      className: "bg-emerald-50 text-emerald-700", border: "border-l-2 border-l-emerald-500" },
  perdida:     { label: "Perdida",     className: "bg-red-50 text-red-700",         border: "border-l-2 border-l-red-400"    },
  reabierta:   { label: "Reabierta",   className: "bg-amber-50 text-amber-700",     border: "border-l-2 border-l-amber-400"  },
}

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
          <AvatarImage src="https://github.com/shadcn.png" alt={opp.responsible.name} />
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
      count={stageStats.length}
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
    </KanbanColumn>
  )
}

// ─── FunnelKanban ─────────────────────────────────────────────────────────────

export function FunnelKanban() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { setOpen }  = useSidebar()

  const [view, setView] = React.useState<"board" | "lista" | "sugerencias">(
    () => (searchParams.get("view") as "board" | "lista" | "sugerencias") ?? "lista"
  )

  React.useEffect(() => {
    setOpen(view !== "board")
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    return () => setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function changeView(v: "board" | "lista" | "sugerencias") {
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
  const [oppTotal, setOppTotal]                 = React.useState(0)

  // ── Board state ─────────────────────────────────────────────────────────────
  const [kanbanOpps, setKanbanOpps]         = React.useState<Opportunity[]>([])
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

  // ── Fetch kanban opportunities when flowId or refreshKey changes ─────────────
  React.useEffect(() => {
    if (flowId === null) return
    let cancelled = false
    opportunityService
      .list({ flow_id: flowId, take: 500 })
      .then((page) => {
        if (cancelled) return
        setKanbanOpps(page.data.map(mapOpportunity))
      })
      .catch(() => { if (!cancelled) setKanbanOpps([]) })

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
    if (nextStage) notify.success({ title: `Oportunidad movida a ${nextStage}`, description: "El pipeline se actualizó correctamente." })

    opportunityService.moveStage(oppId, targetStageId, prevStage, nextStage)
      .catch(() => {
        setKanbanOpps((prev) => prev.map((o) => o.id === oppId ? { ...o, stageId: originalStageId } : o))
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
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
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

      {/* Row 2 — filters */}
      {view !== "sugerencias" && (
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <div className="relative w-44 shrink-0">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar oportunidad..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <SingleSelectFilter
          title="Pipeline"
          options={flowOptions}
          selected={flowId === null ? "all" : String(flowId)}
          onChange={(v) => setFlowId(v === "all" ? null : Number(v))}
        />

        <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto" />

        <SingleSelectFilter
          title="Estado"
          options={statusOptions}
          selected={statusFilter}
          onChange={(v) => setStatusFilter(v as OppStatus | "all")}
        />

        {view === "lista" && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{oppTotal} oportunidades</span>
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
        )}

        {view === "board" && (
          <>
            <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto" />

            <KanbanFacetedFilter
              title="Responsable"
              options={responsibleOptions}
              selected={responsibleFilter}
              onChange={setResponsibleFilter}
            />

            {responsibleFilter.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setResponsibleFilter([])}
              >
                <XIcon className="size-3.5" />
                Restablecer
              </Button>
            )}

            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {filtered.length} oportunidades · {formatTotal(totalValue)}
            </span>
          </>
        )}
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
