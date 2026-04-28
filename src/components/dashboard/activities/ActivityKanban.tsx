"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  EyeIcon,
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
import { ActivitiesTable } from "./ActivitiesTable"
import { ActivityPreviewSheet } from "./ActivityPreviewSheet"
import {
  STAGES,
  ACTIVITIES,
  ACTIVITY_TYPES,
  type Activity,
  type ActivityPriority,
} from "./data"

// ─── Configs ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<ActivityPriority, { label: string; className: string }> = {
  alta:  { label: "Alta",  className: "bg-red-50 text-red-700"        },
  media: { label: "Media", className: "bg-amber-50 text-amber-700"    },
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
}

const TODAY = new Date().toISOString().slice(0, 10)

function isOverdue(activity: Activity) {
  return (
    activity.stageId !== "completada" &&
    activity.stageId !== "cancelada" &&
    activity.endDate < TODAY
  )
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y.slice(2)}`
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

// ─── ActivityCard ───────────────────────────────────────────────────────────

interface ActivityCardProps {
  activity: Activity
  onMove: (stageId: string) => void
  onPreview: () => void
  onViewDetail: () => void
  isDragging?: boolean
}

const ActivityCard = React.memo(function ActivityCard({
  activity,
  onMove,
  onPreview,
  onViewDetail,
  isDragging,
}: ActivityCardProps) {
  const priority  = PRIORITY_CONFIG[activity.priority]
  const typeStyle = TYPE_CONFIG[activity.type] ?? { className: "bg-muted text-muted-foreground" }
  const overdue   = isOverdue(activity)

  const dateDisplay =
    activity.startDate === activity.endDate
      ? formatDate(activity.endDate)
      : `${formatDate(activity.startDate)} → ${formatDate(activity.endDate)}`

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2 transition-shadow select-none",
        !isDragging && "hover:shadow-sm cursor-grab active:cursor-grabbing",
        isDragging  && "cursor-grabbing shadow-lg",
      )}
    >
      {/* Title + menu */}
      <div className="flex items-start gap-1">
        <p className="flex-1 text-sm font-medium leading-snug">{activity.title}</p>
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
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mover a</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {STAGES.filter((s) => s.id !== activity.stageId).map((stage) => (
              <DropdownMenuItem key={stage.id} onClick={() => onMove(stage.id)}>
                {stage.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Type badge */}
      <div>
        <Badge className={cn("rounded-full border-0 text-xs px-2 py-0", typeStyle.className)}>
          {activity.type}
        </Badge>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarIcon className="size-3 shrink-0" />
        <span>{dateDisplay}</span>
      </div>

      {/* Priority + overdue + responsible */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <Badge className={cn("rounded-full border-0 text-xs px-2 py-0 shrink-0", priority.className)}>
            {priority.label}
          </Badge>
          {overdue && (
            <Badge className="rounded-full border-0 text-xs px-2 py-0 shrink-0 bg-red-50 text-red-600">
              Atrasada
            </Badge>
          )}
        </div>
        <div className="flex size-6 shrink-0 overflow-hidden rounded-full bg-primary/10">
          {activity.responsible.avatar ? (
            <img
              src={activity.responsible.avatar}
              alt={activity.responsible.name}
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary">
              {activity.responsible.initials}
            </span>
          )}
        </div>
      </div>

      {/* Opportunity / funnel link */}
      {(activity.opportunityName || activity.funnelName) && (
        <p className="text-xs text-muted-foreground truncate border-t pt-2">
          {[activity.funnelName, activity.opportunityName].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  )
})

// ─── SortableCard ───────────────────────────────────────────────────────────

function SortableCard({
  activity,
  onMove,
  onPreview,
  onViewDetail,
}: {
  activity: Activity
  onMove: (activityId: string, stageId: string) => void
  onPreview: (activity: Activity) => void
  onViewDetail: (activity: Activity) => void
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
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <ActivityCard activity={activity} onMove={handleMove} onPreview={handlePreview} onViewDetail={handleViewDetail} />
    </div>
  )
}

// ─── DroppableColumn ────────────────────────────────────────────────────────

interface ActivityStage {
  id: string
  name: string
}

interface DroppableColumnProps {
  stage: ActivityStage
  activities: Activity[]
  statsActivities: Activity[]
  onMove: (activityId: string, stageId: string) => void
  onPreview: (activity: Activity) => void
  onViewDetail: (activity: Activity) => void
}

function DroppableColumn({ stage, activities, statsActivities, onMove, onPreview, onViewDetail }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const stageActivities = activities.filter((a) => a.stageId === stage.id)
  const activityIds     = stageActivities.map((a) => a.id)

  const stageStats    = statsActivities.filter((a) => a.stageId === stage.id)
  const overdueCount  = stageStats.filter(isOverdue).length

  return (
    <KanbanColumn
      ref={setNodeRef}
      title={stage.name}
      count={stageStats.length}
      subtitle={overdueCount > 0 ? `${overdueCount} atrasada${overdueCount > 1 ? "s" : ""}` : undefined}
      subtitleClassName="text-amber-600"
      className={cn(isOver && "ring-2 ring-inset ring-primary/30 bg-primary/5")}
    >
      <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
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
    </KanbanColumn>
  )
}

// ─── ActivityKanban ─────────────────────────────────────────────────────────

export function ActivityKanban() {
  const router = useRouter()

  const [view, setView]               = React.useState<"board" | "lista">("board")
  const [activities, setActivities]   = React.useState(ACTIVITIES)
  const [activeActivity, setActiveActivity] = React.useState<Activity | null>(null)
  const [previewActivity, setPreviewActivity] = React.useState<Activity | null>(null)
  const [sheetOpen, setSheetOpen]             = React.useState(false)

  const handlePreview = React.useCallback((activity: Activity) => {
    setPreviewActivity(activity)
    setSheetOpen(true)
  }, [])

  const handleViewDetail = React.useCallback((activity: Activity) => {
    router.push(`/crm/activities/${activity.id}`)
  }, [router])

  const [search, setSearch]                       = React.useState("")
  const [typeFilter, setTypeFilter]               = React.useState<string[]>([])
  const [priorityFilter, setPriorityFilter]       = React.useState<string[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const responsibleOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return ACTIVITIES.filter((a) => {
      if (seen.has(a.responsible.initials)) return false
      seen.add(a.responsible.initials)
      return true
    }).map((a) => ({ value: a.responsible.initials, label: a.responsible.name }))
  }, [])

  const filtered = React.useMemo(() => {
    return activities.filter((a) => {
      if (typeFilter.length        > 0 && !typeFilter.includes(a.type))                           return false
      if (priorityFilter.length    > 0 && !priorityFilter.includes(a.priority))                   return false
      if (responsibleFilter.length > 0 && !responsibleFilter.includes(a.responsible.initials))    return false
      if (search) {
        const q = search.toLowerCase()
        if (!a.title.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [activities, search, typeFilter, priorityFilter, responsibleFilter])

  const predragFilteredRef = React.useRef(filtered)
  const statsActivities = activeActivity ? predragFilteredRef.current : filtered

  const overdueCount = filtered.filter(isOverdue).length

  const moveActivity = React.useCallback((activityId: string, targetStageId: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, stageId: targetStageId } : a)),
    )
  }, [])

  function handleDragStart({ active }: DragStartEvent) {
    predragFilteredRef.current = filtered
    setActiveActivity(activities.find((a) => a.id === active.id) ?? null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId   = over.id  as string

    setActivities((prev) => {
      const activeIndex = prev.findIndex((a) => a.id === activeId)
      if (activeIndex === -1) return prev

      const activeItem   = prev[activeIndex]
      const isOverStage  = STAGES.some((s) => s.id === overId)
      const overItem     = prev.find((a) => a.id === overId)
      const overStageId  = isOverStage ? overId : overItem?.stageId

      if (!overStageId) return prev
      if (activeItem.stageId === overStageId) return prev

      const updated = prev.map((a) =>
        a.id === activeId ? { ...a, stageId: overStageId } : a,
      )
      const overIndex = isOverStage
        ? updated.findLastIndex((a) => a.stageId === overStageId)
        : updated.findIndex((a) => a.id === overId)

      return arrayMove(updated, updated.findIndex((a) => a.id === activeId), overIndex)
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveActivity(null)
    if (!over || active.id === over.id) return

    const activeId    = active.id as string
    const overId      = over.id  as string
    const isOverStage = STAGES.some((s) => s.id === overId)
    if (isOverStage) return

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

  const hasActiveFilters = typeFilter.length > 0 || priorityFilter.length > 0 || responsibleFilter.length > 0

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
        <Button size="sm">
          <ActivityIcon className="size-3.5" />
          Crear Actividad
        </Button>
      </div>

      {/* Row 2 — filters (board only) */}
      {view === "board" && (
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          <div className="relative w-48 shrink-0">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar actividad..."
              className="h-8 pl-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto" />

          <KanbanFacetedFilter
            title="Tipo"
            options={ACTIVITY_TYPES.map((t) => ({ value: t, label: t }))}
            selected={typeFilter}
            onChange={setTypeFilter}
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

          <KanbanFacetedFilter
            title="Responsable"
            options={responsibleOptions}
            selected={responsibleFilter}
            onChange={setResponsibleFilter}
          />

          {(hasActiveFilters || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => {
                setTypeFilter([])
                setPriorityFilter([])
                setResponsibleFilter([])
                setSearch("")
              }}
            >
              <XIcon className="size-3.5" />
              Restablecer
            </Button>
          )}

          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {filtered.length} actividades
            {overdueCount > 0 && (
              <>
                {" · "}
                <span className="text-amber-600">
                  {overdueCount} atrasada{overdueCount > 1 ? "s" : ""}
                </span>
              </>
            )}
          </span>
        </div>
      )}

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
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                activities={filtered}
                statsActivities={statsActivities}
                onMove={moveActivity}
                onPreview={handlePreview}
                onViewDetail={handleViewDetail}
              />
            ))}
          </KanbanBoard>

          <DragOverlay dropAnimation={{ duration: 160, easing: "ease" }}>
            {activeActivity && (
              <ActivityCard activity={activeActivity} onMove={() => {}} onPreview={() => {}} onViewDetail={() => {}} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* List */}
      {view === "lista" && <ActivitiesTable activities={activities} />}

      <ActivityPreviewSheet
        activity={previewActivity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
