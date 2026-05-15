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
  ClipboardListIcon,
  EyeIcon,
  GitBranchIcon,
  Link2Icon,
  MoreHorizontal,
  PlusIcon,
  Trash2Icon,
  XIcon,
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
import { Input } from "@/components/ui/input"
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
import { formService } from "@/services/form.service"
import type { FormRaw } from "@/types/form"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Form {
  id: number
  name: string
  slug: string
  flowId: number
  flowName: string
  isActive: boolean
  createdAt: string
}

function mapForm(d: FormRaw): Form {
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    flowId: d.flow_id,
    flowName: d.flow.name,
    isActive: d.is_active,
    createdAt: d.created_at,
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const columnLabels: Record<string, string> = {
  id:       "ID",
  name:     "Nombre",
  flowName: "Pipeline",
  isActive: "Estado",
  createdAt: "Creado",
}

// ─── QueryState ───────────────────────────────────────────────────────────────

type QueryState = {
  page: number
  pageSize: number
  search: string
  isActive: boolean | null
}

// ─── SimpleFilter ─────────────────────────────────────────────────────────────

function SimpleFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: { label: string; value: string }[]
  onChange: (v: string | null) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="outline" size="sm" className={cn("h-8 gap-1", value && "border-primary/50 bg-primary/5")} />
      }>
        {label}
        {value && <span className="ml-1 text-primary">·</span>}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-32">
        {value && (
          <DropdownMenuItem onClick={() => onChange(null)}>
            <XIcon className="size-3.5" /> Todos
          </DropdownMenuItem>
        )}
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value === value ? null : opt.value)}
            className={opt.value === value ? "font-medium" : ""}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select: <div className="size-4 animate-pulse rounded bg-muted" />,
  id:     <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-md bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  flowName: (
    <div className="flex items-center gap-1.5">
      <div className="size-3.5 animate-pulse rounded bg-muted" />
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  ),
  isActive:  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: ColumnDef<Form>[] = [
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
      <div className="text-xs text-muted-foreground">#{row.getValue("id")}</div>
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
      const slug = row.original.slug
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-teal-500/10">
            <ClipboardListIcon className="size-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground font-mono">{slug}</div>
          </div>
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
    cell: ({ row }) => {
      const name: string = row.getValue("flowName")
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <GitBranchIcon className="size-3.5 shrink-0" />
          {name}
        </div>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Estado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const active: boolean = row.getValue("isActive")
      return (
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
          active
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        )}>
          <span className={cn("size-1.5 rounded-full", active ? "bg-emerald-500" : "bg-zinc-400")} />
          {active ? "Activo" : "Inactivo"}
        </span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Creado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {new Date(row.getValue("createdAt")).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const slug = row.original.slug
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem>
                <EyeIcon /> Ver formulario
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(slug)}>
                <Link2Icon /> Copiar slug
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2Icon /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function FormsTable() {
  const [data, setData] = React.useState<Form[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    isActive: null,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      formService
        .list({
          page: query.page,
          take: query.pageSize,
          filter: query.search || undefined,
          is_active: query.isActive !== null ? query.isActive : undefined,
        })
        .then((res) => {
          if (cancelled) return
          setData(res.data.map(mapForm))
          setTotal(res.total)
          setLoading(false)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })
    }, query.search ? 400 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
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

  const activeFilterValue =
    query.isActive === true ? "true" : query.isActive === false ? "false" : null

  const hasFilters = !!query.search || query.isActive !== null

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 py-4">
        <Input
          className="max-w-sm h-8"
          placeholder="Buscar formularios..."
          value={query.search}
          onChange={(e) =>
            setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))
          }
        />
        <SimpleFilter
          label="Estado"
          value={activeFilterValue}
          options={[
            { label: "Activo",   value: "true"  },
            { label: "Inactivo", value: "false" },
          ]}
          onChange={(v) =>
            setQuery((q) => ({
              ...q,
              page: 1,
              isActive: v === "true" ? true : v === "false" ? false : null,
            }))
          }
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setQuery((q) => ({ ...q, search: "", isActive: null, page: 1 }))}
          >
            Reset <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {loading ? "…" : `${total} formularios`}
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
            <PlusIcon className="size-4" /> Crear Formulario
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
