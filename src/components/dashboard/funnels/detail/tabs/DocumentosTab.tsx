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
import {
  ChevronDown,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon } from "@/lib/table-utils"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
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
import { fileOpportunityService } from "@/services/file-opportunity.service"
import { FileOpportunitySheet } from "../sheets/FileOpportunitySheet"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { useIsMobile } from "@/hooks/use-mobile"
import type { FileOpportunityRaw } from "@/types/file-opportunity"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "file"
}

const FILE_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  pdf:  { bg: "bg-red-100",     color: "text-red-600"     },
  docx: { bg: "bg-blue-100",    color: "text-blue-600"    },
  doc:  { bg: "bg-blue-100",    color: "text-blue-600"    },
  xlsx: { bg: "bg-emerald-100", color: "text-emerald-600" },
  xls:  { bg: "bg-emerald-100", color: "text-emerald-600" },
  pptx: { bg: "bg-orange-100",  color: "text-orange-600"  },
  ppt:  { bg: "bg-orange-100",  color: "text-orange-600"  },
}

const COLUMN_LABELS: Record<string, string> = {
  id:         "ID",
  name:       "Nombre",
  created_at: "Fecha",
}

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:         false,
  created_at: false,
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select: <div className="size-4 animate-pulse rounded bg-muted" />,
  id:     <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-10 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  created_at: <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />,
  actions:    <div className="size-7 animate-pulse rounded bg-muted" />,
}

function TableSkeleton({ visibleIds }: { visibleIds: string[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {visibleIds.map((id) => (
            <TableCell key={id}>
              {skeletonCell[id] ?? <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(
  onDownload: (row: FileOpportunityRaw) => void,
  onEdit:     (row: FileOpportunityRaw) => void,
  onDelete:   (row: FileOpportunityRaw) => void,
): ColumnDef<FileOpportunityRaw>[] {
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
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue("id")}</span>
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
        const doc  = row.original
        const ext  = getExtension(doc.file_name)
        const conf = FILE_TYPE_STYLE[ext] ?? { bg: "bg-muted", color: "text-muted-foreground" }
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", conf.bg)}>
              <FileTextIcon className={cn("size-3.5", conf.color)} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{doc.name}</div>
              <div className="text-xs uppercase text-muted-foreground">{ext}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Fecha {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at") as string)
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onDownload(row.original)}>
                <DownloadIcon /> Descargar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilIcon /> Editar
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2Icon /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  opportunityId: number
}

export function DocumentosTab({ opportunityId }: Props) {
  const [data, setData]               = React.useState<FileOpportunityRaw[]>([])
  const [loading, setLoading]         = React.useState(true)
  const [downloading, setDownloading] = React.useState<number | null>(null)
  const [createOpen, setCreateOpen]   = React.useState(false)
  const [editEntity, setEditEntity]   = React.useState<FileOpportunityRaw | null>(null)
  const [sorting, setSorting]         = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection]         = React.useState({})
  const [filter, setFilter]           = React.useState("")
  const [refreshKey, setRefreshKey]   = React.useState(0)

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

  // Evento real es "opportunity_file" (con guion bajo, no "-") — ver
  // fileOpportunity.service.ts. Trae opportunity_id en las 3 acciones.
  useEntityRealtime("opportunity_file", (payload) => {
    const changedOppId = (payload.data as { opportunity_id?: number | null })?.opportunity_id
    if (changedOppId !== opportunityId) return
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    fileOpportunityService
      .list(opportunityId)
      .then((res) => { if (!cancelled) setData(res.data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [opportunityId, refreshKey])

  async function handleDownload(row: FileOpportunityRaw) {
    if (downloading) return
    setDownloading(row.id)
    try {
      const url = await fileOpportunityService.getUrl(row.id)
      window.open(url, "_blank")
    } catch {
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete(row: FileOpportunityRaw) {
    const confirmed = await orgConfirm.delete(row.name)
    if (!confirmed) return
    setData((prev) => prev.filter((d) => d.id !== row.id))
    const t0 = Date.now()
    console.log(`[file-opp] delete start id=${row.id}`)
    fileOpportunityService.delete(row.id)
      .then(() => {
        console.log(`[file-opp] delete OK → ${Date.now() - t0}ms`)
        notify.success({ title: "Archivo eliminado", description: `"${row.name}" fue eliminado.` })
      })
      .catch(() => {
        setData((prev) => [row, ...prev])
        notify.error({ title: "Algo salió mal", description: "No se pudo eliminar el archivo." })
      })
  }

  const columns = React.useMemo(
    () => getColumns(handleDownload, setEditEntity, handleDelete),
    [downloading],
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange:          setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:     setRowSelection,
    getCoreRowModel:          getCoreRowModel(),
    getPaginationRowModel:    getPaginationRowModel(),
    getSortedRowModel:        getSortedRowModel(),
    state: { sorting, columnVisibility, rowSelection },
    globalFilterFn: (row, _id, value: string) =>
      row.original.name.toLowerCase().includes(value.toLowerCase()),
  })

  React.useEffect(() => {
    table.setGlobalFilter(filter)
  }, [filter])

  return (
    <div className="p-4">

      {/* Toolbar. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 pb-4 md:flex-row md:items-center">
        <Input
          className="h-8 w-full text-sm md:max-w-45"
          placeholder="Filtrar por nombre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          {!loading && (
            <span className="w-full text-sm text-muted-foreground md:w-auto">
              {table.getFilteredRowModel().rows.length} documento(s)
            </span>
          )}
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
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {COLUMN_LABELS[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" className="h-8 w-full gap-1.5 text-xs md:w-auto" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-3.5" /> Documento
          </Button>
        </div>
      </div>

      {/* Downloading indicator */}
      {downloading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Loader2Icon className="size-3.5 animate-spin" />
          Generando enlace de descarga...
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto rounded-md border">
        <Table className="table-fixed w-full">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={
                      h.column.id === "select"     ? "w-10"  :
                      h.column.id === "id"         ? "w-14"  :
                      h.column.id === "created_at" ? "w-36"  :
                      h.column.id === "actions"    ? "w-12"  :
                      undefined
                    }
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton visibleIds={table.getVisibleLeafColumns().map((c) => c.id)} />
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === "name" ? "overflow-hidden" : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  Sin documentos cargados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="pt-4">
          <DataTablePagination table={table} />
        </div>
      )}

      {createOpen && (
        <FileOpportunitySheet
          open
          onOpenChange={setCreateOpen}
          opportunityId={opportunityId}
          onSuccess={(created) => setData((prev) => [created, ...prev])}
        />
      )}

      {editEntity !== null && (
        <FileOpportunitySheet
          open
          onOpenChange={(v) => { if (!v) setEditEntity(null) }}
          opportunityId={opportunityId}
          entity={editEntity}
          onSuccess={(updated) => {
            setData((prev) => prev.map((d) => d.id === updated.id ? updated : d))
            setEditEntity(null)
          }}
        />
      )}

    </div>
  )
}
