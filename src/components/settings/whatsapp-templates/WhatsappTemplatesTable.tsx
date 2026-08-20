"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown, CopyIcon, EyeIcon, MoreHorizontalIcon, PlusIcon, RefreshCwIcon, SearchIcon, SendIcon, Settings2Icon, Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon } from "@/lib/table-utils"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import { useIsMobile } from "@/hooks/use-mobile"
import { whatsappTemplateConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
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
import { whatsappService } from "@/services/whatsapp.service"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"
import { CreateWhatsappTemplateSheet, type TemplatePrefill } from "./CreateWhatsappTemplateSheet"
import { PreviewWhatsappTemplateSheet } from "./PreviewWhatsappTemplateSheet"
import { SendWhatsappTemplateSheet } from "./SendWhatsappTemplateSheet"
import { parseTemplateForPreview } from "./WhatsAppTemplatePreview"

// ─── Entity ───────────────────────────────────────────────────────────────────

interface Row {
  name:     string
  language: string
  category: string
  status:   string
  bodyText: string
  raw:      WhatsappTemplateRaw
}

function bodyTextOf(t: WhatsappTemplateRaw): string {
  if (t.body_text) return t.body_text
  return t.components?.find((c) => c.type === "BODY")?.text ?? ""
}

function mapTemplate(t: WhatsappTemplateRaw): Row {
  return {
    name:     t.name,
    language: t.language,
    category: t.category ?? "—",
    status:   t.status,
    bodyText: bodyTextOf(t),
    raw:      t,
  }
}

const COLUMN_LABELS: Record<string, string> = {
  name:     "Nombre",
  language: "Idioma",
  category: "Categoría",
  status:   "Estado",
  bodyText: "Mensaje",
}

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  language: false,
  category: false,
  bodyText: false,
}

const STATUS_BADGE: Record<string, string> = {
  APPROVED: "bg-green-600",
  PENDING:  "bg-amber-500",
  REJECTED: "bg-red-500",
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  name:     <div className="h-4 w-40 animate-pulse rounded bg-muted" />,
  language: <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />,
  category: <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  status:   <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  bodyText: <div className="h-4 w-48 animate-pulse rounded bg-muted" />,
  actions:  <div className="ml-auto size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(
  onPreview:   (row: Row) => void,
  onSend:      (row: Row) => void,
  onDuplicate: (row: Row) => void,
  onDelete:    (row: Row) => void,
  isAdmin:     boolean,
): ColumnDef<Row>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Nombre {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "language",
      header: "Idioma",
      cell: ({ row }) => <Badge variant="secondary" className="text-xs">{row.getValue("language")}</Badge>,
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge className={`text-xs ${STATUS_BADGE[status] ?? "bg-slate-400"}`}>{status}</Badge>
      },
    },
    {
      accessorKey: "bodyText",
      header: "Mensaje",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-xs truncate text-xs text-muted-foreground">{row.getValue("bodyText")}</span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const template = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onPreview(template)}>
                    <EyeIcon />
                    Vista previa
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={template.status !== "APPROVED"} onClick={() => onSend(template)}>
                    <SendIcon />
                    Enviar mensaje
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => onDuplicate(template)}>
                      <CopyIcon />
                      Duplicar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(template)}>
                      <Trash2Icon />
                      Eliminar template
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsappTemplatesTable() {
  const isAdmin = useIsWorkspaceAdmin()
  const [data, setData]       = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)
  const [filter, setFilter]   = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [duplicatePrefill, setDuplicatePrefill] = React.useState<TemplatePrefill | null>(null)
  const [sendTarget, setSendTarget] = React.useState<WhatsappTemplateRaw | null>(null)
  const [previewTarget, setPreviewTarget] = React.useState<WhatsappTemplateRaw | null>(null)
  const [visualizacionOpen, setVisualizacionOpen] = React.useState(false)

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    whatsappService.getCachedTemplates({ limit: 200 })
      .then((res) => { if (!cancelled) setData(res.templates.map(mapTemplate)) })
      .catch(() => { if (!cancelled) setData([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await whatsappService.syncTemplates()
      notify.success({ title: "Templates sincronizados", description: `${res.syncedCount ?? 0} templates` })
      setRefreshKey((k) => k + 1)
    } catch (error) {
      notify.error({ title: "No se pudo sincronizar", description: (error as { message?: string })?.message ?? "Intenta de nuevo." })
    } finally {
      setSyncing(false)
    }
  }

  async function handleDelete(row: Row) {
    if (!row.raw.template_id) return
    const confirmed = await whatsappTemplateConfirm.delete(row.name)
    if (!confirmed) return
    try {
      await whatsappService.deleteTemplate(row.raw.template_id)
      notify.success({ title: "Template eliminado", description: `"${row.name}" fue eliminado.` })
      setRefreshKey((k) => k + 1)
    } catch (error) {
      notify.error({
        title: "No se pudo eliminar",
        description: (error as { message?: string; extraMessage?: string })?.extraMessage
          ?? (error as { message?: string })?.message
          ?? "Intenta de nuevo.",
      })
    }
  }

  function handleDuplicate(row: Row) {
    const parsed = parseTemplateForPreview(row.raw)
    setDuplicatePrefill({
      language: row.raw.language,
      category: row.raw.category ?? "UTILITY",
      headerMode: parsed.headerMode,
      headerText: parsed.headerText,
      headerImageUrl: parsed.headerImageUrl,
      bodyText: parsed.bodyText,
      footerText: parsed.footerText,
      buttons: parsed.buttons.map((b) => ({ text: b.text, url: b.url ?? "" })),
    })
    setCreateOpen(true)
  }

  const columns = React.useMemo(
    () => getColumns((row) => setPreviewTarget(row.raw), (row) => setSendTarget(row.raw), handleDuplicate, handleDelete, isAdmin),
    [isAdmin],
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnVisibility },
    globalFilterFn: (row, _id, value: string) =>
      row.original.name.toLowerCase().includes(value.toLowerCase()),
  })

  React.useEffect(() => {
    table.setGlobalFilter(filter)
  }, [filter])

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative w-full shrink-0 md:w-44">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nombre..."
            className="h-8 pl-8 text-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          {!loading && (
            <span className="w-full text-sm text-muted-foreground md:w-auto">
              {table.getFilteredRowModel().rows.length} template{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
            </span>
          )}
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
            <Button variant="outline" size="sm" className="w-full md:w-auto gap-1.5" onClick={handleSync} disabled={syncing}>
              <RefreshCwIcon className={`size-4 ${syncing ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" className="w-full md:w-auto" onClick={() => { setDuplicatePrefill(null); setCreateOpen(true) }}>
              <PlusIcon className="size-4" />
              Template
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id ?? (col as { accessorKey?: string }).accessorKey}>
                      {skeletonCell[col.id ?? (col as { accessorKey?: string }).accessorKey ?? ""] ?? <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />}
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
                  Sin templates sincronizados todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && <DataTablePagination table={table} />}

      <CreateWhatsappTemplateSheet
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) setDuplicatePrefill(null) }}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        prefill={duplicatePrefill ?? undefined}
      />

      {sendTarget && (
        <SendWhatsappTemplateSheet
          open={sendTarget !== null}
          onOpenChange={(open) => { if (!open) setSendTarget(null) }}
          template={sendTarget}
        />
      )}

      {previewTarget && (
        <PreviewWhatsappTemplateSheet
          open={previewTarget !== null}
          onOpenChange={(open) => { if (!open) setPreviewTarget(null) }}
          template={previewTarget}
        />
      )}
    </div>
  )
}
