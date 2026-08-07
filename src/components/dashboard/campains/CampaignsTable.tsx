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
  EyeIcon,
  ListIcon,
  MoreHorizontal,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { confirmDialog } from "@/lib/confirm"
import { notify } from "@/lib/notify"
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
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { campaignService } from "@/services/campaign.service"
import type { CampaignRaw } from "@/types/campaign"
import type { CampaignFormState } from "./shared/form-state"
import { CreateCampaignSheet } from "./CreateCampaignSheet"
import { CampaignPreviewSheet } from "./CampaignPreviewSheet"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: number
  name: string
  subject: string
  audienceFilter: string
  status: string
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  sentAt: string | null
  createdAt: string
  createdBy: string
}

function mapCampaign(d: CampaignRaw): Campaign {
  return {
    id: d.id,
    name: d.name,
    subject: d.subject,
    audienceFilter: d.audience_filter,
    status: d.status,
    sentCount: d.sent_count,
    deliveredCount: d.delivered_count,
    openedCount: d.opened_count,
    clickedCount: d.clicked_count,
    sentAt: d.sent_at,
    createdAt: d.created_at,
    createdBy: d.user.name,
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  sent:       { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",      label: "Enviada"    },
  draft:      { dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Borrador"   },
  processing: { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",            label: "Procesando" },
  partial:    { dot: "bg-orange-500",  badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",         label: "Parcial"    },
  failed:     { dot: "bg-red-500",     badge: "bg-red-500/10 text-red-600 dark:text-red-400",                  label: "Fallida"    },
}

const audienceConfig: Record<string, { label: string; badge: string }> = {
  all:          { label: "General",      badge: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"             },
  recent:       { label: "Recientes",    badge: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"         },
  specific:     { label: "Específica",   badge: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
  organization: { label: "Organización", badge: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
  custom_list:  { label: "Lista custom", badge: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400"         },
}

// "any" en vez de "all" como sentinel de "sin filtro" — "all" ya es un valor
// real de audience_filter (audiencia "General").
const AUDIENCE_OPTIONS: SingleSelectOption[] = [
  { value: "any",          label: "Todas"        },
  { value: "all",          label: "General"      },
  { value: "recent",       label: "Recientes"    },
  { value: "specific",     label: "Específica"   },
  { value: "organization", label: "Organización" },
  { value: "custom_list",  label: "Lista custom" },
]

const columnLabels: Record<string, string> = {
  id:             "ID",
  name:           "Nombre",
  audienceFilter: "Audiencia",
  status:         "Estado",
  sentCount:      "Métricas",
  deliveredCount: "Entregados",
  createdBy:      "Creado por",
  createdAt:      "Fecha",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  deliveredCount: false,
  createdBy: false,
}

// ─── QueryState ───────────────────────────────────────────────────────────────

type QueryState = {
  page: number
  pageSize: number
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select:        <div className="size-4 animate-pulse rounded bg-muted" />,
  id:            <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-md bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  audienceFilter: <div className="h-5 w-20 animate-pulse rounded bg-muted" />,
  status:         <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />,
  sentCount: (
    <div className="space-y-1.5">
      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      <div className="h-3 w-36 animate-pulse rounded bg-muted" />
    </div>
  ),
  deliveredCount: <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  createdAt: (
    <div className="space-y-1.5">
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="h-3 w-14 animate-pulse rounded bg-muted" />
    </div>
  ),
  createdBy:     <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  actions:       <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: ColumnDef<Campaign>[] = [
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
      <div className="text-muted-foreground text-xs">#{row.getValue("id")}</div>
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
      const campaign = row.original
      const name: string = row.getValue("name")
      return (
        <div className="flex items-stretch gap-2.5">
          <EntityAccentBar seed={campaign.id} />
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{campaign.subject}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "audienceFilter",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Audiencia {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const v: string = row.getValue("audienceFilter")
      const cfg = audienceConfig[v]
      return (
        <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", cfg?.badge ?? "bg-muted text-muted-foreground")}>
          {cfg?.label ?? v}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Estado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const s: string = row.getValue("status")
      const cfg = statusConfig[s]
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", cfg?.badge ?? "bg-muted text-muted-foreground")}>
          <span className={cn("size-1.5 rounded-full", cfg?.dot ?? "bg-muted-foreground")} />
          {cfg?.label ?? s}
        </span>
      )
    },
  },
  {
    accessorKey: "sentCount",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Métricas {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const { status, sentCount, openedCount, clickedCount } = row.original
      if (status === "draft" || status === "failed") {
        return <div className="text-xs text-muted-foreground">—</div>
      }
      return (
        <div className="leading-tight">
          <div className="text-sm font-medium">{sentCount.toLocaleString()} enviados</div>
          <div className="text-xs text-muted-foreground">
            {openedCount.toLocaleString()} abiertos · {clickedCount.toLocaleString()} clics
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "deliveredCount",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Entregados {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const v: number = row.getValue("deliveredCount")
      return <div className="text-sm">{v > 0 ? v.toLocaleString() : "—"}</div>
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Fecha {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const { sentAt, createdAt } = row.original
      const date = sentAt ?? createdAt
      return (
        <div className="leading-tight">
          <div className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div className="text-xs text-muted-foreground/60">{sentAt ? "Enviada" : "Creada"}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "createdBy",
    header: "Creado por",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("createdBy")}</div>
    ),
  },
]

function makeActionsColumn(
  onPreview: (id: number) => void,
  onResend: (id: number) => void,
  onDelete: (id: number) => void,
): ColumnDef<Campaign> {
  return {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onPreview(row.original.id)}>
              <EyeIcon /> Ver campaña
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResend(row.original.id)}>
              <RefreshCwIcon /> Reenviar
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2Icon /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  }
}

// ─── Resend mapping ──────────────────────────────────────────────────────────

function audienceFilterToForm(c: CampaignRaw): Partial<CampaignFormState> {
  const hasBlocks = Array.isArray(c.blocks_json) && c.blocks_json.length > 0
  const base: Partial<CampaignFormState> = {
    name: c.name,
    subject: c.subject,
    contentMode: hasBlocks ? "blocks" : "html",
    blocks: hasBlocks ? (c.blocks_json as unknown as CampaignFormState["blocks"]) : [],
    htmlContent: hasBlocks ? "" : (c.content ?? ""),
  }

  switch (c.audience_filter) {
    case "all":
    case "recent":
      return { ...base, audienceMode: "crm", crmFilter: c.audience_filter as "all" | "recent" }
    case "custom_list":
      return {
        ...base,
        audienceMode: "custom",
        customRecipients: (c.custom_recipients ?? []).map((r, i) => ({ id: `resend-${i}`, name: r.name, email: r.email })),
      }
    case "organization":
    case "specific":
    default:
      // No se puede reconstruir la selección exacta — el usuario debe reseleccionar.
      return { ...base, audienceMode: "crm", crmFilter: "all" }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CampaignsTable() {
  const [data, setData] = React.useState<Campaign[]>([])
  const [total, setTotal] = React.useState(0)
  const [dailyUsage, setDailyUsage] = React.useState<{ used: number; limit: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [audienceFilter, setAudienceFilter] = React.useState("any")
  const [query, setQuery] = React.useState<QueryState>({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [rowSelection, setRowSelection] = React.useState({})
  const [createOpen, setCreateOpen] = React.useState(false)
  const [resendForm, setResendForm] = React.useState<Partial<CampaignFormState> | null>(null)
  const [previewId, setPreviewId] = React.useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const handlePreview = React.useCallback((id: number) => {
    setPreviewId(id)
    setPreviewOpen(true)
  }, [])

  const handleResend = React.useCallback(async (id: number) => {
    const campaign = await campaignService.getById(id)
    setResendForm(audienceFilterToForm(campaign))
    setCreateOpen(true)
  }, [])

  const handleDelete = React.useCallback(async (id: number) => {
    const ok = await confirmDialog({
      title: "¿Eliminar campaña?",
      description: "Esta acción es irreversible. Los datos de seguimiento también se eliminarán.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) return
    try {
      setData((prev) => prev.filter((c) => c.id !== id))
      setTotal((prev) => prev - 1)
      await campaignService.delete(id)
      notify.success({ title: "Campaña eliminada", description: "La campaña fue eliminada correctamente." })
    } catch {
      notify.error({ title: "Error al eliminar", description: "No se pudo eliminar la campaña." })
      setQuery((q) => ({ ...q }))
    }
  }, [])

  const tableColumns = React.useMemo(
    () => [...columns, makeActionsColumn(handlePreview, handleResend, handleDelete)],
    [handlePreview, handleResend, handleDelete],
  )

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    campaignService
      .list({ page: query.page, limit: query.pageSize })
      .then((res) => {
        if (cancelled) return
        setData(res.data.map(mapCampaign))
        setTotal(res.total)
        setDailyUsage(res.dailyUsage)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [query])

  // Client-side sobre la página cargada — el backend todavía no tiene params
  // de búsqueda ni de audiencia (solo page/limit).
  const visibleData = React.useMemo(() => {
    return data.filter((c) => {
      if (audienceFilter !== "any" && c.audienceFilter !== audienceFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
      }
      return true
    })
  }, [data, search, audienceFilter])

  const table = useReactTable({
    data: visibleData,
    columns: tableColumns,
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

  const hasActiveFilters = !!search || audienceFilter !== "any"

  function resetFilters() {
    setSearch("")
    setAudienceFilter("any")
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
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Crear Campaña</Button>
      </div>

      {/* Row 2 — filters */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="relative w-44 shrink-0">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar campaña..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <SingleSelectFilter
          title="Audiencia"
          options={AUDIENCE_OPTIONS}
          selected={audienceFilter}
          onChange={setAudienceFilter}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
            <XIcon className="size-3.5" />
            Restablecer
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {dailyUsage && (
            <span className={cn(
              "text-xs tabular-nums px-2 py-1 rounded-md border",
              dailyUsage.used >= dailyUsage.limit
                ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                : dailyUsage.used >= dailyUsage.limit * 0.8
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-border bg-muted/50 text-muted-foreground"
            )}>
              {dailyUsage.used.toLocaleString()} / {dailyUsage.limit.toLocaleString()} hoy
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {loading ? "…" : `${total} campañas`}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
              Columnas <ChevronDown className="ml-1.5 size-3.5" />
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
      </div>

      <CreateCampaignSheet
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) setResendForm(null) }}
        onSuccess={() => setQuery((q) => ({ ...q, page: 1 }))}
        initialForm={resendForm ?? undefined}
      />

      <CampaignPreviewSheet
        campaignId={previewId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onResend={async (c) => {
          setPreviewOpen(false)
          setResendForm(audienceFilterToForm(c))
          setCreateOpen(true)
        }}
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
