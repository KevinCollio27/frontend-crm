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
import {
  ChevronDown,
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  SearchIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon } from "@/lib/table-utils"
import { flowConfirm } from "@/lib/confirm"
import { flowNotify } from "@/lib/notify"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import { useIsMobile } from "@/hooks/use-mobile"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { flowService } from "@/services/flow.service"
import type { Flow } from "@/types/flow"
import { StageBadge } from "@/components/ui/stage-badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CreateFunnelSheet } from "./CreateFunnelSheet"
import type { FunnelFormState } from "./shared/form-state"

// ─── Pasos — reusa StageBadge (mismo violeta que Etapa en la tabla de
// Oportunidades) en vez del ChipList genérico gris, más overflow con tooltip
// igual que Productos.
function StepChips({ steps, max = 4 }: { steps: string[]; max?: number }) {
  if (!steps.length) return <span className="text-sm text-muted-foreground">—</span>

  const visible = steps.slice(0, max)
  const overflow = steps.slice(max)

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((step, i) => (
          <StageBadge key={`${step}-${i}`} stage={step} />
        ))}
        {overflow.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={<span />}
              className="inline-flex cursor-default items-center rounded-md border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              +{overflow.length}
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <div className="space-y-0.5">
                {overflow.map((step, i) => (
                  <div key={`${step}-${i}`}>{step}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

// ─── Entity ──────────────────────────────────────────────────────────────────

export interface Funnel {
  id:         number
  name:       string
  steps:      string[]
  isActive:   boolean
  isDefault:  boolean
  createdAt:  string
  raw:        Flow
}

// ─── Map ─────────────────────────────────────────────────────────────────────

function mapFlow(r: Flow): Funnel {
  return {
    id:        r.id,
    name:      r.name,
    steps:     r.flow_stage
                 .slice()
                 .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
                 .map((s) => s.name),
    isActive:  r.is_active,
    isDefault: r.is_default,
    createdAt: new Date(r.created_at).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    raw: r,
  }
}

function funnelToFormValues(funnel: Funnel): FunnelFormState {
  return {
    id: funnel.raw.id,
    name: funnel.raw.name,
    isDefault: funnel.raw.is_default,
    stages: funnel.raw.flow_stage
      .slice()
      .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
      .map((s) => ({ id: String(s.id), name: s.name })),
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  id:        "ID",
  name:      "Nombre",
  steps:     "Pasos",
  isActive:  "Estado",
  isDefault: "Por defecto",
  createdAt: "Creado el",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  isDefault: false,
  createdAt: false,
}

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:        false,
  steps:     false,
  isActive:  false,
  isDefault: false,
  createdAt: false,
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  id:   <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-36 animate-pulse rounded bg-muted" />
    </div>
  ),
  steps: (
    <div className="flex gap-1.5">
      <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
    </div>
  ),
  isActive:  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />,
  isDefault: <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />,
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="ml-auto size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(
  isAdmin: boolean,
  onEdit: (funnel: Funnel) => void,
  onDelete: (funnel: Funnel) => void,
  onToggleActive: (funnel: Funnel) => void,
  onDuplicate: (funnel: Funnel) => void
): ColumnDef<Funnel>[] {
  return [
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
      const name: string = row.getValue("name")
      return (
        <div className="flex items-stretch gap-2.5">
          <EntityAccentBar seed={row.original.id} />
          <div className="min-w-0 max-w-56 truncate self-center text-sm font-medium" title={name}>{name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "steps",
    header: "Pasos",
    enableSorting: false,
    cell: ({ row }) => <StepChips steps={row.getValue("steps")} />,
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
        <Badge
          className={cn(
            "rounded-full border-0 text-xs px-2 py-0",
            active
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}
          variant="secondary"
        >
          {active ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isDefault",
    header: "Por defecto",
    enableSorting: false,
    cell: ({ row }) => {
      const isDefault: boolean = row.getValue("isDefault")
      return isDefault ? (
        <Badge
          className="rounded-full border-0 text-xs px-2 py-0 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          variant="secondary"
        >
          Predeterminado
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Creado el {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("createdAt")}</span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const funnel = row.original
      if (!isAdmin) return null
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{funnel.name}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(funnel)}>
                  <PencilIcon />
                  Editar embudo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(funnel)}>
                  {funnel.isActive ? <PowerOffIcon /> : <PowerIcon />}
                  {funnel.isActive ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(funnel)}>
                  <CopyIcon />
                  Duplicar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(funnel)}>
                <Trash2Icon />
                Eliminar embudo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
  ]
}

// ─── QueryState ───────────────────────────────────────────────────────────────

interface QueryState {
  page:     number
  pageSize: number
  search:   string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FunnelsTable() {
  const isAdmin = useIsWorkspaceAdmin()
  const [data, setData]       = React.useState<Funnel[]>([])
  const [total, setTotal]     = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch]   = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [query, setQuery]     = React.useState<QueryState>({ page: 1, pageSize: 10, search: "" })
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingFunnel, setEditingFunnel] = React.useState<FunnelFormState | undefined>(undefined)
  const [visualizacionOpen, setVisualizacionOpen] = React.useState(false)

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

  async function handleDelete(funnel: Funnel) {
    const { isInUse, usageCount } = await flowService.checkUsage(funnel.id)
    if (isInUse) {
      const wantsDeactivate = await flowConfirm.blockedOfferDeactivate(
        `El embudo "${funnel.name}" tiene ${usageCount} oportunidad${usageCount > 1 ? "es" : ""} asociada${usageCount > 1 ? "s" : ""}.`
      )
      if (wantsDeactivate) await handleToggleActive(funnel)
      return
    }
    const confirmed = await flowConfirm.delete(funnel.name)
    if (!confirmed) return
    try {
      const result = await flowService.delete(funnel.id)
      if (!result.success) {
        flowNotify.error(result.message ?? "No se pudo eliminar el embudo.")
        return
      }
      flowNotify.deleted(funnel.name)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      flowNotify.error((error as { message?: string })?.message ?? "No se pudo eliminar el embudo.")
    }
  }

  async function handleToggleActive(funnel: Funnel) {
    try {
      if (funnel.isActive) {
        await flowService.deactivate(funnel.id)
        flowNotify.deactivated(funnel.name)
      } else {
        await flowService.activate(funnel.id)
        flowNotify.activated(funnel.name)
      }
      setRefreshKey((k) => k + 1)
    } catch (error) {
      flowNotify.error((error as { message?: string })?.message ?? "No se pudo actualizar el estado del embudo.")
    }
  }

  async function handleDuplicate(funnel: Funnel) {
    try {
      const duplicated = await flowService.duplicate(funnel.id)
      flowNotify.created(duplicated.name)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      flowNotify.error((error as { message?: string })?.message ?? "No se pudo duplicar el embudo.")
    }
  }

  const columns = React.useMemo(
    () =>
      getColumns(
        isAdmin,
        (funnel) => {
          setEditingFunnel(funnelToFormValues(funnel))
          setCreateOpen(true)
        },
        (funnel) => handleDelete(funnel),
        (funnel) => handleToggleActive(funnel),
        (funnel) => handleDuplicate(funnel)
      ),
    [isAdmin]
  )

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, page: 1, search })), 400)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    flowService
      .list({ page: query.page, take: query.pageSize, filter: query.search || undefined })
      .then((page) => {
        if (cancelled) return
        setData(page.data.map(mapFlow))
        setTotal(page.total)
      })
      .catch(() => {
        if (!cancelled) { setData([]); setTotal(0) }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [query, refreshKey])

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
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: query.page - 1, pageSize: query.pageSize })
          : updater
      setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="w-full space-y-4">
      {/* Toolbar. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative w-full shrink-0 md:w-44">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nombre..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="w-full text-sm text-muted-foreground md:w-auto">
            {total} embudo{total !== 1 ? "s" : ""}
          </span>
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <DropdownMenu open={visualizacionOpen} onOpenChange={setVisualizacionOpen}>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
                <Settings2Icon className="size-4" />
                Visualización
                <ChevronDown className={cn("size-4 transition-transform", visualizacionOpen && "rotate-180")} />
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
          {isAdmin && (
            <Button
              size="sm"
              className="w-full md:w-auto"
              onClick={() => {
                setEditingFunnel(undefined)
                setCreateOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              Crear Embudo
            </Button>
          )}
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
                  Sin embudos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      <CreateFunnelSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        funnel={editingFunnel}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
