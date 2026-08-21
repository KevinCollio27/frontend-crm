"use client"

import { useRouter } from "next/navigation"
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
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDown,
  Columns3Icon,
  FileTextIcon,
  ListIcon,
  MoreHorizontal,
  PencilIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import * as React from "react"

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
import { getSortIcon } from "@/lib/table-utils"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { confirmDialog } from "@/lib/confirm"
import { blogService, type BlogListParams } from "@/services/blog.service"
import type { BlogRaw } from "@/types/blog"
import { CreateBlogSheet, blogRawToFormValues, type BlogFormValues } from "./CreateBlogSheet"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Blog {
  id: number
  name: string
  apiKey: string
  postCount: number
  isActive: boolean
  brandColor: string | null
  logoUrl: string | null
  allowedDomains: string | null
  createdAt: string
}

function mapBlog(d: BlogRaw): Blog {
  return {
    id: d.id,
    name: d.name,
    apiKey: d.api_key,
    postCount: d._count.blog_post,
    isActive: d.is_active,
    brandColor: d.brand_color,
    logoUrl: d.logo_url,
    allowedDomains: d.allowed_domains,
    createdAt: d.created_at,
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const columnLabels: Record<string, string> = {
  id:             "ID",
  name:           "Nombre",
  postCount:      "Artículos",
  isActive:       "Estado",
  createdAt:      "Fecha",
  brandColor:     "Color",
  logoUrl:        "Logo",
  allowedDomains: "Dominios",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  brandColor:     false,
  logoUrl:        false,
  allowedDomains: false,
}

// En mobile no hay espacio para columnas de más — solo Nombre queda visible por
// defecto (Acciones y el checkbox de selección no dependen de esto, siempre se ven).
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:             false,
  postCount:      false,
  isActive:       false,
  createdAt:      false,
  brandColor:     false,
  logoUrl:        false,
  allowedDomains: false,
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
    <div className="flex items-center gap-3">
      <div className="size-10 shrink-0 animate-pulse rounded-xl bg-muted" />
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
    </div>
  ),
  postCount: (
    <div className="flex items-center gap-1.5">
      <div className="size-3.5 animate-pulse rounded bg-muted" />
      <div className="h-4 w-8 animate-pulse rounded bg-muted" />
    </div>
  ),
  isActive:       <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  createdAt:      <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  brandColor: (
    <div className="flex items-center gap-2">
      <div className="size-4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
    </div>
  ),
  logoUrl:        <div className="h-4 w-8 animate-pulse rounded bg-muted" />,
  allowedDomains: <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  actions:        <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function getColumns(
  onEdit: (blog: Blog) => void,
  onManage: (blog: Blog) => void,
  onToggleActive: (blog: Blog) => void,
): ColumnDef<Blog>[] {
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
      const blog = row.original
      const name: string = row.getValue("name")
      return (
        <div className="flex items-stretch gap-2.5">
          <EntityAccentBar seed={blog.id} />
          <div className="min-w-0 max-w-56 truncate self-center text-sm font-medium" title={name}>{name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "postCount",
    header: "Artículos",
    cell: ({ row }) => {
      const count: number = row.getValue("postCount")
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileTextIcon className="size-3.5" />
          {count}
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
      const isActive: boolean = row.getValue("isActive")
      return (
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
          isActive
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        )}>
          <span className={cn("size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-zinc-400")} />
          {isActive ? "Activo" : "Inactivo"}
        </span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Fecha {getSortIcon(column.getIsSorted())}
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
    accessorKey: "brandColor",
    header: "Color",
    cell: ({ row }) => {
      const raw: string | null = row.getValue("brandColor")
      const color = raw?.split(";")[0]
      if (!color) return <span className="text-xs text-muted-foreground">—</span>
      return (
        <div className="flex items-center gap-2">
          <div className="size-4 rounded" style={{ backgroundColor: color }} />
          <span className="text-xs text-muted-foreground">{color}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "logoUrl",
    header: "Logo",
    cell: ({ row }) => {
      const url: string | null = row.getValue("logoUrl")
      return <span className="text-xs text-muted-foreground">{url ? "Sí" : "—"}</span>
    },
  },
  {
    accessorKey: "allowedDomains",
    header: "Dominios",
    cell: ({ row }) => {
      const domains: string | null = row.getValue("allowedDomains")
      if (!domains) return <span className="text-xs text-muted-foreground">—</span>
      return (
        <span className="block max-w-48 truncate text-xs text-muted-foreground" title={domains}>
          {domains}
        </span>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const blog = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onManage(blog)}>
                <BookOpenIcon />
                Gestionar Blog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(blog)}>
                <PencilIcon />
                Editar blog
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={blog.isActive ? "text-destructive focus:text-destructive" : "text-emerald-600 focus:text-emerald-600"}
              onClick={() => onToggleActive(blog)}
            >
              {blog.isActive ? <Trash2Icon /> : <CheckCircle2Icon />}
              {blog.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlogsTable() {
  const router = useRouter()
  const [data, setData] = React.useState<Blog[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    isActive: null,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [rowSelection, setRowSelection] = React.useState({})
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingBlog, setEditingBlog] = React.useState<BlogFormValues | undefined>(undefined)
  const [editingBlogId, setEditingBlogId] = React.useState<number | undefined>(undefined)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [columnsOpen, setColumnsOpen] = React.useState(false)

  const columns = React.useMemo(
    () =>
      getColumns(
        (blog) => {
          setEditingBlog(blogRawToFormValues({
            id: blog.id,
            name: blog.name,
            api_key: blog.apiKey,
            brand_color: blog.brandColor,
            is_active: blog.isActive,
            logo_url: blog.logoUrl,
            allowed_domains: blog.allowedDomains,
            created_at: blog.createdAt,
            updated_at: blog.createdAt,
            workspace_id: 0,
            _count: { blog_post: blog.postCount },
          }))
          setEditingBlogId(blog.id)
          setCreateOpen(true)
        },
        (blog) => router.push(`/marketing/blogs/${blog.id}`),
        async (blog) => {
          const activating = !blog.isActive
          const ok = await confirmDialog({
            title: activating ? "¿Activar blog?" : "¿Desactivar blog?",
            description: activating
              ? `"${blog.name}" volverá a estar activo.`
              : `"${blog.name}" dejará de estar activo. Podrás reactivarlo desde este mismo menú.`,
            confirmText: activating ? "Activar" : "Desactivar",
            cancelText: "Cancelar",
            tone: activating ? "info" : "warning",
          })
          if (!ok) return
          setData((prev) => prev.map((b) => b.id === blog.id ? { ...b, isActive: activating } : b))
          try {
            if (activating) {
              await blogService.update(blog.id, { is_active: true })
              notify.success({ title: "Blog activado", description: "El blog ya está visible públicamente." })
            } else {
              await blogService.deactivate(blog.id)
              notify.success({ title: "Blog desactivado", description: "El blog ya no es visible públicamente." })
            }
          } catch {
            notify.error({ title: `No se pudo ${activating ? "activar" : "desactivar"} el blog`, description: "Intenta de nuevo." })
            setData((prev) => prev.map((b) => b.id === blog.id ? { ...b, isActive: blog.isActive } : b))
          }
        },
      ),
    [router]
  )

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      const params: BlogListParams = {
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        is_active: query.isActive !== null ? query.isActive : undefined,
      }
      blogService
        .list(params)
        .then((res) => {
          if (cancelled) return
          setData(res.data.map(mapBlog))
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
  const hasFilters = !!query.search || query.isActive !== null

  const activeFilterValue =
    query.isActive === true ? "true" : query.isActive === false ? "false" : "all"

  function resetFilters() {
    setQuery((q) => ({ ...q, search: "", isActive: null, page: 1 }))
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
        <Button
          size="sm"
          onClick={() => {
            setEditingBlog(undefined)
            setCreateOpen(true)
          }}
        >
          + Nuevo Blog
        </Button>
      </div>

      {/* Row 2 — búsqueda + toggle de filtros. En mobile se apila en filas propias
          en vez de forzar scroll horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar blogs..."
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
          {loading ? "…" : `${total} blogs`}
        </span>
      </div>

      {/* Row 3 — filtros avanzados, colapsados por defecto (botón "Filtros" en fila 2) */}
      {filtersOpen && (
        <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-2 md:flex-row md:items-center">
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

      <CreateBlogSheet
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) { setEditingBlog(undefined); setEditingBlogId(undefined) }
        }}
        blog={editingBlog}
        blogId={editingBlogId}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
