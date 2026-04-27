"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDown,
  ArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  TrendingUpIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
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
import { FunnelPreviewSheet } from "./FunnelPreviewSheet"
import { DEALS, Funnel, STAGES, type Deal, type DealStatus, type Priority } from "./data"

// ─── Configs ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  alta:  { label: "Alta",   className: "bg-red-50 text-red-700"         },
  media: { label: "Media",  className: "bg-amber-50 text-amber-700"     },
  baja:  { label: "Baja",   className: "bg-emerald-50 text-emerald-700" },
}

const STATUS_CONFIG: Record<DealStatus, { label: string; className: string }> = {
  open: { label: "Abierta", className: "bg-blue-50 text-blue-700"       },
  won:  { label: "Ganada",  className: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Perdida", className: "bg-red-50 text-red-600"         },
}

function formatValue(value: number) {
  if (value === 0) return "No aplica"
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString("es-CL")}`
}

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc")  return <ArrowUpIcon   className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon  className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

const COLUMN_LABELS: Record<string, string> = {
  name:        "Nombre",
  value:       "Valor",
  stageId:     "Etapa",
  priority:    "Prioridad",
  status:      "Estado",
  responsible: "Responsable",
  closeDate:   "Cierre",
}

// ─── Column definitions ──────────────────────────────────────────────────────

function getColumns(onPreview: (deal: Deal) => void, onDetail: (deal: Deal) => void): ColumnDef<Deal>[] {
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
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Nombre {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const deal = row.original
      return (
        <div className="leading-tight min-w-0">
          <div className="text-sm font-medium truncate">{deal.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {deal.company} · {deal.contact}
          </div>
        </div>
      )
    },
    filterFn: (row, _id, value: string) => {
      const q = value.toLowerCase()
      return (
        row.original.name.toLowerCase().includes(q)    ||
        row.original.company.toLowerCase().includes(q) ||
        row.original.contact.toLowerCase().includes(q)
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
      const value: number = row.getValue("value")
      return (
        <div className={cn("text-sm", value > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
          {formatValue(value)}
        </div>
      )
    },
  },
  {
    accessorKey: "stageId",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Etapa {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const stageId: string = row.getValue("stageId")
      const stage = STAGES.find((s) => s.id === stageId)
      return <div className="text-sm">{stage?.name ?? stageId}</div>
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Prioridad {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const priority: Priority = row.getValue("priority")
      const cfg = PRIORITY_CONFIG[priority]
      return (
        <Badge className={cn("rounded-full border-0 text-xs px-2 py-0", cfg.className)}>
          {cfg.label}
        </Badge>
      )
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Estado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const status: DealStatus = row.getValue("status")
      const cfg = STATUS_CONFIG[status]
      return (
        <Badge className={cn("rounded-full border-0 text-xs px-2 py-0", cfg.className)}>
          {cfg.label}
        </Badge>
      )
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    id: "responsible",
    accessorFn: (row) => row.responsible.initials,
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Responsable {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const { name, initials, avatar } = row.original.responsible
      return (
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 overflow-hidden rounded-full bg-primary/10">
            {avatar ? (
              <img src={avatar} alt={name} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary">
                {initials}
              </span>
            )}
          </div>
          <span className="text-sm">{name}</span>
        </div>
      )
    },
    filterFn: (row, _id, value: string[]) => value.includes(row.original.responsible.initials),
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
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const deal = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onDetail(deal)}>
                <ExternalLinkIcon />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview(deal)}>
                <UserIcon />
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

// ─── Responsible options ─────────────────────────────────────────────────────

const responsibleOptions = (() => {
  const seen = new Set<string>()
  return DEALS.filter((d) => {
    if (seen.has(d.responsible.initials)) return false
    seen.add(d.responsible.initials)
    return true
  }).map((d) => ({ value: d.responsible.initials, label: d.responsible.name }))
})()

// ─── FunnelTable ─────────────────────────────────────────────────────────────

interface FunnelTableProps {
  deals: Deal[]
}

export function FunnelTable({ deals }: FunnelTableProps) {
  const router = useRouter()
  const [sorting, setSorting]               = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters]   = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection]     = React.useState({})
  const [selectedDeal, setSelectedDeal]     = React.useState<Deal | null>(null)
  const [sheetOpen, setSheetOpen]           = React.useState(false)

  const columns = React.useMemo(
    () => getColumns(
      (deal) => { setSelectedDeal(deal); setSheetOpen(true) },
      (deal) => router.push(`/crm/funnels/${deal.id}`)
    ),
    [router]
  );

  const table = useReactTable({
    data: deals,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Toolbar — sticky so it stays visible while scrolling */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-3">
        <div className="relative w-52 shrink-0">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar oportunidad..."
            className="h-8 pl-8 text-xs"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          />
        </div>

        <DataTableFacetedFilter
          column={table.getColumn("stageId")!}
          title="Etapa"
          options={STAGES.map((s) => ({ value: s.id, label: s.name }))}
        />
        <DataTableFacetedFilter
          column={table.getColumn("status")!}
          title="Estado"
          options={[
            { value: "open",  label: "Abierta" },
            { value: "won",   label: "Ganada"  },
            { value: "lost",  label: "Perdida" },
          ]}
        />
        <DataTableFacetedFilter
          column={table.getColumn("responsible")!}
          title="Responsable"
          options={responsibleOptions}
        />
        <DataTableFacetedFilter
          column={table.getColumn("priority")!}
          title="Prioridad"
          options={[
            { value: "alta",  label: "Alta"  },
            { value: "media", label: "Media" },
            { value: "baja",  label: "Baja"  },
          ]}
        />

        {columnFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => table.resetColumnFilters()}
          >
            <XIcon className="size-3.5" />
            Restablecer
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} oportunidades
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
              Columnas <ChevronDownIcon className="ml-1.5 size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
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
      </div>

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
            {table.getRowModel().rows.length ? (
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
        deal={selectedDeal}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
