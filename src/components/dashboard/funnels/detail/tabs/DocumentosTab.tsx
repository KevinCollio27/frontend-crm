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
  DownloadIcon,
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
import type { DealDetail, DealDocument } from "../../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FILE_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  pdf:  { bg: "bg-red-100",    color: "text-red-600"    },
  docx: { bg: "bg-blue-100",   color: "text-blue-600"   },
  xlsx: { bg: "bg-emerald-100", color: "text-emerald-600" },
  pptx: { bg: "bg-orange-100", color: "text-orange-600" },
}

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  contrato:     { label: "Contrato",     className: "bg-blue-50 text-blue-700 border-blue-200"           },
  factura:      { label: "Factura",      className: "bg-amber-50 text-amber-700 border-amber-200"         },
  presentacion: { label: "Presentación", className: "bg-violet-50 text-violet-700 border-violet-200"      },
  manual:       { label: "Manual",       className: "bg-emerald-50 text-emerald-700 border-emerald-200"   },
  otro:         { label: "Otro",         className: "bg-muted text-muted-foreground border-border"        },
}

const columnLabels: Record<string, string> = {
  name:        "Nombre",
  category:    "Categoría",
  file_size:   "Tamaño",
  uploaded_by: "Subido por",
  created_at:  "Creado",
}

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc")  return <ArrowUpIcon   className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon  className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(): ColumnDef<DealDocument>[] {
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
        const doc = row.original
        const style = FILE_TYPE_STYLE[doc.file_type] ?? { bg: "bg-muted", color: "text-muted-foreground" }
        return (
          <div className="flex items-center gap-2.5">
            <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", style.bg)}>
              <FileTextIcon className={cn("size-3.5", style.color)} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{doc.name}</div>
              <div className="text-xs text-muted-foreground uppercase">{doc.file_type}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const conf = CATEGORY_CONFIG[row.getValue("category") as string] ?? CATEGORY_CONFIG.otro
        return (
          <Badge className={cn("rounded-full border px-2.5 py-0.5 text-xs", conf.className)}>
            {conf.label}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "file_size",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Tamaño {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground tabular-nums">
          {formatBytes(row.getValue("file_size"))}
        </div>
      ),
    },
    {
      id: "uploaded_by",
      accessorFn: (row) => row.uploaded_by.name,
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Subido por {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const u = row.original.uploaded_by
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
              <DropdownMenuItem><DownloadIcon /> Descargar</DropdownMenuItem>
              <DropdownMenuItem><PencilIcon />   Editar</DropdownMenuItem>
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

const CATEGORY_OPTIONS = [
  { label: "Contrato",     value: "contrato"     },
  { label: "Factura",      value: "factura"      },
  { label: "Presentación", value: "presentacion" },
  { label: "Manual",       value: "manual"       },
  { label: "Otro",         value: "otro"         },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  deal: DealDetail
}

export function DocumentosTab({ deal }: Props) {
  const [sorting, setSorting]                   = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters]        = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility]  = React.useState<VisibilityState>({
    uploaded_by: false, created_at: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const columns = React.useMemo(() => getColumns(), [])

  const table = useReactTable({
    data: deal.documents,
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
        <DataTableFacetedFilter column={table.getColumn("category")!} title="Categoría" options={CATEGORY_OPTIONS} />
        {table.getState().columnFilters.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8" onClick={() => table.resetColumnFilters()}>
            Reset <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} documento(s)
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
            <PlusIcon className="size-3.5" /> Documento
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
