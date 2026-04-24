"use client"

import * as React from "react"
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
  CalendarIcon,
  EyeIcon,
  FileTextIcon,
  KanbanSquareIcon,
  ListIcon,
  MoreHorizontalIcon,
  PlusCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
import { FunnelTable } from "./FunnelTable"
import { FunnelPreviewSheet } from "./FunnelPreviewSheet"
import {
  STAGES,
  DEALS,
  FUNNELS,
  type Deal,
  type Priority,
  type DealStatus,
} from "./data"

// ─── Configs ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  alta:  { label: "Alta",  className: "bg-red-50 text-red-700"       },
  media: { label: "Media", className: "bg-amber-50 text-amber-700"   },
  baja:  { label: "Baja",  className: "bg-emerald-50 text-emerald-700" },
}

const STATUS_CONFIG: Record<
  Exclude<DealStatus, "open">,
  { label: string; className: string; border: string }
> = {
  won:  { label: "Ganado",  className: "bg-emerald-50 text-emerald-700", border: "border-l-2 border-l-emerald-500" },
  lost: { label: "Perdido", className: "bg-red-50 text-red-600",         border: "border-l-2 border-l-red-400"    },
}

const STATUS_FILTERS: { key: DealStatus | "all"; label: string }[] = [
  { key: "all",  label: "Todas"    },
  { key: "open", label: "Abiertas" },
  { key: "won",  label: "Ganadas"  },
  { key: "lost", label: "Perdidas" },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTotal(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString("es-CL")}`
}

// ─── KanbanFacetedFilter ────────────────────────────────────────────────────

interface FacetedFilterOption { value: string; label: string }

interface KanbanFacetedFilterProps {
  title: string
  options: FacetedFilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
}

function KanbanFacetedFilter({ title, options, selected, onChange }: KanbanFacetedFilterProps) {
  const selectedSet = new Set(selected)

  const toggle = (value: string) => {
    const next = new Set(selectedSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(Array.from(next))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <PlusCircleIcon className="size-4" />
        {title}
        {selectedSet.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto" />
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">
              {selectedSet.size}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedSet.has(option.value)}
            onCheckedChange={() => toggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedSet.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange([])}
            >
              Limpiar filtros
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── DealCard ───────────────────────────────────────────────────────────────

interface DealCardProps {
  deal: Deal
  onMove: (stageId: string) => void
  onPreview: () => void
  isDragging?: boolean
}

const DealCard = React.memo(function DealCard({ deal, onMove, onPreview, isDragging }: DealCardProps) {
  const priority  = PRIORITY_CONFIG[deal.priority]
  const statusCfg = deal.status !== "open" ? STATUS_CONFIG[deal.status] : null

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2 transition-shadow select-none",
        !isDragging && "hover:shadow-sm cursor-grab active:cursor-grabbing",
        isDragging  && "cursor-grabbing shadow-lg",
        statusCfg?.border,
      )}
    >
      <div className="flex items-start gap-1">
        <p className="flex-1 text-sm font-medium leading-snug">{deal.name}</p>
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
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mover a</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {STAGES.filter((s) => s.id !== deal.stageId).map((stage) => (
              <DropdownMenuItem key={stage.id} onClick={() => onMove(stage.id)}>
                {stage.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-xs text-muted-foreground truncate">
        {deal.company} · {deal.contact}
      </p>

      <p className={cn("text-sm", deal.value > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
        {deal.value > 0 ? `$${deal.value.toLocaleString("es-CL")}` : "No aplica"}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {statusCfg ? (
            <Badge className={cn("rounded-full border-0 text-xs px-2 py-0 shrink-0", statusCfg.className)}>
              {statusCfg.label}
            </Badge>
          ) : (
            <Badge className={cn("rounded-full border-0 text-xs px-2 py-0 shrink-0", priority.className)}>
              {priority.label}
            </Badge>
          )}
          {deal.closeDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <CalendarIcon className="size-3 shrink-0" />
              {deal.closeDate}
            </span>
          )}
        </div>
        <div className="flex size-6 shrink-0 overflow-hidden rounded-full bg-primary/10">
          {deal.responsible.avatar ? (
            <img src={deal.responsible.avatar} alt={deal.responsible.name} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary">
              {deal.responsible.initials}
            </span>
          )}
        </div>
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
          {deal.quotationCount > 0 ? `Cotización (${deal.quotationCount})` : "Cotización"}
        </button>
        <button
          type="button"
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ActivityIcon className="size-3.5 shrink-0" />
          {deal.activityCount > 0 ? `Actividad (${deal.activityCount})` : "Actividad"}
        </button>
      </div>
    </div>
  )
})

// ─── SortableCard ───────────────────────────────────────────────────────────

function SortableCard({
  deal,
  onMove,
  onPreview,
}: {
  deal: Deal
  onMove: (dealId: string, stageId: string) => void
  onPreview: (deal: Deal) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { stageId: deal.stageId },
  })

  const handleMove    = React.useCallback((stageId: string) => onMove(deal.id, stageId), [deal.id, onMove])
  const handlePreview = React.useCallback(() => onPreview(deal), [deal, onPreview])

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
      <DealCard deal={deal} onMove={handleMove} onPreview={handlePreview} />
    </div>
  )
}

// ─── DroppableColumn ────────────────────────────────────────────────────────

interface DroppableColumnProps {
  stage: { id: string; name: string }
  deals: Deal[]
  statsDeals: Deal[]
  onMove: (dealId: string, stageId: string) => void
  onPreview: (deal: Deal) => void
}

function DroppableColumn({
  stage,
  deals,
  statsDeals,
  onMove,
  onPreview,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  // Live deals: drive the card list and sortable order
  const stageDeals = deals.filter((d) => d.stageId === stage.id)
  const dealIds    = stageDeals.map((d) => d.id)

  // Stats deals: frozen snapshot during drag — count and total don't jump while hovering
  const stageStats = statsDeals.filter((d) => d.stageId === stage.id)
  const stageTotal = stageStats.reduce((sum, d) => sum + d.value, 0)

  return (
    <KanbanColumn
      ref={setNodeRef}
      title={stage.name}
      count={stageStats.length}
      subtitle={stageTotal > 0 ? formatTotal(stageTotal) : undefined}
      className={cn(isOver && "ring-2 ring-inset ring-primary/30 bg-primary/5")}
    >
      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        {stageDeals.map((deal) => (
          <SortableCard
            key={deal.id}
            deal={deal}
            onMove={onMove}
            onPreview={onPreview}
          />
        ))}
      </SortableContext>
    </KanbanColumn>
  )
}

// ─── FunnelKanban ───────────────────────────────────────────────────────────

export function FunnelKanban() {
  const [view, setView]             = React.useState<"board" | "lista">("board")
  const [deals, setDeals]           = React.useState(DEALS)
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null)
  const [previewDeal, setPreviewDeal]   = React.useState<Deal | null>(null)
  const [sheetOpen, setSheetOpen]       = React.useState(false)

  const handlePreview = React.useCallback((deal: Deal) => {
    setPreviewDeal(deal)
    setSheetOpen(true)
  }, [])

  const [search, setSearch]                       = React.useState("")
  const [funnelId, setFunnelId]                   = React.useState("default")
  const [statusFilter, setStatusFilter]           = React.useState<DealStatus | "all">("all")
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [priorityFilter, setPriorityFilter]       = React.useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const responsibleOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return DEALS.filter((d) => {
      if (seen.has(d.responsible.initials)) return false
      seen.add(d.responsible.initials)
      return true
    }).map((d) => ({ value: d.responsible.initials, label: d.responsible.name }))
  }, [])

  const filtered = React.useMemo(() => {
    return deals.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false
      if (responsibleFilter.length > 0 && !responsibleFilter.includes(d.responsible.initials)) return false
      if (priorityFilter.length    > 0 && !priorityFilter.includes(d.priority))                return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !d.name.toLowerCase().includes(q) &&
          !d.company.toLowerCase().includes(q) &&
          !d.contact.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [deals, search, statusFilter, responsibleFilter, priorityFilter])

  // Snapshot captured on drag start — column stats read from here during drag so they
  // don't recalculate on every onDragOver event (which fires at ~60fps).
  const predragFilteredRef = React.useRef(filtered)
  const statsDeals = activeDeal ? predragFilteredRef.current : filtered

  const totalValue = filtered.reduce((sum, d) => sum + d.value, 0)

  const moveDeal = React.useCallback((dealId: string, targetStageId: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stageId: targetStageId } : d)),
    )
  }, [])

  function handleDragStart({ active }: DragStartEvent) {
    predragFilteredRef.current = filtered
    setActiveDeal(deals.find((d) => d.id === active.id) ?? null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId   = over.id as string

    setDeals((prev) => {
      const activeIndex = prev.findIndex((d) => d.id === activeId)
      if (activeIndex === -1) return prev

      const activeItem   = prev[activeIndex]
      const isOverColumn = STAGES.some((s) => s.id === overId)
      const overDeal     = prev.find((d) => d.id === overId)
      const overStageId  = isOverColumn ? overId : overDeal?.stageId

      if (!overStageId) return prev
      // Same column — SortableContext handles reorder via onDragEnd
      if (activeItem.stageId === overStageId) return prev

      // Cross-column: update stageId and insert next to the target card
      const updated = prev.map((d) =>
        d.id === activeId ? { ...d, stageId: overStageId } : d,
      )
      const overIndex = isOverColumn
        ? updated.findLastIndex((d) => d.stageId === overStageId)
        : updated.findIndex((d) => d.id === overId)

      return arrayMove(updated, updated.findIndex((d) => d.id === activeId), overIndex)
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDeal(null)
    if (!over || active.id === over.id) return

    const activeId     = active.id as string
    const overId       = over.id  as string
    const isOverColumn = STAGES.some((s) => s.id === overId)
    if (isOverColumn) return

    setDeals((prev) => {
      const activeIndex = prev.findIndex((d) => d.id === activeId)
      const overIndex   = prev.findIndex((d) => d.id === overId)
      if (activeIndex === -1 || overIndex === -1) return prev
      // Same column: finalise sort order
      if (prev[activeIndex].stageId === prev[overIndex].stageId) {
        return arrayMove(prev, activeIndex, overIndex)
      }
      return prev
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Row 1 — view toggle + create */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setView("board")}
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
            onClick={() => setView("lista")}
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
        </div>
        <Button size="sm">+ Crear Oportunidad</Button>
      </div>

      {/* Row 2 — filters (board only) */}
      {view === "board" && (
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

          <select
            value={funnelId}
            onChange={(e) => setFunnelId(e.target.value)}
            className="h-8 w-40 shrink-0 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none"
          >
            {FUNNELS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto" />

          <div className="flex items-center gap-1 shrink-0">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto" />

          <KanbanFacetedFilter
            title="Responsable"
            options={responsibleOptions}
            selected={responsibleFilter}
            onChange={setResponsibleFilter}
          />

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

          {(responsibleFilter.length > 0 || priorityFilter.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => { setResponsibleFilter([]); setPriorityFilter([]) }}
            >
              <XIcon className="size-3.5" />
              Restablecer
            </Button>
          )}

          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {filtered.length} oportunidades · {formatTotal(totalValue)}
          </span>
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
          onDragCancel={() => setActiveDeal(null)}
        >
          <KanbanBoard>
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                deals={filtered}
                statsDeals={statsDeals}
                onMove={moveDeal}
                onPreview={handlePreview}
              />
            ))}
          </KanbanBoard>

          <DragOverlay dropAnimation={{ duration: 160, easing: "ease" }}>
            {activeDeal && <DealCard deal={activeDeal} onMove={() => {}} onPreview={() => {}} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      {/* List */}
      {view === "lista" && <FunnelTable deals={deals} />}

      <FunnelPreviewSheet
        deal={previewDeal}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
