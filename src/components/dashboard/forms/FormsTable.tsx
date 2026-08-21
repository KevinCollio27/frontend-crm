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
  Code2Icon,
  Columns3Icon,
  EditIcon,
  EyeIcon,
  GitBranchIcon,
  Link2Icon,
  MoreHorizontal,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
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
import { SingleSelectFilter, type SingleSelectOption } from "@/components/ui/single-select-filter"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { confirmDialog } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { getSortIcon } from "@/lib/table-utils"
import { cn } from "@/lib/utils"
import { formService } from "@/services/form.service"
import { flowService } from "@/services/flow.service"
import type { FormRaw } from "@/types/form"
import type { Flow } from "@/types/flow"
import { CreateFormSheet } from "./CreateFormSheet"
import { FormIntegrateSheet } from "./FormIntegrateSheet"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Form {
  id: number
  name: string
  slug: string
  flowId: number
  flowName: string
  isActive: boolean
  createdAt: string
  raw: FormRaw
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
    raw: d,
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

// En mobile no hay espacio para columnas de más — solo Nombre queda visible por
// defecto (Acciones y el checkbox de selección no dependen de esto, siempre se ven).
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:        false,
  flowName:  false,
  isActive:  false,
  createdAt: false,
}

// ─── QueryState ───────────────────────────────────────────────────────────────

type QueryState = {
  page: number
  pageSize: number
  search: string
  isActive: boolean | null
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: SingleSelectOption[] = [
  { value: "all",   label: "Todos"    },
  { value: "true",  label: "Activo"   },
  { value: "false", label: "Inactivo" },
]

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

function buildColumns(
  onEdit: (raw: FormRaw) => void,
  onDelete: (id: number) => void,
  onIntegrate: (raw: FormRaw) => void
): ColumnDef<Form>[] {
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
      const form = row.original
      const name: string = row.getValue("name")
      return (
        <div className="flex items-stretch gap-2.5">
          <EntityAccentBar seed={form.id} />
          <div className="leading-tight min-w-0 max-w-70">
            <div className="truncate text-sm font-medium" title={name}>{name}</div>
            <div className="truncate text-xs text-muted-foreground font-mono" title={form.slug}>{form.slug}</div>
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
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <GitBranchIcon className="size-3.5 shrink-0" />
          <span className="min-w-0 max-w-40 truncate" title={name}>{name}</span>
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
      const form = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.open(`/widget/form/${form.slug}`, "_blank")}>
                <EyeIcon /> Ver formulario
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(form.raw)}>
                <EditIcon /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/widget/form/${form.slug}`)}>
                <Link2Icon /> Copiar enlace
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onIntegrate(form.raw)}>
                <Code2Icon /> Integrar formulario
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(form.id)}
            >
              <Trash2Icon /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormsTable({ viewToggle }: { viewToggle?: React.ReactNode } = {}) {
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
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [rowSelection, setRowSelection] = React.useState({})
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState<FormRaw | null>(null)
  const [integrateForm, setIntegrateForm] = React.useState<FormRaw | null>(null)
  const [flows, setFlows] = React.useState<Flow[]>([])
  const [flowFilter, setFlowFilter] = React.useState<string>("all")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [columnsOpen, setColumnsOpen] = React.useState(false)

  React.useEffect(() => {
    flowService.all().then(setFlows).catch(() => {})
  }, [])

  const handleEdit = React.useCallback((raw: FormRaw) => {
    setEditForm(raw)
    setSheetOpen(true)
  }, [])

  const handleIntegrate = React.useCallback((raw: FormRaw) => {
    setIntegrateForm(raw)
  }, [])

  const handleDelete = React.useCallback(async (id: number) => {
    const ok = await confirmDialog({
      title: "¿Eliminar formulario?",
      description: "El formulario dejará de estar disponible públicamente.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) return
    try {
      setData((prev) => prev.filter((f) => f.id !== id))
      setTotal((prev) => prev - 1)
      await formService.delete(id)
      notify.success({ title: "Formulario eliminado", description: "El formulario ya no está disponible públicamente." })
    } catch {
      notify.error({ title: "Error al eliminar", description: "No se pudo eliminar el formulario. Intenta de nuevo." })
      setQuery((q) => ({ ...q }))
    }
  }, [])

  const columns = React.useMemo(() => buildColumns(handleEdit, handleDelete, handleIntegrate), [handleEdit, handleDelete, handleIntegrate])

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

  // Pipeline — client-side sobre la página cargada, el backend no tiene
  // param de flow_id todavía (igual criterio que Fuente en Organización).
  const visibleData = React.useMemo(() => {
    if (flowFilter === "all") return data
    return data.filter((f) => String(f.flowId) === flowFilter)
  }, [data, flowFilter])

  const table = useReactTable({
    data: visibleData,
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

  const flowOptions: SingleSelectOption[] = [
    { value: "all", label: "Todos" },
    ...flows.map((f) => ({ value: String(f.id), label: f.name })),
  ]

  const activeFilterValue =
    query.isActive === true ? "true" : query.isActive === false ? "false" : "all"

  const hasFilters = !!query.search || query.isActive !== null || flowFilter !== "all"

  function resetFilters() {
    setQuery((q) => ({ ...q, search: "", isActive: null, page: 1 }))
    setFlowFilter("all")
  }

  return (
    <div className="w-full">
      {/* Row 1 — view toggle + create */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        {viewToggle}
        <Button size="sm" onClick={() => { setEditForm(null); setSheetOpen(true) }}>+ Crear Formulario</Button>
      </div>

      {/* Row 2 — búsqueda + toggle de filtros. En mobile se apila en filas propias
          en vez de forzar scroll horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar formularios..."
              className="h-8 pl-8 text-xs"
              value={query.search}
              onChange={(e) =>
                setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <DropdownMenu open={columnsOpen} onOpenChange={setColumnsOpen}>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1.5" />}>
                  <Columns3Icon className="size-3.5" />
                  Columnas
                  <ChevronDown className={cn("size-3.5 transition-transform", columnsOpen && "rotate-180")} />
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
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              Filtros
              <ChevronDown className={cn("size-3.5 transition-transform", filtersOpen && "rotate-180")} />
            </Button>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
                <XIcon className="size-3.5" />
                Restablecer
              </Button>
            )}
          </div>
        </div>

        <span className="md:ml-auto shrink-0 text-xs text-muted-foreground">
          {loading ? "…" : `${total} formularios`}
        </span>
      </div>

      {/* Row 3 — filtros avanzados, colapsados por defecto (botón "Filtros" en fila 2) */}
      {filtersOpen && (
        <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-2 md:flex-row md:items-center">
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Estado"
                options={STATUS_OPTIONS}
                selected={activeFilterValue}
                onChange={(v) =>
                  setQuery((q) => ({
                    ...q,
                    page: 1,
                    isActive: v === "true" ? true : v === "false" ? false : null,
                  }))
                }
              />
            </div>

            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Pipeline"
                options={flowOptions}
                selected={flowFilter}
                onChange={setFlowFilter}
              />
            </div>
          </div>
        </div>
      )}

      <CreateFormSheet
        open={sheetOpen}
        onOpenChange={(open) => { setSheetOpen(open); if (!open) setEditForm(null) }}
        editForm={editForm}
        onSuccess={() => setQuery((q) => ({ ...q }))}
      />

      <FormIntegrateSheet
        open={!!integrateForm}
        onOpenChange={(open) => { if (!open) setIntegrateForm(null) }}
        form={integrateForm}
      />

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

      <div className="px-4 py-3">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
