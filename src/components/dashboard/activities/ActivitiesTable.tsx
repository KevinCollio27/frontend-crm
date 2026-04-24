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
  ArrowDownRightIcon,
  ArrowUpDown,
  ArrowUpIcon,
  ArrowUpRightIcon,
  ChevronDown,
  EyeIcon,
  MinusIcon,
  MoreHorizontal,
  PencilIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"
import * as React from "react";

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
import { ActivityPreviewSheet } from "./ActivityPreviewSheet"
import { STAGES, ACTIVITY_TYPES, type Activity, type ActivityPriority } from "./data"

// ─── Configs ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

const PRIORITY_CONFIG: Record<ActivityPriority, { icon: React.ReactNode; color: string }> = {
  alta:  { icon: <ArrowUpIcon className="size-3" />,   color: "text-red-600"     },
  media: { icon: <MinusIcon className="size-3" />,     color: "text-yellow-600"  },
  baja:  { icon: <ArrowDownIcon className="size-3" />, color: "text-muted-foreground" },
}

const STAGE_CONFIG: Record<string, { dot: string; badge: string }> = {
  pendiente:   { dot: "bg-amber-500",          badge: "bg-amber-500/10 text-amber-600"    },
  en_progreso: { dot: "bg-blue-500",            badge: "bg-blue-500/10 text-blue-600"      },
  completada:  { dot: "bg-emerald-500",         badge: "bg-emerald-500/10 text-emerald-600" },
  cancelada:   { dot: "bg-muted-foreground",    badge: "bg-muted text-muted-foreground"    },
}

const columnLabels: Record<string, string> = {
  id:        "ID",
  title:     "Título",
  type:      "Tipo",
  startDate: "Período",
  stageId:   "Estado / Prioridad",
  createdAt: "Creada",
}

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc")  return <ArrowUpIcon className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function getColumns(onPreview: (activity: Activity) => void): ColumnDef<Activity>[] {
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
      <div className="text-sm text-muted-foreground">{row.getValue("type")}</div>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
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
            <span className="font-medium">{endDate}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpRightIcon className="size-3 text-green-500 shrink-0" />
            <span>Desde:</span>
            <span>{startDate}</span>
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
      const stageId: string          = row.getValue("stageId")
      const priority: ActivityPriority = row.original.priority
      const overdue = stageId !== "completada" && stageId !== "cancelada" && row.original.endDate < TODAY
      const stageName = STAGES.find((s) => s.id === stageId)?.name ?? stageId
      const config    = STAGE_CONFIG[stageId] ?? { dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground" }
      const pConfig   = PRIORITY_CONFIG[priority]

      return (
        <div className="leading-tight space-y-1">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
              <div className={`size-1.5 rounded-full ${config.dot}`} />
              {stageName}
            </span>
            {overdue && (
              <Badge className="rounded-full border-0 text-xs px-2 py-0 bg-red-50 text-red-600">
                Atrasada
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs px-2">
            <span className="text-muted-foreground">Prioridad:</span>
            <span className={`inline-flex items-center gap-0.5 ${pConfig?.color ?? "text-muted-foreground"}`}>
              {pConfig?.icon}
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          </div>
        </div>
      )
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Creado {getSortIcon(column.getIsSorted())}
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
      const activity = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onPreview(activity)}>
                <UserIcon />
                Vista Previa
              </DropdownMenuItem>
              <DropdownMenuItem>
                <EyeIcon />
                Ver detalle
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
      );
    },
  },
  ]
}

// ─── ActivitiesTable ─────────────────────────────────────────────────────────

interface ActivitiesTableProps {
  activities: Activity[]
}

export function ActivitiesTable({ activities }: ActivitiesTableProps) {
  const [sorting, setSorting]               = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters]   = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection]     = React.useState({})
  const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const columns = React.useMemo(
    () => getColumns((activity) => { setSelectedActivity(activity); setSheetOpen(true); }),
    []
  );

  const table = useReactTable({
    data: activities,
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
    <div className="w-full overflow-y-auto p-4">
      <div className="flex items-center gap-2 pb-4">
        <Input
          className="max-w-sm"
          placeholder="Buscar actividades..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter
          column={table.getColumn("type")!}
          title="Tipo"
          options={ACTIVITY_TYPES.map((t) => ({ label: t, value: t }))}
        />
        <DataTableFacetedFilter
          column={table.getColumn("stageId")!}
          title="Estado"
          options={STAGES.map((s) => ({ label: s.name, value: s.id }))}
        />
        {table.getState().columnFilters.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8" onClick={() => table.resetColumnFilters()}>
            Reset <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} actividades
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
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {columnLabels[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
