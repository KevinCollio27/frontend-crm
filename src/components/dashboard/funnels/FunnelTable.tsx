"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  CalendarIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  TrendingUpIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon, getInitials } from "@/lib/table-utils"
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
import { opportunityService } from "@/services/opportunity.service"
import type { OpportunityRaw } from "@/types/opportunity"
import { FunnelPreviewSheet } from "./FunnelPreviewSheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ─── Entity ──────────────────────────────────────────────────────────────────

export interface Opportunity {
  id: number
  name: string
  status: string
  stageName: string
  flowName: string
  company: string
  contact: string
  responsible: { name: string; initials: string }
  value: number
  currency: string
  closeDate: string | null
  createdAt: string
}

// ─── Map ─────────────────────────────────────────────────────────────────────

function mapOpportunity(d: OpportunityRaw): Opportunity {
  const status = d.is_won
    ? "ganada"
    : d.is_lost
    ? "perdida"
    : d.is_reopened
    ? "reabierta"
    : "en_progreso"

  const mainResp = d.opportunity_responsible.find((r) => r.is_main) ?? d.opportunity_responsible[0]
  const respName = mainResp?.users?.name ?? "—"

  const originalSale = d.opportunity_net_sales.find((s) => s.is_original) ?? d.opportunity_net_sales[0]

  return {
    id:        d.id,
    name:      d.name,
    status,
    stageName: d.flow_stage?.name ?? "—",
    flowName:  d.flow?.name ?? "—",
    company:   d.organization?.name ?? "—",
    contact:   d.person?.name ?? "—",
    responsible: { name: respName, initials: getInitials(respName) },
    value:     originalSale?.value ?? 0,
    currency:  originalSale?.currency?.symbol ?? "$",
    closeDate: d.planned_clousure_date
      ? new Date(d.planned_clousure_date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
      : null,
    createdAt: new Date(d.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }),
  }
}

// ─── Configs ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  en_progreso: { label: "En Progreso", className: "bg-blue-50 text-blue-700"        },
  ganada:      { label: "Ganada",      className: "bg-emerald-50 text-emerald-700"  },
  perdida:     { label: "Perdida",     className: "bg-red-50 text-red-700"          },
  reabierta:   { label: "Reabierta",   className: "bg-amber-50 text-amber-700"      },
}

function formatValue(value: number, symbol: string) {
  if (value === 0) return "—"
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${symbol}${(value / 1_000).toFixed(0)}K`
  return `${symbol}${value.toLocaleString("es-CL")}`
}

export const COLUMN_LABELS: Record<string, string> = {
  id:                  "ID",
  name:                "Nombre",
  status:              "Estado",
  stageName:           "Etapa",
  responsible:         "Responsable",
  flowName:            "Pipeline",
  closeDate:           "Fecha Cierre",
  value:               "Valor",
  createdAt:           "Creada",
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select:    <div className="size-4 animate-pulse rounded bg-muted" />,
  id:        <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="space-y-1.5">
      <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      <div className="h-3 w-28 animate-pulse rounded bg-muted" />
    </div>
  ),
  status:      <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  stageName:   <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  responsible: <div className="h-4 w-28 animate-pulse rounded bg-muted" />,
  flowName:    <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  closeDate:   <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  value:       <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  createdAt:   <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:     <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  flowName:  false,
  closeDate: false,
  value:     false,
  createdAt: false,
}

// ─── QueryState ───────────────────────────────────────────────────────────────

interface QueryState {
  page:     number
  pageSize: number
  search:   string
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function getColumns(
  onPreview: (opp: Opportunity) => void,
  onDetail:  (opp: Opportunity) => void,
): ColumnDef<Opportunity>[] {
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
      enableHiding:  false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          ID {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">{row.getValue("id")}</span>
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
        const opp = row.original
        return (
          <div className="leading-tight min-w-0">
            <span className="text-sm font-medium truncate">{opp.name}</span>
            <div className="mt-0.5 text-xs text-muted-foreground truncate">
              {opp.company} · {opp.contact}
            </div>
          </div>
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
        const cfg = STATUS_CONFIG[row.getValue("status") as string] ?? STATUS_CONFIG.en_progreso
        return (
          <Badge className={cn("rounded-full border-0 text-xs px-2 py-0", cfg.className)}>
            {cfg.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "stageName",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Etapa {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm">{row.getValue("stageName")}</span>,
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
        const { name, initials } = row.original.responsible
        return (
          <div className="flex items-center gap-2">
            <Avatar className="default">
              <AvatarImage src="https://github.com/shadcn.png" alt={name} />
              <AvatarFallback className="text-[10px] font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "flowName",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Pipeline {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("flowName")}</span>,
    },
    {
      accessorKey: "closeDate",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Fecha Cierre {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const date: string | null = row.getValue("closeDate")
        return date ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarIcon className="size-3.5 shrink-0" />
            {date}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "value",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Valor {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const opp = row.original
        return (
          <span className={cn("text-sm", opp.value > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
            {formatValue(opp.value, opp.currency)}
          </span>
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
        <span className="text-sm text-muted-foreground">{row.getValue("createdAt")}</span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const opp = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onDetail(opp)}>
                  <ExternalLinkIcon />
                  Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview(opp)}>
                  <TrendingUpIcon />
                  Vista Previa
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PencilIcon />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2Icon />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

// ─── FunnelTable ──────────────────────────────────────────────────────────────

interface FunnelTableProps {
  search:                   string
  statusFilter:             string
  flowId:                   number | null
  columnVisibility:         VisibilityState
  onColumnVisibilityChange: React.Dispatch<React.SetStateAction<VisibilityState>>
  onTotalChange:            (n: number) => void
}

export function FunnelTable({
  search: searchProp,
  statusFilter,
  flowId,
  columnVisibility,
  onColumnVisibilityChange,
  onTotalChange,
}: FunnelTableProps) {
  const router = useRouter()

  const [data, setData]       = React.useState<Opportunity[]>([])
  const [total, setTotal]     = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const [query, setQuery] = React.useState<QueryState>({ page: 1, pageSize: 20, search: searchProp })

  // Reset page when flowId changes
  React.useEffect(() => {
    setQuery((q) => ({ ...q, page: 1 }))
  }, [flowId])

  const [sorting, setSorting]           = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedOpp, setSelectedOpp]   = React.useState<Opportunity | null>(null)
  const [sheetOpen, setSheetOpen]       = React.useState(false)

  // Sync search prop → query with debounce
  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, page: 1, search: searchProp })), 400)
    return () => clearTimeout(t)
  }, [searchProp])

  // Fetch
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    opportunityService
      .list({ page: query.page, take: query.pageSize, filter: query.search || undefined, flow_id: flowId ?? undefined })
      .then((page) => {
        if (cancelled) return
        setData(page.data.map(mapOpportunity))
        setTotal(page.total)
        onTotalChange(page.total)
      })
      .catch(() => {
        if (!cancelled) { setData([]); setTotal(0) }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [query])

  const visibleData = React.useMemo(() => {
    if (statusFilter === "all") return data
    return data.filter((d) => {
      if (statusFilter === "won")  return d.status === "ganada"
      if (statusFilter === "lost") return d.status === "perdida"
      if (statusFilter === "open") return d.status === "en_progreso" || d.status === "reabierta"
      return true
    })
  }, [data, statusFilter])

  const columns = React.useMemo(
    () => getColumns(
      (opp) => { setSelectedOpp(opp); setSheetOpen(true) },
      (opp) => router.push(`/crm/funnels/${opp.id}`),
    ),
    [router],
  )

  const table = useReactTable({
    data: visibleData,
    columns,
    manualPagination: true,
    rowCount: total,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: query.page - 1, pageSize: query.pageSize },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: onColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function"
        ? updater({ pageIndex: query.page - 1, pageSize: query.pageSize })
        : updater
      setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
              Array.from({ length: query.pageSize }).map((_, i) => (
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

      {/* Pagination */}
      <div className="px-4 py-3">
        <DataTablePagination table={table} />
      </div>

      <FunnelPreviewSheet
        deal={selectedOpp}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
