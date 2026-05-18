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
  ChevronDown,
  ExternalLinkIcon,
  MinusIcon,
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { ActivityPreviewSheet } from "./ActivityPreviewSheet"
import { activityService } from "@/services/activity.service"
import type { ActivityRaw } from "@/types/activity"
import { getInitials, getSortIcon } from "@/lib/table-utils"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Activity {
  id: number
  title: string
  type: string
  priority: string
  startDate: string
  endDate: string
  stageId: string
  createdAt: string
  responsible: { name: string; initials: string; avatar?: string }
  opportunityName: string
  funnelName: string
}

function mapActivity(d: ActivityRaw): Activity {
  const typeDetail     = d.opportunity_activity_detail.find((det) => det.label?.key === "activity_type")
  const priorityDetail = d.opportunity_activity_detail.find((det) => det.label?.key === "priority")
  return {
    id:              d.id,
    title:           d.title ?? "",
    type:            typeDetail?.option ?? "",
    priority:        priorityDetail?.option?.toLowerCase() ?? "",
    startDate:       d.date_from ? d.date_from.slice(0, 10) : "",
    endDate:         d.date_to   ? d.date_to.slice(0, 10)   : "",
    stageId:         d.is_completed ? "completada" : "pendiente",
    createdAt:       (d.created_at ?? "").slice(0, 10),
    responsible: {
      name:     d.user?.name ?? "—",
      initials: getInitials(d.user?.name ?? ""),
    },
    opportunityName: d.opportunity?.name ?? "",
    funnelName:      d.opportunity?.flow?.name ?? "",
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

const PRIORITY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  alta:  { icon: <ArrowUpIcon className="size-3" />,   color: "text-red-600"          },
  media: { icon: <MinusIcon className="size-3" />,     color: "text-yellow-600"       },
  baja:  { icon: <ArrowDownIcon className="size-3" />, color: "text-muted-foreground" },
}

const STAGE_CONFIG: Record<string, { dot: string; badge: string }> = {
  pendiente:  { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600"     },
  completada: { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600" },
}

const STAGE_NAMES: Record<string, string> = {
  pendiente:  "Pendiente",
  completada: "Completada",
}

const columnLabels: Record<string, string> = {
  id:              "ID",
  title:           "Título",
  type:            "Tipo",
  startDate:       "Período",
  stageId:         "Estado / Prioridad",
  responsible:     "Responsable",
  opportunityName: "Oportunidad",
  createdAt:       "Creada",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  opportunityName: false,
  createdAt:       false,
}

// ─── QueryState ───────────────────────────────────────────────────────────────

type QueryState = {
  page: number
  pageSize: number
  search: string
  isCompleted: boolean | null
}

// ─── SimpleFilter ─────────────────────────────────────────────────────────────

function SimpleFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: { label: string; value: string }[]
  onChange: (v: string | null) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="outline" size="sm" className={cn("h-8 gap-1", value && "border-primary/50 bg-primary/5")} />
      }>
        {label}
        {value && <span className="ml-1 text-primary">·</span>}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-32">
        {value && (
          <DropdownMenuItem onClick={() => onChange(null)}>
            <XIcon className="size-3.5" /> Todos
          </DropdownMenuItem>
        )}
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value === value ? null : opt.value)}
            className={opt.value === value ? "font-medium" : ""}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select: <div className="size-4 animate-pulse rounded bg-muted" />,
  id:     <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  title:  <div className="h-4 w-48 animate-pulse rounded bg-muted" />,
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
  opportunityName: <div className="h-4 w-32 animate-pulse rounded bg-muted" />,
  createdAt:       <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:         <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function getColumns(
  onPreview: (activity: Activity) => void,
  onDetail: (activity: Activity) => void
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
      cell: ({ row }) => (
        <div className="text-sm font-medium">{row.getValue("title")}</div>
      ),
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
              <AvatarImage src="https://github.com/shadcn.png" alt={r.name} />
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
      accessorKey: "opportunityName",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Oportunidad {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {(row.getValue("opportunityName") as string) || "—"}
        </div>
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
                <DropdownMenuItem>
                  <PencilIcon /> Editar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
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

export function ActivitiesTable() {
  const router = useRouter()
  const [data, setData] = React.useState<Activity[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    isCompleted: null,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      activityService
        .list({
          page: query.page,
          take: query.pageSize,
          filter: query.search || undefined,
          is_completed: query.isCompleted !== null ? query.isCompleted : undefined,
        })
        .then((res) => {
          if (cancelled) return
          setData(res.data.map(mapActivity))
          setTotal(res.total)
          setLoading(false)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })
    }, query.search ? 400 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const columns = React.useMemo(
    () => getColumns(
      (activity) => { setSelectedActivity(activity); setSheetOpen(true) },
      (activity) => router.push(`/crm/activities/${activity.id}`)
    ),
    [router]
  )

  const table = useReactTable({
    data,
    columns,
    rowCount: total,
    manualPagination: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
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

  const statusFilterValue =
    query.isCompleted === true ? "true" : query.isCompleted === false ? "false" : null

  const hasFilters = !!query.search || query.isCompleted !== null

  return (
    <div className="w-full p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-4">
        <Input
          className="max-w-sm h-8"
          placeholder="Buscar actividades..."
          value={query.search}
          onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))}
        />
        <SimpleFilter
          label="Estado"
          value={statusFilterValue}
          options={[
            { label: "Pendiente",  value: "false" },
            { label: "Completada", value: "true"  },
          ]}
          onChange={(v) =>
            setQuery((q) => ({
              ...q,
              page: 1,
              isCompleted: v === "true" ? true : v === "false" ? false : null,
            }))
          }
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setQuery((q) => ({ ...q, search: "", isCompleted: null, page: 1 }))}
          >
            Reset <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {loading ? "…" : `${total} actividades`}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Columnas <ChevronDown className="ml-2 size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {columnLabels[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <PlusIcon className="size-4" /> Crear Actividad
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
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

      <div className="py-4">
        <DataTablePagination table={table} />
      </div>

      <ActivityPreviewSheet
        activity={selectedActivity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
