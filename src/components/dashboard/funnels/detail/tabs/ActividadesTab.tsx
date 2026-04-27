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
  CalendarIcon,
  ChevronDown,
  MailIcon,
  MapPinIcon,
  MoreHorizontal,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
  VideoIcon,
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
import type { ActivityDetailStatus, DealActivity, DealDetail } from "../../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ActivityDetailStatus, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente",   className: "bg-amber-50 text-amber-700 border-amber-200"       },
  en_progreso: { label: "En progreso", className: "bg-blue-50 text-blue-700 border-blue-200"           },
  completada:  { label: "Completada",  className: "bg-emerald-50 text-emerald-700 border-emerald-200"  },
  cancelada:   { label: "Cancelada",   className: "bg-red-50 text-red-600 border-red-200"             },
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  "Llamada":       <PhoneIcon className="size-3.5" />,
  "Reunión":       <UsersIcon className="size-3.5" />,
  "Video Llamada": <VideoIcon className="size-3.5" />,
  "Email":         <MailIcon  className="size-3.5" />,
  "Visita":        <MapPinIcon className="size-3.5" />,
}

const columnLabels: Record<string, string> = {
  title:       "Título",
  type:        "Tipo",
  date_from:   "Fecha inicio",
  date_to:     "Fecha fin",
  ubication:   "Ubicación",
  status:      "Estado",
  responsible: "Responsable",
  created_at:  "Creado",
}

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc")  return <ArrowUpIcon   className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon  className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(): ColumnDef<DealActivity>[] {
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
      accessorKey: "title",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Título {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const title: string = row.getValue("title")
        const type: string  = row.original.type
        const icon = TYPE_ICON[type] ?? <CalendarIcon className="size-3.5" />
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              {icon}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">{type}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <div className="text-sm">{row.getValue("type")}</div>,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "date_from",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Fecha {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.getValue("date_from")}</div>
      ),
    },
    {
      accessorKey: "date_to",
      header: "Fecha fin",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{(row.getValue("date_to") as string) ?? "—"}</div>
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
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const conf = STATUS_CONFIG[row.getValue("status") as ActivityDetailStatus]
        return (
          <Badge className={cn("rounded-full border px-2.5 py-0.5 text-xs", conf.className)}>
            {conf.label}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
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
            <Avatar className="size-6 shrink-0">
              <AvatarImage src={r.avatar} alt={r.name} />
              <AvatarFallback className="text-[9px] font-semibold">{r.initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{r.name}</span>
          </div>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
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
      cell: ({ row: _row }) => (
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
  { label: "Pendiente",   value: "pendiente"   },
  { label: "En progreso", value: "en_progreso" },
  { label: "Completada",  value: "completada"  },
  { label: "Cancelada",   value: "cancelada"   },
]

const TYPE_OPTIONS = [
  { label: "Llamada",       value: "Llamada"       },
  { label: "Reunión",       value: "Reunión"       },
  { label: "Video Llamada", value: "Video Llamada" },
  { label: "Email",         value: "Email"         },
  { label: "Visita",        value: "Visita"        },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  deal: DealDetail
}

export function ActividadesTab({ deal }: Props) {
  const [sorting, setSorting]               = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters]   = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    type: false, date_from: false, date_to: false, ubication: false, created_at: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const columns = React.useMemo(() => getColumns(), [])

  const table = useReactTable({
    data: deal.activities,
    columns,
    onSortingChange:             setSorting,
    onColumnFiltersChange:       setColumnFilters,
    onColumnVisibilityChange:    setColumnVisibility,
    onRowSelectionChange:        setRowSelection,
    getCoreRowModel:             getCoreRowModel(),
    getPaginationRowModel:       getPaginationRowModel(),
    getSortedRowModel:           getSortedRowModel(),
    getFilteredRowModel:         getFilteredRowModel(),
    getFacetedRowModel:          getFacetedRowModel(),
    getFacetedUniqueValues:      getFacetedUniqueValues(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  return (
    <div className="p-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <Input
          className="h-8 max-w-45 text-sm"
          placeholder="Filtrar por título..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
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
            {table.getFilteredRowModel().rows.length} actividad(es)
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
            <PlusIcon className="size-3.5" /> Actividad
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
