"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowDownRightIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  ExternalLinkIcon,
  MinusIcon,
  MoreHorizontal,
  PencilIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { FcGoogle } from "react-icons/fc"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ActivityPreviewSheet } from "./ActivityPreviewSheet"
import { CreateActivitySheet } from "./CreateActivitySheet"
import { activityService } from "@/services/activity.service"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { mapActivity, type Activity } from "@/lib/activity-utils"
import { useWorkspaceTimezone } from "@/hooks/useWorkspaceTimezone"
import type { ActivityRaw } from "@/types/activity"
import { getInitials, getSortIcon } from "@/lib/table-utils"
import { cn } from "@/lib/utils"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"

export type { Activity }

// ─── Config ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

const PRIORITY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  alta:  { icon: <ArrowUpIcon className="size-3" />,   color: "text-red-600"          },
  media: { icon: <MinusIcon className="size-3" />,     color: "text-yellow-600"       },
  baja:  { icon: <ArrowDownIcon className="size-3" />, color: "text-muted-foreground" },
}

const STAGE_CONFIG: Record<string, { dot: string; badge: string }> = {
  pendiente:   { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600"     },
  en_progreso: { dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600"       },
  completada:  { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600" },
  cancelada:   { dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-500"        },
}

const STAGE_NAMES: Record<string, string> = {
  pendiente:   "Pendiente",
  en_progreso: "En Progreso",
  completada:  "Completada",
  cancelada:   "Cancelada",
}

export const COLUMN_LABELS: Record<string, string> = {
  id:              "ID",
  title:           "Título",
  type:            "Tipo",
  startDate:       "Período",
  stageId:         "Estado / Prioridad",
  responsible:     "Responsable",
  createdAt:       "Creada",
}

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  createdAt: false,
}

// En mobile no hay espacio para columnas de más — solo Título queda visible por
// defecto (Acciones y el checkbox de selección no dependen de esto, siempre se ven).
export const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  type: false,
  startDate: false,
  stageId: false,
  responsible: false,
  createdAt: false,
}

// ─── QueryState ───────────────────────────────────────────────────────────────

type QueryState = {
  page: number
  pageSize: number
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select: <div className="size-4 animate-pulse rounded bg-muted" />,
  id:     <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  title: (
    <div className="flex items-stretch gap-2.5">
      <div className="w-1 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  type:   <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  startDate: (
    <div className="space-y-1.5">
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="h-3 w-28 animate-pulse rounded bg-muted" />
    </div>
  ),
  stageId: (
    <div className="space-y-1.5">
      <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
    </div>
  ),
  responsible: (
    <div className="flex items-center gap-2">
      <div className="size-6 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  ),
  createdAt:       <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:         <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function getColumns(
  onPreview: (activity: Activity) => void,
  onDetail: (activity: Activity) => void,
  onEdit: (activity: Activity) => void,
  onDelete: (activity: Activity) => void,
): ColumnDef<Activity>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          ID {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">#{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Título {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const act = row.original
        return (
          <div className="flex items-stretch gap-2.5">
            <EntityAccentBar seed={act.id} />
            <div className="leading-tight min-w-0">
              <div className="text-sm font-medium truncate">{act.title}</div>
              {act.opportunityName ? (
                <div className="text-xs text-muted-foreground truncate">{act.opportunityName}</div>
              ) : act.googleEventId ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <FcGoogle className="size-3 shrink-0" />
                  Google Calendar
                </div>
              ) : (
                <div className="text-xs text-muted-foreground truncate">—</div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Tipo {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {(row.getValue("type") as string) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Período {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const startDate: string = row.getValue("startDate")
        const endDate: string   = row.original.endDate
        return (
          <div className="leading-tight space-y-0.5">
            <div className="flex items-center gap-1 text-xs">
              <ArrowDownRightIcon className="size-3 text-red-500 shrink-0" />
              <span className="text-muted-foreground">Hasta:</span>
              <span className="font-medium">{endDate || "—"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRightIcon className="size-3 text-green-500 shrink-0" />
              <span>Desde:</span>
              <span>{startDate || "—"}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "stageId",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Estado / Prioridad {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const stageId: string  = row.getValue("stageId")
        const priority: string = row.original.priority
        const overdue = stageId === "pendiente" && row.original.endDate < TODAY && !!row.original.endDate
        const config  = STAGE_CONFIG[stageId] ?? STAGE_CONFIG.pendiente
        const pConfig = PRIORITY_CONFIG[priority]
        return (
          <div className="leading-tight space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", config.badge)}>
                <div className={cn("size-1.5 rounded-full", config.dot)} />
                {STAGE_NAMES[stageId] ?? stageId}
              </span>
              {overdue && (
                <Badge className="rounded-full border-0 text-xs px-2 py-0 bg-red-50 text-red-600">
                  Atrasada
                </Badge>
              )}
            </div>
            {pConfig && (
              <div className="flex items-center gap-1 text-xs px-2">
                <span className="text-muted-foreground">Prioridad:</span>
                <span className={cn("inline-flex items-center gap-0.5", pConfig.color)}>
                  {pConfig.icon}
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "responsible",
      accessorFn: (row) => row.responsible.name,
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Responsable {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const r = row.original.responsible
        return (
          <div className="flex items-center gap-2">
            <Avatar size="default">
              <AvatarImage src={r.avatarUrl ?? "https://github.com/shadcn.png"} alt={r.name} />
              <AvatarFallback className="text-base">
                {getInitials(r.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{r.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Creada {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.getValue("createdAt")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const activity = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onDetail(activity)}>
                  <ExternalLinkIcon /> Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview(activity)}>
                  <UserIcon /> Vista Previa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(activity)}>
                  <PencilIcon /> Editar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(activity)}
              >
                <Trash2Icon /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ActivitiesTableProps {
  search:                   string
  status:                   string | null
  flowId:                   number | null
  opportunityId:            number | null
  columnVisibility:         VisibilityState
  onColumnVisibilityChange: React.Dispatch<React.SetStateAction<VisibilityState>>
  onTotalChange:            (n: number) => void
  refreshKey?:              number
}

export function ActivitiesTable({
  search,
  status,
  flowId,
  opportunityId,
  columnVisibility,
  onColumnVisibilityChange,
  onTotalChange,
  refreshKey = 0,
}: ActivitiesTableProps) {
  const router = useRouter()
  const timezone = useWorkspaceTimezone()
  const [rawItems, setRawItems] = React.useState<ActivityRaw[]>([])
  const [data, setData] = React.useState<Activity[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState<QueryState>({ page: 1, pageSize: 10 })
  // Solo para forzar un refetch propio si falla un borrado optimista — el
  // refreshKey compartido (prop) es del Kanban, esto es interno a la tabla.
  const [localRefreshKey, setLocalRefreshKey] = React.useState(0)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editActivity, setEditActivity] = React.useState<ActivityRaw | null>(null)

  // Reset a la primera página cuando cambian los filtros compartidos con el Board.
  React.useEffect(() => {
    setQuery((q) => ({ ...q, page: 1 }))
  }, [search, status, flowId, opportunityId])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      activityService
        .list({
          page:          query.page,
          take:          query.pageSize,
          filter:        search || undefined,
          status:        status ?? undefined,
          flowId:        flowId ?? undefined,
          opportunityId: opportunityId ?? undefined,
        })
        .then((res) => {
          if (cancelled) return
          setRawItems(res.data)
          setData(res.data.map((a) => mapActivity(a, timezone)))
          setTotal(res.total)
          onTotalChange(res.total)
          setLoading(false)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })
    }, search ? 400 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, search, status, flowId, opportunityId, refreshKey, localRefreshKey, timezone])

  const handleEdit = React.useCallback((activity: Activity) => {
    const raw = rawItems.find((r) => r.id === activity.id) ?? null
    setEditActivity(raw)
  }, [rawItems])

  const handleDelete = React.useCallback(async (activity: Activity) => {
    const confirmed = await orgConfirm.delete(activity.title)
    if (!confirmed) return

    setData((prev) => prev.filter((r) => r.id !== activity.id))
    setRawItems((prev) => prev.filter((r) => r.id !== activity.id))
    setTotal((t) => t - 1)

    activityService.delete(activity.id)
      .then(() => {
        notify.success({ title: "Actividad eliminada", description: `"${activity.title}" fue eliminada.` })
      })
      .catch(() => {
        setLocalRefreshKey((k) => k + 1)
        notify.error({ title: "Algo salió mal", description: "No se pudo eliminar la actividad." })
      })
  }, [])

  const columns = React.useMemo(
    () => getColumns(
      (activity) => { setSelectedActivity(activity); setSheetOpen(true) },
      (activity) => router.push(`/crm/activities/${activity.id}?from=list`),
      handleEdit,
      handleDelete,
    ),
    [router, handleEdit, handleDelete]
  )

  const table = useReactTable({
    data,
    columns,
    rowCount: total,
    manualPagination: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: onColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: query.page - 1, pageSize: query.pageSize },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: query.page - 1, pageSize: query.pageSize })
          : updater
      setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
    },
  })

  const skeletonRows = Array.from({ length: query.pageSize })

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Table */}
      <div className="mx-4 mt-3 rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              skeletonRows.map((_, i) => (
                <TableRow key={i}>
                  {table.getVisibleLeafColumns().map((col) => (
                    <TableCell key={col.id}>
                      {skeletonCell[col.id] ?? <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-4 py-3">
        <DataTablePagination table={table} />
      </div>

      <ActivityPreviewSheet
        activity={selectedActivity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={selectedActivity ? () => { setSheetOpen(false); handleEdit(selectedActivity) } : undefined}
        onDelete={selectedActivity ? () => { setSheetOpen(false); handleDelete(selectedActivity) } : undefined}
      />

      {editActivity !== null && (
        <CreateActivitySheet
          open
          onOpenChange={(v) => { if (!v) setEditActivity(null) }}
          opportunityId={editActivity.opportunity?.id}
          opportunityName={editActivity.opportunity?.name}
          flowName={editActivity.opportunity?.flow?.name ?? null}
          activity={editActivity}
          onSuccess={(updated) => {
            setEditActivity(null)
            if (updated) {
              setRawItems((prev) => prev.map((r) => r.id === updated.id ? updated : r))
              setData((prev) => prev.map((r) => r.id === updated.id ? mapActivity(updated, timezone) : r))
            } else {
              setLocalRefreshKey((k) => k + 1)
            }
          }}
        />
      )}
    </div>
  )
}
