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
  ChevronDown,
  CopyIcon,
  EyeIcon,
  MailIcon,
  MoreHorizontal,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import * as React from "react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getSortIcon } from "@/lib/table-utils"
import { cn } from "@/lib/utils"
import { campaignService } from "@/services/campaign.service"
import type { CampaignRaw } from "@/types/campaign"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: number
  name: string
  subject: string
  audienceFilter: string
  status: string
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  sentAt: string | null
  createdAt: string
  createdBy: string
}

function mapCampaign(d: CampaignRaw): Campaign {
  return {
    id: d.id,
    name: d.name,
    subject: d.subject,
    audienceFilter: d.audience_filter,
    status: d.status,
    sentCount: d.sent_count,
    deliveredCount: d.delivered_count,
    openedCount: d.opened_count,
    clickedCount: d.clicked_count,
    sentAt: d.sent_at,
    createdAt: d.created_at,
    createdBy: d.user.name,
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  sent:       { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",      label: "Enviada"    },
  draft:      { dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Borrador"   },
  processing: { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",            label: "Procesando" },
  partial:    { dot: "bg-orange-500",  badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",         label: "Parcial"    },
  failed:     { dot: "bg-red-500",     badge: "bg-red-500/10 text-red-600 dark:text-red-400",                  label: "Fallida"    },
}

const audienceConfig: Record<string, { label: string; badge: string }> = {
  all:          { label: "General",      badge: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"             },
  recent:       { label: "Recientes",    badge: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"         },
  specific:     { label: "Específica",   badge: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
  organization: { label: "Organización", badge: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
  custom_list:  { label: "Lista custom", badge: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400"         },
}

const columnLabels: Record<string, string> = {
  id:             "ID",
  name:           "Nombre",
  audienceFilter: "Audiencia",
  status:         "Estado",
  sentCount:      "Métricas",
  deliveredCount: "Entregados",
  createdBy:      "Creado por",
  createdAt:      "Fecha",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  deliveredCount: false,
  createdBy: false,
}

// ─── QueryState ───────────────────────────────────────────────────────────────

type QueryState = {
  page: number
  pageSize: number
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select:        <div className="size-4 animate-pulse rounded bg-muted" />,
  id:            <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-md bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  audienceFilter: <div className="h-5 w-20 animate-pulse rounded bg-muted" />,
  status:         <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />,
  sentCount: (
    <div className="space-y-1.5">
      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      <div className="h-3 w-36 animate-pulse rounded bg-muted" />
    </div>
  ),
  deliveredCount: <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  createdAt: (
    <div className="space-y-1.5">
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="h-3 w-14 animate-pulse rounded bg-muted" />
    </div>
  ),
  createdBy:     <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  actions:       <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: ColumnDef<Campaign>[] = [
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
      <div className="text-muted-foreground text-xs">#{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Nombre {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("name")
      const subject = row.original.subject
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <MailIcon className="size-3.5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{subject}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "audienceFilter",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Audiencia {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const v: string = row.getValue("audienceFilter")
      const cfg = audienceConfig[v]
      return (
        <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", cfg?.badge ?? "bg-muted text-muted-foreground")}>
          {cfg?.label ?? v}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Estado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const s: string = row.getValue("status")
      const cfg = statusConfig[s]
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", cfg?.badge ?? "bg-muted text-muted-foreground")}>
          <span className={cn("size-1.5 rounded-full", cfg?.dot ?? "bg-muted-foreground")} />
          {cfg?.label ?? s}
        </span>
      )
    },
  },
  {
    accessorKey: "sentCount",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Métricas {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const { status, sentCount, openedCount, clickedCount } = row.original
      if (status === "draft" || status === "failed") {
        return <div className="text-xs text-muted-foreground">—</div>
      }
      return (
        <div className="leading-tight">
          <div className="text-sm font-medium">{sentCount.toLocaleString()} enviados</div>
          <div className="text-xs text-muted-foreground">
            {openedCount.toLocaleString()} abiertos · {clickedCount.toLocaleString()} clics
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "deliveredCount",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Entregados {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const v: number = row.getValue("deliveredCount")
      return <div className="text-sm">{v > 0 ? v.toLocaleString() : "—"}</div>
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Fecha {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const { sentAt, createdAt } = row.original
      const date = sentAt ?? createdAt
      return (
        <div className="leading-tight">
          <div className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div className="text-xs text-muted-foreground/60">{sentAt ? "Enviada" : "Creada"}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "createdBy",
    header: "Creado por",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("createdBy")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem>
              <EyeIcon /> Ver campaña
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CopyIcon /> Duplicar
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Trash2Icon /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function CampaignsTable() {
  const [data, setData] = React.useState<Campaign[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState<QueryState>({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [rowSelection, setRowSelection] = React.useState({})

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    campaignService
      .list({ page: query.page, limit: query.pageSize })
      .then((res) => {
        if (cancelled) return
        setData(res.data.map(mapCampaign))
        setTotal(res.total)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [query])

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

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 py-4">
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {loading ? "…" : `${total} campañas`}
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
            <PlusIcon className="size-4" /> Crear Campaña
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
    </div>
  )
}
