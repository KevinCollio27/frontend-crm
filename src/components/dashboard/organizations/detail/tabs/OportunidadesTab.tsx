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
import { ChevronDown } from "lucide-react"
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
import { opportunityService } from "@/services/opportunity.service"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { OpportunityRaw } from "@/types/opportunity"

// ─── Entity ───────────────────────────────────────────────────────────────────

interface TabOpportunity {
  id:          number
  name:        string
  stageName:   string
  flowName:    string
  status:      string
  value:       number
  currency:    string
  closeDate:   string | null
  responsible: string
  createdAt:   string
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function mapOpportunity(d: OpportunityRaw): TabOpportunity {
  const status   = d.is_won ? "ganada" : d.is_lost ? "perdida" : d.is_reopened ? "reabierta" : "en_progreso"
  const mainResp = d.opportunity_responsible.find((r) => r.is_main) ?? d.opportunity_responsible[0]
  const sale     = d.opportunity_net_sales[0]
  return {
    id:          d.id,
    name:        d.name,
    stageName:   d.flow_stage?.name ?? "—",
    flowName:    d.flow?.name ?? "—",
    status,
    value:       sale?.value ?? 0,
    currency:    sale?.currency?.symbol ?? "$",
    closeDate:   d.planned_clousure_date
      ? new Date(d.planned_clousure_date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
      : null,
    responsible: mainResp?.users?.name ?? "—",
    createdAt:   new Date(d.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }),
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  en_progreso: { label: "Abierta",   className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"         },
  ganada:      { label: "Ganada",    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  perdida:     { label: "Perdida",   className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"             },
  reabierta:   { label: "Reabierta", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"     },
}

const COLUMN_LABELS: Record<string, string> = {
  id:          "ID",
  name:        "Nombre",
  stageName:   "Etapa",
  status:      "Estado",
  value:       "Valor",
  closeDate:   "Cierre",
  responsible: "Responsable",
  createdAt:   "Creada",
}

const DEFAULT_VISIBILITY: VisibilityState = {
  value: false,
  stageName: false,
  closeDate: false,
  createdAt: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: number, symbol: string) {
  if (value === 0) return "—"
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${symbol}${(value / 1_000).toFixed(0)}K`
  return `${symbol}${value.toLocaleString("es-CL")}`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select:      <div className="size-4 animate-pulse rounded bg-muted" />,
  id:          <div className="h-3 w-6 animate-pulse rounded bg-muted" />,
  name: (
    <div className="space-y-1.5">
      <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
    </div>
  ),
  stageName:   <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />,
  status:      <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />,
  value:       <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />,
  closeDate:   <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />,
  responsible: <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />,
  createdAt:   <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />,
  actions:     <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<TabOpportunity>[] = [
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
      <span className="font-mono text-xs text-muted-foreground">{row.getValue("id")}</span>
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
        <div className="flex items-stretch gap-2.5 min-w-0">
          <EntityAccentBar seed={opp.id} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{opp.name}</p>
            <p className="truncate text-xs text-muted-foreground">{opp.flowName}</p>
          </div>
        </div>
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
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("stageName")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const cfg = STATUS_CONFIG[row.getValue("status") as string] ?? STATUS_CONFIG.en_progreso
      return (
        <Badge className={cn("rounded-full border-0 px-2 py-0.5 text-xs", cfg.className)}>
          {cfg.label}
        </Badge>
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
        <span className={cn("text-sm", opp.value > 0 ? "font-semibold text-emerald-600" : "text-muted-foreground")}>
          {formatValue(opp.value, opp.currency)}
        </span>
      )
    },
  },
  {
    accessorKey: "closeDate",
    header: "Cierre",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{(row.getValue("closeDate") as string | null) ?? "—"}</span>
    ),
  },
  {
    accessorKey: "responsible",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Responsable {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("responsible")
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-6 shrink-0">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="text-[9px] font-semibold">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Creada",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("createdAt")}</span>
    ),
  },
  // Editar/Eliminar deshabilitados por ahora — ver nota en el componente.
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const opp = row.original
  //     return (
  //       <div className="flex justify-end">
  //         <DropdownMenu>
  //           <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
  //             <span className="sr-only">Abrir menú</span>
  //             <MoreHorizontal className="size-4" />
  //           </DropdownMenuTrigger>
  //           <DropdownMenuContent align="end" className="min-w-44">
  //             <DropdownMenuGroup>
  //               <DropdownMenuLabel>{opp.name}</DropdownMenuLabel>
  //               <DropdownMenuItem><PencilIcon /> Editar</DropdownMenuItem>
  //             </DropdownMenuGroup>
  //             <DropdownMenuSeparator />
  //             <DropdownMenuItem className="text-destructive focus:text-destructive">
  //               <Trash2Icon /> Eliminar
  //             </DropdownMenuItem>
  //           </DropdownMenuContent>
  //         </DropdownMenu>
  //       </div>
  //     )
  //   },
  // },
]

// ─── Component ────────────────────────────────────────────────────────────────

// Solo lectura por ahora: crear oportunidad exige elegir contacto y organización,
// y no siempre hay un contacto obvio para asociar entrando desde acá. Editar/Eliminar
// quedan comentados arriba junto con el resto de las acciones hasta resolver ese flujo.
interface Props { orgId: number }

export function OportunidadesTab({ orgId }: Props) {
  const [data, setData]             = React.useState<TabOpportunity[]>([])
  const [total, setTotal]           = React.useState(0)
  const [loading, setLoading]       = React.useState(true)
  const [search, setSearch]         = React.useState("")
  const [sorting, setSorting]       = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_VISIBILITY)
  const [query, setQuery]           = React.useState({ page: 1, pageSize: 10, search: "" })
  const [refreshKey, setRefreshKey] = React.useState(0)

  // "deleted" solo trae { id } (sin organization_id) — no se puede filtrar,
  // así que ahí refresca sin condición; created/updated/moved sí filtran por org.
  useEntityRealtime("opportunity", (payload) => {
    if (payload.action !== "deleted") {
      const changedOrgId = (payload.data as { organization_id?: number | null })?.organization_id
      if (changedOrgId !== orgId) return
    }
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, page: 1, search })), 400)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    opportunityService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        organizationId: orgId,
      })
      .then((res) => {
        if (cancelled) return
        setData(res.data.map(mapOpportunity))
        setTotal(res.total)
      })
      .catch(() => { if (!cancelled) { setData([]); setTotal(0) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query, orgId, refreshKey])

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    rowCount: total,
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex: query.page - 1, pageSize: query.pageSize },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function"
        ? updater({ pageIndex: query.page - 1, pageSize: query.pageSize })
        : updater
      setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-col gap-3 p-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-8 max-w-45 text-sm"
          placeholder="Filtrar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {total} oportunidad{total !== 1 ? "es" : ""}
          </span>
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
          {/* Crear oportunidad deshabilitado por ahora — ver nota en el componente.
          <Button size="sm" className="h-8 gap-1.5 text-xs">
            <PlusIcon className="size-3.5" /> Oportunidad
          </Button>
          */}
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
              Array.from({ length: query.pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {table.getVisibleLeafColumns().map((col) => (
                    <TableCell key={col.id}>
                      {skeletonCell[col.id] ?? <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />}
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
                  Sin oportunidades vinculadas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}
