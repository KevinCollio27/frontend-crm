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
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  RocketIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import * as React from "react"

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
import { useIsMobile } from "@/hooks/use-mobile"
import type { DealInvoice, InvoiceStatus, InvoiceUnitOfMeasure } from "../../data"

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:              false,
  quotation_id:    false,
  unit_of_measure: false,
  period:          false,
  amount:          false,
  issue_date:      false,
  due_date:        false,
  status:          false,
}

// ─── Configs ──────────────────────────────────────────────────────────────────

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-muted text-muted-foreground border-border"             },
  emitida:  { label: "Emitida",  className: "bg-blue-50 text-blue-700 border-blue-200"                 },
  pagada:   { label: "Pagada",   className: "bg-emerald-50 text-emerald-700 border-emerald-200"         },
  vencida:  { label: "Vencida",  className: "bg-red-50 text-red-600 border-red-200"                    },
  anulada:  { label: "Anulada",  className: "bg-orange-50 text-orange-700 border-orange-200"            },
}

const UM_CONFIG: Record<InvoiceUnitOfMeasure, string> = {
  dias:    "Días",
  semanas: "Semanas",
  meses:   "Meses",
  años:    "Años",
}

const columnLabels: Record<string, string> = {
  id:              "ID",
  invoice_number:  "N° Factura",
  quotation_id:    "Cotización",
  unit_of_measure: "Unidad",
  period:          "Periodo",
  amount:          "Monto",
  issue_date:      "Emisión",
  due_date:        "Vencimiento",
  status:          "Estado",
}

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc")  return <ArrowUpIcon  className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(): ColumnDef<DealInvoice>[] {
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
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue("id")}</span>
      ),
    },
    {
      accessorKey: "invoice_number",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          N° Factura {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const inv = row.original
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <ReceiptIcon className="size-3.5" />
            </div>
            <span className="text-sm font-medium">{inv.invoice_number}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "quotation_id",
      header: "Cotización",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue("quotation_id")}</span>
      ),
    },
    {
      accessorKey: "unit_of_measure",
      header: "Unidad",
      cell: ({ row }) => {
        const um = row.getValue("unit_of_measure") as InvoiceUnitOfMeasure
        return <span className="text-sm text-muted-foreground">{UM_CONFIG[um]}</span>
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "period",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Periodo {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const period = row.getValue("period") as number
        const um     = row.original.unit_of_measure
        return (
          <span className="text-sm tabular-nums">
            {period} {UM_CONFIG[um].toLowerCase()}
          </span>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Monto {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold tabular-nums text-emerald-600">
          {formatCLP(row.getValue("amount"))}
        </span>
      ),
    },
    {
      accessorKey: "issue_date",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Emisión {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("issue_date")}</span>
      ),
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Vencimiento {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("due_date")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const conf = STATUS_CONFIG[row.getValue("status") as InvoiceStatus]
        return (
          <Badge className={cn("rounded-full border px-2.5 py-0.5 text-xs", conf.className)}>
            {conf.label}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
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
  { label: "Borrador", value: "borrador" },
  { label: "Emitida",  value: "emitida"  },
  { label: "Pagada",   value: "pagada"   },
  { label: "Vencida",  value: "vencida"  },
  { label: "Anulada",  value: "anulada"  },
]

const UM_OPTIONS = [
  { label: "Días",    value: "dias"    },
  { label: "Semanas", value: "semanas" },
  { label: "Meses",   value: "meses"   },
  { label: "Años",    value: "años"    },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  opportunityId: number
}

export function FacturasTab({ opportunityId: _opportunityId }: Props) {
  const [sorting, setSorting]                  = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters]       = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id:              false,
    unit_of_measure: false,
    issue_date:      false,
    due_date:         false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

  const columns = React.useMemo(() => getColumns(), [])

  const table = useReactTable({
    data: [] as DealInvoice[],
    columns,
    onSortingChange:          setSorting,
    onColumnFiltersChange:    setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:     setRowSelection,
    getCoreRowModel:          getCoreRowModel(),
    getPaginationRowModel:    getPaginationRowModel(),
    getSortedRowModel:        getSortedRowModel(),
    getFilteredRowModel:      getFilteredRowModel(),
    getFacetedRowModel:       getFacetedRowModel(),
    getFacetedUniqueValues:   getFacetedUniqueValues(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  return (
    <div className="relative p-4">

      {/* Próximamente overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-[2px]">
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
          <RocketIcon className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">¡Próximamente!</span>
        </div>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Estamos trabajando en esta funcionalidad. ¡Disponible a la brevedad!
        </p>
      </div>

      {/* Toolbar. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 pb-4 md:flex-row md:items-center">
        <Input
          className="h-8 w-full text-sm md:max-w-45"
          placeholder="Filtrar por N° factura..."
          value={(table.getColumn("invoice_number")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("invoice_number")?.setFilterValue(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <DataTableFacetedFilter column={table.getColumn("status")!}          title="Estado"  options={STATUS_OPTIONS} />
          </div>
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <DataTableFacetedFilter column={table.getColumn("unit_of_measure")!} title="Unidad"  options={UM_OPTIONS}     />
          </div>
          {table.getState().columnFilters.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8" onClick={() => table.resetColumnFilters()}>
              Reset <XIcon className="ml-1 size-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="w-full text-sm text-muted-foreground md:w-auto">
            {table.getFilteredRowModel().rows.length} factura(s)
          </span>
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
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {columnLabels[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" className="h-8 w-full gap-1.5 text-xs md:w-auto">
            <PlusIcon className="size-3.5" /> Factura
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
