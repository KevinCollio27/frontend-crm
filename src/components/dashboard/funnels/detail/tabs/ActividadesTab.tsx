"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDown,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon, getInitials } from "@/lib/table-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { activityService } from "@/services/activity.service"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ActivityRaw } from "@/types/activity"
import { CreateActivitySheet } from "@/components/dashboard/activities/CreateActivitySheet"

// ─── Entity ───────────────────────────────────────────────────────────────────

interface TabActivity {
  id:                 number
  title:              string
  type:               string
  isCompleted:        boolean
  dateFrom:           string | null
  responsible:        string
  responsibleAvatarUrl: string | null
  ubication:          string | null
  createdAt:          string
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function mapActivity(d: ActivityRaw): TabActivity {
  const type = d.opportunity_activity_detail
    ?.find((det) => det.label?.key === "activity_type")?.value ?? "Actividad"
  return {
    id:          d.id,
    title:       d.title ?? "Sin título",
    type,
    isCompleted: d.status === "completada",
    dateFrom:    d.date_from
      ? new Date(d.date_from).toLocaleDateString("es-CL", {
          day: "numeric", month: "short", year: "numeric",
        }) + " · " + new Date(d.date_from).toLocaleTimeString("es-CL", {
          hour: "2-digit", minute: "2-digit",
        })
      : null,
    responsible: d.user?.name ?? "—",
    responsibleAvatarUrl: d.user?.avatar_url ?? null,
    ubication:   d.ubication,
    createdAt:   new Date(d.created_at).toLocaleDateString("es-CL", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  id:          "ID",
  title:       "Título",
  dateFrom:    "Fecha",
  responsible: "Responsable",
  status:      "Estado",
  ubication:   "Ubicación",
  createdAt:   "Creada",
}

const DEFAULT_VISIBILITY: VisibilityState = {
  dateFrom:  false,
  status:    false,
  ubication: false,
  createdAt: false,
}

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:          false,
  dateFrom:    false,
  status:      false,
  responsible: false,
  ubication:   false,
  createdAt:   false,
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select:      <div className="size-4 animate-pulse rounded bg-muted" />,
  id:          <div className="h-3 w-6 animate-pulse rounded bg-muted" />,
  title: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  dateFrom:    <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />,
  responsible: (
    <div className="flex items-center gap-2">
      <div className="size-6 animate-pulse rounded-full bg-muted" />
      <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
    </div>
  ),
  actions:     <div className="size-7 animate-pulse rounded bg-muted" />,
}

function TableSkeleton({ columns }: { columns: ColumnDef<TabActivity>[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {columns.map((col) => (
            <TableCell key={col.id ?? (col as any).accessorKey}>
              {skeletonCell[col.id ?? (col as any).accessorKey] ?? (
                <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(opts: {
  onEdit:   (row: TabActivity) => void
  onDelete: (row: TabActivity) => void
}): ColumnDef<TabActivity>[] {
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
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue("id")}</span>
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
        const title = row.getValue("title") as string
        const type  = row.original.type
        return (
          <div className="flex items-stretch gap-2.5">
            <EntityAccentBar seed={row.original.id} />
            <div className="leading-tight">
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">{type}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "dateFrom",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Fecha {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{(row.getValue("dateFrom") as string) ?? "—"}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const completed = row.original.isCompleted
        return (
          <Badge className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs",
            completed
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}>
            {completed ? "Completada" : "Pendiente"}
          </Badge>
        )
      },
    },
    {
      id: "responsible",
      accessorFn: (row) => row.responsible,
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Responsable {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-6 shrink-0">
            <AvatarImage src={row.original.responsibleAvatarUrl ?? "https://github.com/shadcn.png"} alt={row.original.responsible} />
            <AvatarFallback className="text-[9px] font-semibold">
              {getInitials(row.original.responsible)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{row.original.responsible}</span>
        </div>
      ),
    },
    {
      accessorKey: "ubication",
      header: "Ubicación",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{(row.getValue("ubication") as string) ?? "—"}</div>
      ),
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => opts.onEdit(row.original)}>
                <PencilIcon /> Editar
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => opts.onDelete(row.original)}
            >
              <Trash2Icon /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  opportunityId:   number
  opportunityName: string
  flowName:        string | null
}

export function ActividadesTab({ opportunityId, opportunityName, flowName }: Props) {
  const [data, setData]         = React.useState<TabActivity[]>([])
  const [rawData, setRawData]   = React.useState<ActivityRaw[]>([])
  const rawDataRef              = React.useRef<ActivityRaw[]>([])
  const [loading, setLoading]   = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editActivity, setEditActivity] = React.useState<ActivityRaw | null>(null)
  const [sorting, setSorting]   = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_VISIBILITY)
  const [rowSelection, setRowSelection] = React.useState({})

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

  React.useEffect(() => { rawDataRef.current = rawData }, [rawData])

  // A diferencia de Organización/Contacto (donde "activity" no se puede filtrar por
  // no traer id del padre), acá SÍ es el padre directo: opportunity_activity.opportunity_id
  // viene en el payload en las 3 acciones, incluido deleted.
  useEntityRealtime("activity", (payload) => {
    const changedOppId = (payload.data as { opportunity_id?: number | null })?.opportunity_id
    if (changedOppId !== opportunityId) return
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    activityService
      .list({ opportunityId, take: 100 })
      .then((res) => {
        if (cancelled) return
        setRawData(res.data)
        setData(res.data.map(mapActivity))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [opportunityId, refreshKey])

  const handleEdit = React.useCallback((row: TabActivity) => {
    const raw = rawDataRef.current.find((r) => r.id === row.id) ?? null
    setEditActivity(raw)
  }, [])

  const handleDelete = React.useCallback(async (row: TabActivity) => {
    const confirmed = await orgConfirm.delete(row.title)
    if (!confirmed) return

    setData((prev) => prev.filter((r) => r.id !== row.id))
    setRawData((prev) => prev.filter((r) => r.id !== row.id))
    rawDataRef.current = rawDataRef.current.filter((r) => r.id !== row.id)

    const t0 = Date.now()
    console.log(`[activity-opp] delete start id=${row.id}`)
    activityService.delete(row.id)
      .then(() => {
        console.log(`[activity-opp] delete OK → ${Date.now() - t0}ms`)
        notify.success({ title: "Actividad eliminada", description: `"${row.title}" fue eliminada.` })
      })
      .catch(() => {
        setRefreshKey((k) => k + 1)
        notify.error({ title: "Algo salió mal", description: "No se pudo eliminar la actividad." })
      })
  }, [])

  const columns = React.useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete]
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange:          setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:     setRowSelection,
    getCoreRowModel:          getCoreRowModel(),
    getPaginationRowModel:    getPaginationRowModel(),
    getSortedRowModel:        getSortedRowModel(),
    state: { sorting, columnVisibility, rowSelection },
  })

  return (
    <div className="p-4">

      {/* Toolbar. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 pb-4 md:flex-row md:items-center">
        <Input
          className="h-8 w-full text-sm md:max-w-45"
          placeholder="Filtrar por título..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
        />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          {!loading && (
            <span className="w-full text-sm text-muted-foreground md:w-auto">
              {table.getFilteredRowModel().rows.length} actividad(es)
            </span>
          )}
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs" />}>
                Columnas <ChevronDown className="ml-1 size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {COLUMN_LABELS[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" className="h-8 w-full gap-1.5 text-xs md:w-auto" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-3.5" /> Actividad
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-md border">
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
              <TableSkeleton columns={table.getVisibleLeafColumns().map((c) => ({ id: c.id, accessorKey: (c.columnDef as any).accessorKey }))} />
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
                  Sin actividades registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="pt-4">
          <DataTablePagination table={table} />
        </div>
      )}

      {/* Sheets */}
      {createOpen && (
        <CreateActivitySheet
          open
          onOpenChange={setCreateOpen}
          opportunityId={opportunityId}
          opportunityName={opportunityName}
          flowName={flowName}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {editActivity !== null && (
        <CreateActivitySheet
          open
          onOpenChange={(v) => { if (!v) setEditActivity(null) }}
          opportunityId={opportunityId}
          opportunityName={opportunityName}
          flowName={flowName}
          activity={editActivity}
          onSuccess={(updated) => {
            setEditActivity(null)
            if (updated) {
              setRawData((prev) => prev.map((r) => r.id === updated.id ? updated : r))
              rawDataRef.current = rawDataRef.current.map((r) => r.id === updated.id ? updated : r)
              setData((prev) => prev.map((r) => r.id === updated.id ? mapActivity(updated) : r))
            } else {
              setRefreshKey((k) => k + 1)
            }
          }}
        />
      )}

    </div>
  )
}
