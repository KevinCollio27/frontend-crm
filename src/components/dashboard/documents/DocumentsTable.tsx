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
  DownloadIcon,
  EyeIcon,
  Link2,
  MoreHorizontal,
  PencilIcon,
  PlusCircleIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import {
  FaRegFile,
  FaRegFileExcel,
  FaRegFileImage,
  FaRegFilePdf,
  FaRegFilePowerpoint,
  FaRegFileWord,
  FaRegFileZipper,
} from "react-icons/fa6"
import * as React from "react"

import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocumentPreviewSheet } from "./DocumentPreviewSheet"
import { documentService } from "@/services/document.service"
import type { DocumentRaw } from "@/types/document"
import { getSortIcon } from "@/lib/table-utils"

export interface Document {
  id: number
  name: string
  description: string
  fileType: string
  fileSize: number | null
  category: string
  visibility: string
  uploadedBy: string
  createdAt: string
}

function mapDocument(d: DocumentRaw): Document {
  return {
    id: d.id,
    name: d.name,
    description: d.description ?? "",
    fileType: d.file_type,
    fileSize: d.file_size,
    category: d.category ?? "",
    visibility: d.visibility,
    uploadedBy: d.user?.name ?? "",
    createdAt: (d.created_at ?? "").slice(0, 10),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileConfig: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  pdf:  { icon: FaRegFilePdf,        iconClass: "text-red-600 dark:text-red-400",       bgClass: "bg-red-50 dark:bg-red-950"       },
  png:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950"     },
  jpg:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950"     },
  jpeg: { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950"     },
  svg:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950"     },
  docx: { icon: FaRegFileWord,       iconClass: "text-sky-600 dark:text-sky-400",       bgClass: "bg-sky-50 dark:bg-sky-950"       },
  doc:  { icon: FaRegFileWord,       iconClass: "text-sky-600 dark:text-sky-400",       bgClass: "bg-sky-50 dark:bg-sky-950"       },
  xlsx: { icon: FaRegFileExcel,      iconClass: "text-green-600 dark:text-green-400",   bgClass: "bg-green-50 dark:bg-green-950"   },
  xls:  { icon: FaRegFileExcel,      iconClass: "text-green-600 dark:text-green-400",   bgClass: "bg-green-50 dark:bg-green-950"   },
  pptx: { icon: FaRegFilePowerpoint, iconClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-950" },
  ppt:  { icon: FaRegFilePowerpoint, iconClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-950" },
  zip:  { icon: FaRegFileZipper,     iconClass: "text-yellow-600 dark:text-yellow-400", bgClass: "bg-yellow-50 dark:bg-yellow-950" },
  rar:  { icon: FaRegFileZipper,     iconClass: "text-yellow-600 dark:text-yellow-400", bgClass: "bg-yellow-50 dark:bg-yellow-950" },
  link: { icon: Link2,               iconClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-50 dark:bg-violet-950" },
}

const fileTypeBadge: Record<string, string> = {
  pdf:  "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  png:  "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  jpg:  "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  jpeg: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  docx: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  doc:  "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  xlsx: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  xls:  "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  pptx: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  ppt:  "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  link: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
}

const categoryLabels: Record<string, string> = {
  contrato:     "Contrato",
  factura:      "Factura",
  presentacion: "Presentación",
  manual:       "Manual",
  otro:         "Otro",
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "contrato",     label: "Contrato"      },
  { value: "factura",      label: "Factura"       },
  { value: "presentacion", label: "Presentación"  },
  { value: "manual",       label: "Manual"        },
  { value: "otro",         label: "Otro"          },
]

const VISIBILITY_OPTIONS = [
  { value: "public",  label: "Público"  },
  { value: "private", label: "Privado"  },
]

function SimpleFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: { value: string; label: string }[]
  selected: string | null
  onChange: (v: string | null) => void
}) {
  const selectedLabel = options.find((o) => o.value === selected)?.label

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <PlusCircleIcon className="size-4" />
        {title}
        {selected !== null && (
          <>
            <Separator orientation="vertical" className="mx-1 data-vertical:h-4 data-vertical:self-auto" />
            <span className="inline-block max-w-28 truncate align-middle rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {selectedLabel ?? selected}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected === opt.value}
            onCheckedChange={() => onChange(selected === opt.value ? null : opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selected !== null && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange(null)}
            >
              Limpiar filtro
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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

function getColumns(onPreview: (doc: Document) => void): ColumnDef<Document>[] {
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
        const config = fileConfig[fileType] ?? { icon: FaRegFile, iconClass: "text-muted-foreground", bgClass: "bg-muted" }
        const Icon = config.icon
        return (
          <div className="flex items-center gap-2.5">
            <div className={`flex size-6 shrink-0 items-center justify-center rounded ${config.bgClass}`}>
              <Icon className={`size-3.5 ${config.iconClass}`} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{name}</div>
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
        return (
          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium uppercase ${fileTypeBadge[ft] ?? "bg-muted text-muted-foreground"}`}>
            {ft}
          </span>
        )
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
        return (
          <div className="text-sm text-muted-foreground">
            {(categoryLabels[cat] ?? cat) || "—"}
          </div>
        )
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
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            v === "public"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-muted text-muted-foreground"
          }`}>
            {v === "public" ? "Público" : "Privado"}
          </span>
        )
      },
    },
    {
      accessorKey: "uploadedBy",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Subido por {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.getValue("uploadedBy") || "—"}</div>
      ),
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
                <DropdownMenuItem>
                  <DownloadIcon />
                  Descargar
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
  uploadedBy: <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
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
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(
      () => setQuery((q) => ({ ...q, page: 1, search: searchInput })),
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
  }, [query])

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

  const columns = React.useMemo(
    () => getColumns((doc) => { setSelectedDocument(doc); setSheetOpen(true) }),
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
      <div className="flex items-center gap-2 py-4">
        <Input
          className="max-w-sm"
          placeholder="Buscar documento..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <SimpleFilter
          title="Categoría"
          options={CATEGORY_OPTIONS}
          selected={query.category}
          onChange={(v) => setQuery((q) => ({ ...q, page: 1, category: v }))}
        />
        <SimpleFilter
          title="Visibilidad"
          options={VISIBILITY_OPTIONS}
          selected={query.visibility}
          onChange={(v) => setQuery((q) => ({ ...q, page: 1, visibility: v }))}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8" onClick={resetFilters}>
            Reset
            <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} documentos</span>
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
          <Button>
            <PlusIcon className="size-4" />
            Subir Documento
          </Button>
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

      <div className="py-4">
        <DataTablePagination table={table} />
      </div>

      <DocumentPreviewSheet
        document={selectedDocument}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
