"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table"
import {
  ChevronDown,
  Columns3Icon,
  DownloadIcon,
  EyeIcon,
  ListIcon,
  MoreHorizontal,
  PencilIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CategoryBadge } from "@/components/ui/category-badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SingleSelectFilter, type SingleSelectOption } from "@/components/ui/single-select-filter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocumentPreviewSheet } from "./DocumentPreviewSheet"
import { UploadDocumentSheet, type DocumentToEdit } from "./UploadDocumentSheet"
import { documentService } from "@/services/document.service"
import type { DocumentRaw } from "@/types/document"
import { useIsMobile } from "@/hooks/use-mobile"
import { getSortIcon, getInitials } from "@/lib/table-utils"
import { notify } from "@/lib/notify"
import { orgConfirm } from "@/lib/confirm"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { cn } from "@/lib/utils"
import { DEFAULT_FILE_TYPE_CONFIG, FILE_TYPE_CONFIG } from "./shared/file-type"
import { CATEGORY_LABEL } from "./shared/category"
import { VISIBILITY_CONFIG } from "./shared/visibility"

export interface Document {
  id: number
  name: string
  description: string
  fileType: string
  filePath: string
  fileSize: number | null
  category: string
  visibility: string
  uploadedBy: { name: string; avatarUrl: string | null } | null
  createdAt: string
}

function mapDocument(d: DocumentRaw): Document {
  return {
    id: d.id,
    name: d.name,
    description: d.description ?? "",
    fileType: d.file_type,
    filePath: d.file_path ?? "",
    fileSize: d.file_size,
    category: d.category ?? "",
    visibility: d.visibility,
    uploadedBy: d.user ? { name: d.user.name, avatarUrl: d.user.avatar_url } : null,
    createdAt: (d.created_at ?? "").slice(0, 10),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: SingleSelectOption[] = [
  { value: "all",          label: "Todas"         },
  { value: "contrato",     label: "Contrato"      },
  { value: "factura",      label: "Factura"       },
  { value: "presentacion", label: "Presentación"  },
  { value: "manual",       label: "Manual"        },
  { value: "otro",         label: "Otro"          },
]

const VISIBILITY_OPTIONS: SingleSelectOption[] = [
  { value: "all",     label: "Todas"    },
  { value: "public",  label: "Público"  },
  { value: "private", label: "Privado"  },
]

// ─── Tabla ────────────────────────────────────────────────────────────────────

const columnLabels: Record<string, string> = {
  id:         "ID",
  name:       "Nombre",
  fileType:   "Tipo",
  fileSize:   "Tamaño",
  category:   "Categoría",
  visibility: "Visibilidad",
  uploadedBy: "Subido por",
  createdAt:  "Creado",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  fileSize: false,
}

// En mobile no hay espacio para columnas de más — solo Nombre queda visible por
// defecto (Acciones y el checkbox de selección no dependen de esto, siempre se ven).
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:         false,
  fileType:   false,
  fileSize:   false,
  category:   false,
  visibility: false,
  uploadedBy: false,
  createdAt:  false,
}

function getColumns(
  onPreview: (doc: Document) => void,
  onDownload: (doc: Document) => void,
  onEdit: (doc: Document) => void,
  onDelete: (doc: Document) => void,
): ColumnDef<Document>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
          }
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
        const name: string = row.getValue("name")
        const description = row.original.description
        const fileType = row.original.fileType
        const config = FILE_TYPE_CONFIG[fileType] ?? DEFAULT_FILE_TYPE_CONFIG
        const Icon = config.icon
        return (
          <div className="flex items-center gap-2.5">
            <div className={`flex size-6 shrink-0 items-center justify-center rounded ${config.bgClass}`}>
              <Icon className={`size-3.5 ${config.iconClass}`} />
            </div>
            <div className="leading-tight min-w-0 max-w-70">
              <div className="truncate text-sm font-medium" title={name}>{name}</div>
              {description && (
                <div className="max-w-48 truncate text-xs text-muted-foreground">{description}</div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "fileType",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Tipo {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const ft: string = row.getValue("fileType")
        return <span className="text-sm text-muted-foreground uppercase">{ft}</span>
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Categoría {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const cat: string = row.getValue("category")
        if (!cat) return <span className="text-sm text-muted-foreground">—</span>
        return <CategoryBadge category={CATEGORY_LABEL[cat] ?? cat} />
      },
    },
    {
      accessorKey: "visibility",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Visibilidad {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const v: string = row.getValue("visibility")
        const conf = VISIBILITY_CONFIG[v] ?? VISIBILITY_CONFIG.private
        return (
          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", conf.className)}>
            {conf.label}
          </span>
        )
      },
    },
    {
      id: "uploadedBy",
      accessorFn: (row) => row.uploadedBy?.name ?? "",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Subido por {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const uploadedBy = row.original.uploadedBy
        if (!uploadedBy) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-6 shrink-0">
              <AvatarImage src={uploadedBy.avatarUrl ?? "https://github.com/shadcn.png"} alt={uploadedBy.name} />
              <AvatarFallback className="text-[9px] font-semibold">{getInitials(uploadedBy.name)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 max-w-36 truncate text-sm" title={uploadedBy.name}>{uploadedBy.name}</span>
          </div>
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
        <div className="text-sm text-muted-foreground">{row.getValue("createdAt")}</div>
      ),
    },
    {
      accessorKey: "fileSize",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Tamaño {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{formatSize(row.getValue("fileSize"))}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const doc = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onPreview(doc)}>
                  <EyeIcon />
                  Vista Previa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(doc)}>
                  <DownloadIcon />
                  Descargar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(doc)}>
                  <PencilIcon />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(doc)}
              >
                <Trash2Icon />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select: <div className="size-4 animate-pulse rounded bg-muted" />,
  id:     <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-6 shrink-0 animate-pulse rounded bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  fileType:   <div className="h-5 w-12 animate-pulse rounded bg-muted" />,
  category:   <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  visibility: <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />,
  uploadedBy: (
    <div className="flex items-center gap-2">
      <div className="size-6 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  ),
  createdAt:  <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  fileSize:   <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  actions:    <div className="size-8 animate-pulse rounded bg-muted" />,
}

interface QueryState {
  page: number
  pageSize: number
  search: string
  category: string | null
  visibility: string | null
}

export function DocumentsTable() {
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [columnsOpen, setColumnsOpen] = React.useState(false)
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    category: null,
    visibility: null,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    DEFAULT_COLUMN_VISIBILITY
  )
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null)
  const selectedDocumentRef = React.useRef<Document | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [editDoc, setEditDoc] = React.useState<DocumentToEdit | undefined>(undefined)
  const [editOpen, setEditOpen] = React.useState(false)

  // Tiempo real: si otra sesión sube/edita/elimina un documento en este
  // workspace, refresca la tabla sin esperar a un F5 manual. El evento vive
  // en workspaceDocument.service.ts, no en el controller.
  useEntityRealtime("workspace_document", () => setRefreshKey((k) => k + 1))

  React.useEffect(() => {
    const t = setTimeout(
      () => setQuery((q) => {
        if (q.search === searchInput) return q
        return { ...q, page: 1, search: searchInput }
      }),
      400
    )
    return () => clearTimeout(t)
  }, [searchInput])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    documentService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        category: query.category ?? undefined,
        visibility: query.visibility ?? undefined,
      })
      .then((res) => {
        if (cancelled) return
        setDocuments(res.data.map(mapDocument))
        setTotal(res.total)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, refreshKey])

  const pagination: PaginationState = { pageIndex: query.page - 1, pageSize: query.pageSize }

  const handlePagination = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => {
    const next = typeof updater === "function" ? updater(pagination) : updater
    setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
  }

  const hasActiveFilters = !!searchInput || query.category !== null || query.visibility !== null

  const resetFilters = () => {
    setSearchInput("")
    setQuery((q) => ({ ...q, page: 1, search: "", category: null, visibility: null }))
  }

  async function handleDownload(doc: Document) {
    if (doc.fileType === "link") {
      window.open(doc.filePath, "_blank")
      return
    }
    try {
      const url = await documentService.getUrl(doc.id)
      window.open(url, "_blank")
    } catch {
      notify.error({ title: "No se pudo obtener el enlace de descarga", description: "Intenta de nuevo." })
    }
  }

  function handleEdit(doc: Document) {
    setEditDoc({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      category: doc.category,
      visibility: doc.visibility,
    })
    setEditOpen(true)
  }

  async function handleDelete(doc: Document) {
    const confirmed = await orgConfirm.delete(doc.name)
    if (!confirmed) return
    setDocuments((ds) => ds.filter((d) => d.id !== doc.id))
    setTotal((t) => t - 1)
    if (selectedDocumentRef.current?.id === doc.id) setSheetOpen(false)
    try {
      await documentService.delete(doc.id)
      notify.success({ title: "Documento eliminado", description: "El archivo fue eliminado correctamente." })
    } catch {
      setRefreshKey((k) => k + 1)
      notify.error({ title: "No se pudo eliminar el documento", description: "Intenta de nuevo." })
    }
  }

  const columns = React.useMemo(
    () => getColumns(
      (doc) => { selectedDocumentRef.current = doc; setSelectedDocument(doc); setSheetOpen(true) },
      handleDownload,
      handleEdit,
      handleDelete,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: documents,
    columns,
    manualPagination: true,
    rowCount: total,
    onPaginationChange: handlePagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection, pagination },
  })

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
        <Button size="sm" onClick={() => setUploadOpen(true)}>+ Subir Documento</Button>
      </div>

      {/* Row 2 — búsqueda + toggle de filtros. En mobile se apila en filas propias
          en vez de forzar scroll horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar documento..."
              className="h-8 pl-8 text-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
                        onCheckedChange={(value) => col.toggleVisibility(!!value)}
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

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
                <XIcon className="size-3.5" />
                Restablecer
              </Button>
            )}
          </div>
        </div>

        <span className="md:ml-auto shrink-0 text-xs text-muted-foreground">{total} documentos</span>
      </div>

      {/* Row 3 — filtros avanzados, colapsados por defecto (botón "Filtros" en fila 2) */}
      {filtersOpen && (
        <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-2 md:flex-row md:items-center">
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Categoría"
                options={CATEGORY_OPTIONS}
                selected={query.category ?? "all"}
                onChange={(v) => setQuery((q) => ({ ...q, page: 1, category: v === "all" ? null : v }))}
              />
            </div>

            <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />

            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Visibilidad"
                options={VISIBILITY_OPTIONS}
                selected={query.visibility ?? "all"}
                onChange={(v) => setQuery((q) => ({ ...q, page: 1, visibility: v === "all" ? null : v }))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mx-4 mt-3 rounded-md border">
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

      <DocumentPreviewSheet
        document={selectedDocument}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDownload={() => selectedDocument && handleDownload(selectedDocument)}
        onEdit={() => selectedDocument && handleEdit(selectedDocument)}
        onDelete={() => selectedDocument && handleDelete(selectedDocument)}
      />

      <UploadDocumentSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <UploadDocumentSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        initialDoc={editDoc}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
