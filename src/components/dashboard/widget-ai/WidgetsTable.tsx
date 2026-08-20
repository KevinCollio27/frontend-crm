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
  CheckCircle2Icon,
  ChevronDown,
  Columns3Icon,
  CopyIcon,
  EyeIcon,
  GlobeIcon,
  ListIcon,
  MessageSquareTextIcon,
  MoreHorizontal,
  PencilIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
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
import { widgetAIService } from "@/services/widget-ai.service"
import type { WidgetAIRaw } from "@/types/widget-ai"
import { CreateWidgetSheet } from "./CreateWidgetSheet"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WidgetAI {
  id: number
  name: string
  description: string | null
  brandColor: string
  chatTitle: string
  apiKey: string
  allowedDomains: string[]
  position: string
  isActive: boolean
  isWhatsappAgent: boolean
  leadCaptureEnabled: boolean
  createdAt: string
}

function mapWidget(d: WidgetAIRaw): WidgetAI {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    brandColor: d.brand_color,
    chatTitle: d.chat_title,
    apiKey: d.api_key,
    allowedDomains: d.allowed_domains,
    position: d.position,
    isActive: d.is_active,
    isWhatsappAgent: d.is_whatsapp_agent,
    leadCaptureEnabled: d.lead_capture_enabled,
    createdAt: d.created_at,
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const positionLabel: Record<string, string> = {
  "bottom-right": "Abajo derecha",
  "bottom-left":  "Abajo izquierda",
  "top-right":    "Arriba derecha",
  "top-left":     "Arriba izquierda",
}

const columnLabels: Record<string, string> = {
  id:                 "ID",
  name:               "Widget",
  isActive:           "Estado",
  isWhatsappAgent:    "Tipo",
  leadCaptureEnabled: "Captura leads",
  chatTitle:          "Título chat",
  position:           "Posición",
  allowedDomains:     "Dominios",
  createdAt:          "Creado",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  chatTitle:      false,
  position:       false,
  allowedDomains: false,
}

// En mobile no hay espacio para columnas de más — solo Widget (nombre) queda
// visible por defecto (Acciones y el checkbox de selección no dependen de esto).
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:                 false,
  isActive:           false,
  isWhatsappAgent:    false,
  leadCaptureEnabled: false,
  chatTitle:          false,
  position:           false,
  allowedDomains:     false,
  createdAt:          false,
}

// ─── QueryState ───────────────────────────────────────────────────────────────

type QueryState = {
  page: number
  pageSize: number
  search: string
  isActive: boolean | null
  isWhatsappAgent: boolean | null
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: SingleSelectOption[] = [
  { value: "all",   label: "Todos"    },
  { value: "true",  label: "Activo"   },
  { value: "false", label: "Inactivo" },
]

const TYPE_OPTIONS: SingleSelectOption[] = [
  { value: "all",   label: "Todos"      },
  { value: "false", label: "Widget Web" },
  { value: "true",  label: "WhatsApp"   },
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
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  isWhatsappAgent:    <div className="h-5 w-24 animate-pulse rounded bg-muted" />,
  isActive:           <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  leadCaptureEnabled: <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />,
  chatTitle:          <div className="h-4 w-28 animate-pulse rounded bg-muted" />,
  position:           <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  allowedDomains: (
    <div className="flex items-center gap-1.5">
      <div className="size-3.5 animate-pulse rounded bg-muted" />
      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
    </div>
  ),
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function getColumns(
  onEdit: (widget: WidgetAI) => void,
  onToggleActive: (widget: WidgetAI) => void
): ColumnDef<WidgetAI>[] {
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
        Widget {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const { id, name, description } = row.original
      return (
        <div className="flex items-stretch gap-2.5 max-w-xs">
          <EntityAccentBar seed={id} />
          <div className="leading-tight overflow-hidden">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-xs text-muted-foreground truncate">{description || "—"}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "isWhatsappAgent",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Tipo {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const isWA: boolean = row.getValue("isWhatsappAgent")
      return isWA ? (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
          <SmartphoneIcon className="size-3" /> WhatsApp
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          <MessageSquareTextIcon className="size-3" /> Widget Web
        </span>
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
    accessorKey: "leadCaptureEnabled",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Captura leads {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const enabled: boolean = row.getValue("leadCaptureEnabled")
      return (
        <span className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
          enabled
            ? "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
            : "bg-muted text-muted-foreground"
        )}>
          {enabled ? "Sí" : "No"}
        </span>
      )
    },
  },
  {
    accessorKey: "chatTitle",
    header: "Título chat",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("chatTitle")}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "position",
    header: "Posición",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {positionLabel[row.getValue<string>("position")] ?? row.getValue("position")}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "allowedDomains",
    header: "Dominios",
    cell: ({ row }) => {
      const domains: string[] = row.getValue("allowedDomains")
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <GlobeIcon className="size-3.5 shrink-0" />
          {domains.length === 0 ? "Todos" : `${domains.length} dominio${domains.length > 1 ? "s" : ""}`}
        </div>
      )
    },
    enableSorting: false,
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
      const widget = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.open(`/widget/test/${widget.apiKey}`, "_blank")}>
                <EyeIcon /> Ver Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(widget)}>
                <PencilIcon /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(widget.apiKey)}>
                <CopyIcon /> Copiar API Key
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={widget.isActive ? "text-destructive focus:text-destructive" : "text-emerald-600 focus:text-emerald-600"}
              onClick={() => onToggleActive(widget)}
            >
              {widget.isActive ? <Trash2Icon /> : <CheckCircle2Icon />}
              {widget.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WidgetsTable() {
  const [data, setData] = React.useState<WidgetAI[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    isActive: null,
    isWhatsappAgent: null,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [rowSelection, setRowSelection] = React.useState({})
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [columnsOpen, setColumnsOpen] = React.useState(false)

  const columns = React.useMemo(
    () =>
      getColumns(
        (widget) => setEditId(widget.id),
        async (widget) => {
          const activating = !widget.isActive
          const ok = await confirmDialog({
            title: activating ? "¿Activar widget?" : "¿Desactivar widget?",
            description: activating
              ? `"${widget.name}" volverá a responder a los visitantes.`
              : `"${widget.name}" dejará de responder. Podrás reactivarlo desde este mismo menú.`,
            confirmText: activating ? "Activar" : "Desactivar",
            cancelText: "Cancelar",
            tone: activating ? "info" : "warning",
          })
          if (!ok) return
          setData((prev) => prev.map((w) => (w.id === widget.id ? { ...w, isActive: activating } : w)))
          try {
            await widgetAIService.update(widget.id, { is_active: activating })
            notify.success({
              title: activating ? "Widget activado" : "Widget desactivado",
              description: activating ? "El widget ya está respondiendo." : "El widget dejó de responder.",
            })
          } catch {
            notify.error({ title: `No se pudo ${activating ? "activar" : "desactivar"} el widget`, description: "Intenta de nuevo." })
            setData((prev) => prev.map((w) => (w.id === widget.id ? { ...w, isActive: widget.isActive } : w)))
          }
        }
      ),
    []
  )

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      widgetAIService
        .list({
          page: query.page,
          take: query.pageSize,
          filter: query.search || undefined,
          is_active:          query.isActive          !== null ? query.isActive          : undefined,
          is_whatsapp_agent:  query.isWhatsappAgent   !== null ? query.isWhatsappAgent   : undefined,
        })
        .then((res) => {
          if (cancelled) return
          setData(res.data.map(mapWidget))
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
  }, [query, refreshKey])

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
  const hasFilters = !!query.search || query.isActive !== null || query.isWhatsappAgent !== null

  const activeFilterValue =
    query.isActive === true ? "true" : query.isActive === false ? "false" : "all"
  const typeFilterValue =
    query.isWhatsappAgent === true ? "true" : query.isWhatsappAgent === false ? "false" : "all"

  function resetFilters() {
    setQuery((q) => ({ ...q, search: "", isActive: null, isWhatsappAgent: null, page: 1 }))
  }

  return (
    <div className="w-full">
      {/* Row 1 — view toggle + create */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
          <span className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-medium shadow-sm">
            <ListIcon className="size-3.5" />
            Lista
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Crear Widget</Button>
      </div>

      {/* Row 2 — búsqueda + toggle de filtros. En mobile se apila en filas propias
          en vez de forzar scroll horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar widgets..."
              className="h-8 pl-8 text-xs"
              value={query.search}
              onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))}
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
          {loading ? "…" : `${total} widgets`}
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
                title="Tipo"
                options={TYPE_OPTIONS}
                selected={typeFilterValue}
                onChange={(v) =>
                  setQuery((q) => ({
                    ...q,
                    page: 1,
                    isWhatsappAgent: v === "true" ? true : v === "false" ? false : null,
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

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

      {createOpen && (
        <CreateWidgetSheet
          open
          onOpenChange={setCreateOpen}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {editId !== null && (
        <CreateWidgetSheet
          open
          onOpenChange={(v) => { if (!v) setEditId(null) }}
          widgetId={editId}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
