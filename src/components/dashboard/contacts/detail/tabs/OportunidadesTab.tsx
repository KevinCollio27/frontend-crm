"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { Settings2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon, getInitials } from "@/lib/table-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useIsMobile } from "@/hooks/use-mobile"
import type { OpportunityRaw } from "@/types/opportunity"

// ─── Entity ──────────────────────────────────────────────────────────────────

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

// ─── Map ─────────────────────────────────────────────────────────────────────

function mapOpportunity(d: OpportunityRaw): TabOpportunity {
  const status = d.is_won ? "ganada" : d.is_lost ? "perdida" : d.is_reopened ? "reabierta" : "en_progreso"
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
  en_progreso: { label: "En Progreso", className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"       },
  ganada:      { label: "Ganada",      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  perdida:     { label: "Perdida",     className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"           },
  reabierta:   { label: "Reabierta",   className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"   },
}

const COLUMN_LABELS: Record<string, string> = {
  id:          "ID",
  name:        "Nombre",
  status:      "Estado",
  value:       "Valor",
  closeDate:   "Fecha Cierre",
  responsible: "Responsable",
  createdAt:   "Creada",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  id:          false,
  responsible: false,
  createdAt:   false,
}

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:          false,
  status:      false,
  value:       false,
  closeDate:   false,
  responsible: false,
  createdAt:   false,
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
  id:   <div className="h-3 w-6 animate-pulse rounded bg-muted" />,
  name: (
    <div className="space-y-1.5">
      <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
    </div>
  ),
  status:      <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  value:       <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  closeDate:   <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  responsible: <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  createdAt:   <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:     <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<TabOpportunity>[] = [
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
        <div className="flex items-stretch gap-2.5 min-w-0">
          <EntityAccentBar seed={opp.id} />
          <div className="leading-tight min-w-0">
            <p className="text-sm font-medium truncate">{opp.name}</p>
            <p className="text-xs text-muted-foreground truncate">{opp.flowName} · {opp.stageName}</p>
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
    accessorKey: "value",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Valor {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const opp = row.original
      return (
        <span className={cn("text-sm", opp.value > 0 ? "font-semibold" : "text-muted-foreground")}>
          {formatValue(opp.value, opp.currency)}
        </span>
      )
    },
  },
  {
    accessorKey: "closeDate",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Cierre {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const date: string | null = row.getValue("closeDate")
      return <span className="text-sm text-muted-foreground">{date ?? "—"}</span>
    },
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
          <Avatar size="sm">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="text-[10px] font-medium">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{name}</span>
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
  //           <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
  //             <span className="sr-only">Abrir menú</span>
  //             <MoreHorizontalIcon className="size-4" />
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

// ─── QueryState ───────────────────────────────────────────────────────────────

interface QueryState {
  page:     number
  pageSize: number
  search:   string
}

// ─── Component ────────────────────────────────────────────────────────────────

// Solo lectura por ahora: crear oportunidad exige elegir contacto y organización,
// y no siempre hay una organización obvia para asociar entrando desde acá. Editar/
// Eliminar quedan comentados arriba junto con el resto de las acciones (mismo
// criterio que organizations/detail/tabs/OportunidadesTab.tsx).
interface Props {
  contactId: number
}

export function OportunidadesTab({ contactId }: Props) {
  const [data, setData]       = React.useState<TabOpportunity[]>([])
  const [total, setTotal]     = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch]   = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [query, setQuery]     = React.useState<QueryState>({ page: 1, pageSize: 10, search: "" })
  const [refreshKey, setRefreshKey] = React.useState(0)

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

  // "opportunity" en created/updated/moved trae el registro completo (filtra por
  // person_id) — en deleted el backend solo manda { id }, así que ahí se refresca
  // sin condición (mismo trade-off que en la pestaña de Oportunidades de Organización).
  useEntityRealtime("opportunity", (payload) => {
    if (payload.action === "deleted" || (payload.data as { person_id?: number | null })?.person_id === contactId) {
      setRefreshKey((k) => k + 1)
    }
  })

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, page: 1, search })), 400)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    opportunityService
      .list({ page: query.page, take: query.pageSize, filter: query.search || undefined, personId: contactId })
      .then((page) => {
        if (cancelled) return
        setData(page.data.map(mapOpportunity))
        setTotal(page.total)
      })
      .catch(() => {
        if (!cancelled) { setData([]); setTotal(0) }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [query, contactId, refreshKey])

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
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Toolbar. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          className="h-8 w-full text-sm md:max-w-xs"
          placeholder="Filtrar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="w-full text-sm text-muted-foreground md:w-auto">
            {total} oportunidad{total !== 1 ? "es" : ""}
          </span>
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
                <Settings2Icon className="size-4" />
                Visualización
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
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
          {/* Crear oportunidad deshabilitado por ahora — ver nota en el componente.
          <Button size="sm" className="h-8 gap-1.5 text-xs">
            <PlusIcon className="size-3.5" /> Oportunidad
          </Button>
          */}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
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
                <TableRow key={row.id}>
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
                  Sin oportunidades.
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
