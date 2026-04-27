"use client"

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
  ChevronDown,
  FileTextIcon,
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { cn } from "@/lib/utils"
import type { DealDetail, DealQuotation, QuotationStatus } from "../../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

const STATUS_CONFIG: Record<QuotationStatus, { label: string; className: string }> = {
  borrador:  { label: "Borrador",  className: "bg-muted text-muted-foreground border-border"              },
  enviada:   { label: "Enviada",   className: "bg-blue-50 text-blue-700 border-blue-200"                  },
  aceptada:  { label: "Aceptada",  className: "bg-emerald-50 text-emerald-700 border-emerald-200"          },
  rechazada: { label: "Rechazada", className: "bg-red-50 text-red-600 border-red-200"                     },
}

const TYPE_CONFIG: Record<"sale" | "purchase", { label: string; className: string }> = {
  sale:     { label: "Venta",  className: "bg-violet-50 text-violet-700 border-violet-200" },
  purchase: { label: "Compra", className: "bg-orange-50 text-orange-700 border-orange-200" },
}

const columnLabels: Record<string, string> = {
  name:         "Nombre",
  type:         "Tipo",
  status:       "Estado",
  amount:       "Monto",
  valid_until:  "Válida hasta",
  created_by:   "Creado por",
  created_at:   "Creado",
  apply_discounts: "Descuentos",
}

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc")  return <ArrowUpIcon   className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon  className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(): ColumnDef<DealQuotation>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
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
        const q = row.original
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <FileTextIcon className="size-3.5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{q.name}</div>
              <div className="text-xs text-muted-foreground">{q.items_count} ítem(s)</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const conf = TYPE_CONFIG[row.getValue("type") as "sale" | "purchase"]
        return (
          <Badge className={cn("rounded-full border px-2.5 py-0.5 text-xs", conf.className)}>
            {conf.label}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const conf = STATUS_CONFIG[row.getValue("status") as QuotationStatus]
        return (
          <Badge className={cn("rounded-full border px-2.5 py-0.5 text-xs", conf.className)}>
            {conf.label}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Monto {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold tabular-nums text-emerald-600">
          {formatCLP(row.getValue("amount"))}
        </div>
      ),
    },
    {
      accessorKey: "valid_until",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Válida hasta {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {(row.getValue("valid_until") as string | undefined) ?? "—"}
        </div>
      ),
    },
    {
      id: "created_by",
      accessorFn: (row) => row.created_by.name,
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Creado por {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const u = row.original.created_by
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-6 shrink-0">
              <AvatarImage src={u.avatar} alt={u.name} />
              <AvatarFallback className="text-[9px] font-semibold">{u.initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{u.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Creado {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.getValue("created_at")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem><PencilIcon /> Editar</DropdownMenuItem>
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
}

// ─── Filter options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "Borrador",  value: "borrador"  },
  { label: "Enviada",   value: "enviada"   },
  { label: "Aceptada",  value: "aceptada"  },
  { label: "Rechazada", value: "rechazada" },
]

const TYPE_OPTIONS = [
  { label: "Venta",  value: "sale"     },
  { label: "Compra", value: "purchase" },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  deal: DealDetail
}

export function CotizacionesTab({ deal }: Props) {
  const [sorting, setSorting]                   = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters]        = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility]  = React.useState<VisibilityState>({
    type: false, created_by: false, created_at: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const columns = React.useMemo(() => getColumns(), [])

  const table = useReactTable({
    data: deal.quotations,
    columns,
    onSortingChange:           setSorting,
    onColumnFiltersChange:     setColumnFilters,
    onColumnVisibilityChange:  setColumnVisibility,
    onRowSelectionChange:      setRowSelection,
    getCoreRowModel:           getCoreRowModel(),
    getPaginationRowModel:     getPaginationRowModel(),
    getSortedRowModel:         getSortedRowModel(),
    getFilteredRowModel:       getFilteredRowModel(),
    getFacetedRowModel:        getFacetedRowModel(),
    getFacetedUniqueValues:    getFacetedUniqueValues(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  return (
    <div className="p-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <Input
          className="h-8 max-w-45 text-sm"
          placeholder="Filtrar por nombre..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter column={table.getColumn("status")!} title="Estado" options={STATUS_OPTIONS} />
        <DataTableFacetedFilter column={table.getColumn("type")!}   title="Tipo"   options={TYPE_OPTIONS}   />
        {table.getState().columnFilters.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8" onClick={() => table.resetColumnFilters()}>
            Reset <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} cotización(es)
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
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {columnLabels[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-8 gap-1.5 text-xs">
            <PlusIcon className="size-3.5" /> Cotización
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
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
      <div className="pt-4">
        <DataTablePagination table={table} />
      </div>

    </div>
  )
}
