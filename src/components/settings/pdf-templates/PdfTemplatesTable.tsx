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
} from "@tanstack/react-table"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, StarIcon, StarOffIcon, Trash2Icon } from "lucide-react"
import { getSortIcon } from "@/lib/table-utils"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import { pdfTemplateConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  DropdownMenu,
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
import { pdfTemplateService } from "@/services/pdfTemplate.service"
import type { PdfTemplate } from "@/types/pdfTemplate"
import { CreatePdfTemplateSheet } from "./CreatePdfTemplateSheet"
import { PdfTemplatePreviewSheet } from "./PdfTemplatePreviewSheet"

// ─── Entity ───────────────────────────────────────────────────────────────────

interface Row {
  id:        number
  name:      string
  isDefault: boolean
  before:    number
  after:     number
  createdAt: string
  raw:       PdfTemplate
}

function mapTemplate(t: PdfTemplate): Row {
  const blocks = t.blocks ?? []
  return {
    id:        t.id,
    name:      t.name,
    isDefault: t.is_default,
    before:    blocks.filter((b) => b.position === "before").length,
    after:     blocks.filter((b) => b.position === "after").length,
    createdAt: new Date(t.created_at).toLocaleDateString("es-CL", {
      day: "numeric", month: "short", year: "numeric",
    }),
    raw: t,
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  id:        <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name:      <div className="h-4 w-40 animate-pulse rounded bg-muted" />,
  isDefault: <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />,
  blocks:    <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="ml-auto size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(
  onPreview:    (row: Row) => void,
  onEdit:       (row: Row) => void,
  onSetDefault: (row: Row) => void,
  onDelete:     (row: Row) => void,
  isAdmin:      boolean,
): ColumnDef<Row>[] {
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
      cell: ({ row }) => (
        <div className="flex items-stretch gap-2.5">
          <EntityAccentBar seed={row.original.id} />
          <span className="text-sm font-medium self-center">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "isDefault",
      header: "Predeterminada",
      cell: ({ row }) =>
        row.getValue("isDefault") ? (
          <Badge variant="secondary" className="gap-1">
            <StarIcon className="size-3 fill-current" /> Predeterminada
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "blocks",
      header: "Bloques",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.before} antes · {row.original.after} después
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Creada {getSortIcon(column.getIsSorted())}
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
                  <DropdownMenuLabel>{template.name}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onPreview(template)}>
                    <EyeIcon />
                    Vista previa
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <PencilIcon />
                      Editar plantilla
                    </DropdownMenuItem>
                  )}
                  {isAdmin && !template.isDefault && (
                    <DropdownMenuItem onClick={() => onSetDefault(template)}>
                      <StarOffIcon />
                      Marcar como predeterminada
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(template)}>
                      <Trash2Icon />
                      Eliminar plantilla
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

export function PdfTemplatesTable() {
  const isAdmin = useIsWorkspaceAdmin()
  const [data, setData]       = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter]   = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingTemplate, setEditingTemplate] = React.useState<PdfTemplate | undefined>(undefined)
  const [previewTemplate, setPreviewTemplate] = React.useState<PdfTemplate | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    pdfTemplateService.getAll()
      .then((res) => { if (!cancelled) setData(res.map(mapTemplate)) })
      .catch(() => { if (!cancelled) setData([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey])

  async function handleSetDefault(row: Row) {
    const previous = data
    setData((prev) => prev.map((r) => ({ ...r, isDefault: r.id === row.id })))
    try {
      await pdfTemplateService.setDefault(row.id)
      notify.success({ title: "Plantilla predeterminada", description: `"${row.name}" es ahora la plantilla por defecto.` })
    } catch (error) {
      setData(previous)
      notify.error({ title: "No se pudo actualizar", description: (error as { message?: string })?.message ?? "Intenta de nuevo." })
    }
  }

  async function handleDelete(row: Row) {
    const confirmed = await pdfTemplateConfirm.delete(row.name, row.isDefault)
    if (!confirmed) return
    try {
      await pdfTemplateService.remove(row.id)
      notify.success({ title: "Plantilla eliminada", description: `"${row.name}" fue eliminada.` })
      setRefreshKey((k) => k + 1)
    } catch (error) {
      notify.error({ title: "No se pudo eliminar", description: (error as { message?: string })?.message ?? "Intenta de nuevo." })
    }
  }

  const columns = React.useMemo(
    () => getColumns(
      (row) => setPreviewTemplate(row.raw),
      (row) => { setEditingTemplate(row.raw); setCreateOpen(true) },
      handleSetDefault,
      handleDelete,
      isAdmin,
    ),
    [isAdmin],
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    globalFilterFn: (row, _id, value: string) =>
      row.original.name.toLowerCase().includes(value.toLowerCase()),
  })

  React.useEffect(() => {
    table.setGlobalFilter(filter)
  }, [filter])

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-full sm:max-w-xs"
          placeholder="Filtrar por nombre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-2">
          {!loading && (
            <span className="hidden sm:block text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} plantilla{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
            </span>
          )}
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => { setEditingTemplate(undefined); setCreateOpen(true) }}
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Plantilla</span>
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
                  Sin plantillas creadas todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && <DataTablePagination table={table} />}

      <CreatePdfTemplateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        entity={editingTemplate}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <PdfTemplatePreviewSheet
        open={previewTemplate !== null}
        onOpenChange={(open) => { if (!open) setPreviewTemplate(null) }}
        template={previewTemplate}
      />
    </div>
  )
}
