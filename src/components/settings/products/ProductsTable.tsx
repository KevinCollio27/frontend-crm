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
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react"
import { getSortIcon } from "@/lib/table-utils"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import { productConfirm } from "@/lib/confirm"
import { productNotify } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
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
import { productService } from "@/services/product.service"
import type { ProductRaw } from "@/types/product"
import { ChipList } from "@/components/ui/chip-list"
import { CreateProductSheet } from "./CreateProductSheet"
import type { ProductFormState, ProductLabelType } from "./shared/form-state"

// ─── Entity ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number
  name: string
  labels: string[]
  createdAt: string
  raw: ProductRaw
}

// ─── Map ─────────────────────────────────────────────────────────────────────

function mapProduct(r: ProductRaw): Product {
  return {
    id: r.id,
    name: r.name,
    labels: r.product_label?.map((l) => l.name) ?? [],
    createdAt: new Date(r.created_at).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    raw: r,
  }
}

function productToFormValues(product: Product): ProductFormState {
  return {
    id: product.raw.id,
    name: product.raw.name,
    labels: (product.raw.product_label ?? [])
      .slice()
      .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
      .map((l) => ({
        id: String(l.id),
        name: l.name,
        type: l.type as ProductLabelType,
        options: (l.product_label_option ?? [])
          .slice()
          .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
          .map((o) => ({
            id: String(o.id),
            value: o.value,
          })),
      })),
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  id:        "ID",
  name:      "Nombre",
  labels:    "Etiquetas",
  createdAt: "Creado el",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  id: <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
    </div>
  ),
  labels: (
    <div className="flex gap-1.5">
      <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
    </div>
  ),
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="ml-auto size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void,
  onDuplicate: (product: Product) => void,
  isAdmin: boolean
): ColumnDef<Product>[] {
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
          <span className="text-sm font-medium self-center">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "labels",
    header: "Etiquetas",
    enableSorting: false,
    cell: ({ row }) => <ChipList items={row.getValue("labels")} />,
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
      if (!isAdmin) return null
      const product = row.original
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{product.name}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <PencilIcon />
                  Editar producto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(product)}>
                  <CopyIcon />
                  Duplicar producto
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(product)}>
                <Trash2Icon />
                Eliminar producto
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

export function ProductsTable() {
  const isAdmin = useIsWorkspaceAdmin()
  const [data, setData]       = React.useState<Product[]>([])
  const [total, setTotal]     = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch]   = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [query, setQuery]     = React.useState<QueryState>({ page: 1, pageSize: 10, search: "" })
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<ProductFormState | undefined>(undefined)

  async function handleDelete(product: Product) {
    let t0 = Date.now()
    console.log(`[product] checkCanDelete start id=${product.id}`)
    const { canDelete, message } = await productService.checkCanDelete(product.id)
    console.log(`[product] checkCanDelete OK → ${Date.now() - t0}ms`)
    if (!canDelete) {
      await productConfirm.blockedByOpportunity(message)
      return
    }
    const confirmed = await productConfirm.delete(product.name)
    if (!confirmed) return
    try {
      t0 = Date.now()
      console.log(`[product] delete start id=${product.id}`)
      await productService.delete(product.id)
      console.log(`[product] delete OK → ${Date.now() - t0}ms`)
      productNotify.deleted(product.name)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      productNotify.error((error as { message?: string })?.message ?? "No se pudo eliminar el producto.")
    }
  }

  async function handleDuplicate(product: Product) {
    const t0 = Date.now()
    console.log(`[product] duplicate start id=${product.id}`)
    try {
      const duplicated = await productService.duplicate(product.id)
      console.log(`[product] duplicate OK → ${Date.now() - t0}ms`)
      productNotify.created(duplicated.name)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      productNotify.error((error as { message?: string })?.message ?? "No se pudo duplicar el producto.")
    }
  }

  const columns = React.useMemo(
    () =>
      getColumns(
        (product) => {
          setEditingProduct(productToFormValues(product))
          setCreateOpen(true)
        },
        (product) => handleDelete(product),
        (product) => handleDuplicate(product),
        isAdmin
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

    productService
      .list({ page: query.page, take: query.pageSize, filter: query.search || undefined })
      .then((page) => {
        if (cancelled) return
        setData(page.data.map(mapProduct))
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-full sm:max-w-xs"
          placeholder="Filtrar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {total} producto{total !== 1 ? "s" : ""}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Settings2Icon className="size-4" />
              Visualización
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
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setEditingProduct(undefined)
                setCreateOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Crear Producto</span>
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
                  Sin productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      <CreateProductSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        product={editingProduct}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
