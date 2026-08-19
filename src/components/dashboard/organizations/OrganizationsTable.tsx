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
  ArrowDownUpIcon,
  ArrowRightLeftIcon,
  ChevronDown,
  ExternalLinkIcon,
  GitMergeIcon,
  ListIcon,
  MoreHorizontal,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { useIsMobile } from "@/hooks/use-mobile"

import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
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
import { SingleSelectFilter, type SingleSelectOption } from "@/components/ui/single-select-filter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrganizationPreviewSheet } from "./OrganizationPreviewSheet"
import { CreateOrganizationSheet } from "./CreateOrganizationSheet"
import { DuplicateOrganizationsSheet } from "./DuplicateOrganizationsSheet"
import { OrganizationsImportExportSheet } from "./OrganizationsImportExportSheet"
import { MoveOrganizationsSheet } from "./MoveOrganizationsSheet"
import { organizationService } from "@/services/organization.service"
import { orgConfirm } from "@/lib/confirm"
import { orgNotify } from "@/lib/notify"
import type { OrganizationRaw } from "@/types/organization"
import { getFlag, getSortIcon } from "@/lib/table-utils"

export interface Organization {
  id: number
  name: string
  taxId: string
  industry: string
  webPage: string
  country: string
  source: string
  createdAt: string
  contactCount: number
}

function mapOrganization(o: OrganizationRaw): Organization {
  return {
    id: o.id,
    name: o.name,
    taxId: o.document_number ?? "",
    industry: o.industry ?? "",
    webPage: o.web_page ?? "",
    country: o.pais_origen ?? "CL",
    source: o.contact_source ?? o.origin ?? "CRM",
    createdAt: (o.created_at ?? "").slice(0, 10),
    contactCount: o.person?.length ?? 0,
  }
}

const columnLabels: Record<string, string> = {
  id: "ID",
  name: "Nombre",
  industry: "Industria",
  country: "País",
  contactCount: "Contactos",
  source: "Fuente",
  createdAt: "Creado",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  source: false,
  createdAt: false,
}

// En mobile no hay espacio para columnas de más — solo Nombre queda visible por
// defecto (Acciones y el checkbox de selección no dependen de esto, siempre se ven).
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  industry: false,
  country: false,
  contactCount: false,
  source: false,
  createdAt: false,
}

// Únicas fuentes reales hoy en producción (más allá de casos legacy como
// CAMIONGO/SYSTEM_WORKSPACE, que no aplican a un workspace normal).
const SOURCE_OPTIONS: SingleSelectOption[] = [
  { value: "all", label: "Todas" },
  { value: "CRM", label: "CRM" },
  { value: "widget", label: "Widget" },
]

function getColumns(
  onPreview: (org: Organization) => void,
  onDetail: (org: Organization) => void,
  onEdit: (org: Organization) => void,
  onDelete: (org: Organization) => void,
  onMove: (org: Organization) => void,
): ColumnDef<Organization>[] {
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
        const taxId: string = row.original.taxId
        return (
          <div className="flex items-stretch gap-2.5 min-w-0">
            <EntityAccentBar seed={row.original.id} />
            <div className="leading-tight min-w-0 max-w-44">
              <div className="text-sm font-medium truncate" title={name}>{name}</div>
              <div className="text-xs text-muted-foreground truncate">{taxId || "—"}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "industry",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Industria {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const industry: string = row.getValue("industry")
        const webPage: string = row.original.webPage
        return (
          <div className="leading-tight max-w-65">
            <div className="text-sm truncate" title={industry || undefined}>{industry || "N/A"}</div>
            {webPage ? (
              <a
                href={webPage.startsWith("http") ? webPage : `https://${webPage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate block"
                title={webPage}
              >
                {webPage}
              </a>
            ) : (
              <div className="text-xs text-muted-foreground">—</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "country",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          País {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const code: string = row.getValue("country")
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <span>{getFlag(code)}</span>
            <span>{code}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "contactCount",
      enableSorting: false,
      header: "Contactos",
      cell: ({ row }) => {
        const count: number = row.getValue("contactCount")
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UsersIcon className="size-3.5" />
            {count}
          </div>
        )
      },
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Fuente {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize text-sm">{row.getValue("source")}</div>
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
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const org = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onDetail(org)}>
                  <ExternalLinkIcon />
                  Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview(org)}>
                  <UserIcon />
                  Vista Previa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(org)}>
                  <PencilIcon />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(org)}>
                  <ArrowRightLeftIcon />
                  Mover de espacio
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(org)}
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
      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  industry: (
    <div className="space-y-1.5">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
    </div>
  ),
  country: (
    <div className="flex items-center gap-1.5">
      <div className="size-4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-6 animate-pulse rounded bg-muted" />
    </div>
  ),
  contactCount: (
    <div className="flex items-center gap-1.5">
      <div className="size-3.5 animate-pulse rounded bg-muted" />
      <div className="h-4 w-6 animate-pulse rounded bg-muted" />
    </div>
  ),
  source:    <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="size-8 animate-pulse rounded bg-muted" />,
}

interface QueryState {
  page: number
  pageSize: number
  search: string
  sortBy: string | undefined
  sortOrder: "asc" | "desc" | undefined
}

export function OrganizationsTable() {
  const router = useRouter()
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [sourceFilter, setSourceFilter] = React.useState("all")
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    sortBy: undefined,
    sortOrder: undefined,
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
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [mergeOpen, setMergeOpen] = React.useState(false)
  const [importExportOpen, setImportExportOpen] = React.useState(false)
  const [moveOpen, setMoveOpen] = React.useState(false)
  const [moveInitialIds, setMoveInitialIds] = React.useState<number[]>([])
  const [editId, setEditId] = React.useState<number | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Tiempo real: si otra sesión crea/edita/elimina una organización en este
  // workspace, refresca la tabla sin esperar a un F5 manual. Los eventos
  // disparados por uno mismo se ignoran (nuestra propia acción ya refresca
  // vía refreshKey más arriba en el flujo de creación/edición/eliminación).
  useEntityRealtime("organization", () => setRefreshKey((k) => k + 1))

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
    organizationService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      })
      .then((res) => {
        if (cancelled) return
        setOrganizations(res.data.map(mapOrganization))
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

  const hasActiveFilters = !!searchInput

  const resetFilters = () => {
    setSearchInput("")
    setQuery((q) => ({ ...q, page: 1, search: "" }))
  }

  async function handleDeleteClick(org: Organization) {
    const { canDelete } = await organizationService.checkCanDelete(org.id)
    if (!canDelete) {
      await orgConfirm.blockedByOpportunity(org.name)
      return
    }
    const confirmed = await orgConfirm.delete(org.name)
    if (!confirmed) return
    try {
      await organizationService.delete(org.id)
      orgNotify.deleted(org.name)
      setRefreshKey((k) => k + 1)
    } catch {
      orgNotify.error()
    }
  }

  const columns = React.useMemo(
    () =>
      getColumns(
        (org) => { setSelectedOrg(org); setSheetOpen(true) },
        (org) => router.push(`/crm/organizations/${org.id}`),
        (org) => setEditId(org.id),
        handleDeleteClick,
        (org) => {
          setMoveInitialIds([org.id])
          setMoveOpen(true)
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router]
  )

  const handleSorting = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === "function" ? updater(sorting) : updater
    setSorting(next)
    const col = next[0]
    setQuery((q) => ({
      ...q,
      page: 1,
      sortBy: col?.id,
      sortOrder: col ? (col.desc ? "desc" : "asc") : undefined,
    }))
  }

  // Cliente-side sobre la página ya cargada — mismo criterio que el filtro de
  // Estado en Funnels, no hay soporte de "fuente" en el backend todavía.
  const filteredOrganizations = React.useMemo(() => {
    if (sourceFilter === "all") return organizations
    return organizations.filter((o) => o.source.toLowerCase() === sourceFilter.toLowerCase())
  }, [organizations, sourceFilter])

  const table = useReactTable({
    data: filteredOrganizations,
    columns,
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
    onPaginationChange: handlePagination,
    onSortingChange: handleSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection, pagination },
  })

  const selectedRowIds = table.getSelectedRowModel().rows.map((r) => r.original.id)

  function handleOpenMove() {
    setMoveInitialIds(selectedRowIds)
    setMoveOpen(true)
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
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Crear Organización</Button>
      </div>

      {/* Row 2 — filters. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar organización..."
              className="h-8 pl-8 text-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Un solo filtro — ocupa todo el ancho en mobile en vez de quedar
              apretado a la izquierda con espacio vacío al lado. */}
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <SingleSelectFilter
              title="Fuente"
              options={SOURCE_OPTIONS}
              selected={sourceFilter}
              onChange={setSourceFilter}
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
              <XIcon className="size-3.5" />
              Restablecer
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="w-full text-xs text-muted-foreground md:w-auto">{total} organizaciones</span>

          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2">
            {/* Columnas siempre visible — es la acción más usada */}
            <div className="[&_button]:w-full md:[&_button]:w-auto">
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
                        onCheckedChange={(value) => col.toggleVisibility(!!value)}
                      >
                        {columnLabels[col.id] ?? col.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: el resto de acciones sueltas, igual que antes */}
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="outline" size="sm" className="h-8" onClick={() => setMergeOpen(true)}>
                <GitMergeIcon className="size-3.5" />
                Fusionar duplicados
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={handleOpenMove}>
                <ArrowRightLeftIcon className="size-3.5" />
                Mover de espacio{selectedRowIds.length > 0 ? ` (${selectedRowIds.length})` : ""}
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setImportExportOpen(true)}>
                <ArrowDownUpIcon className="size-3.5" />
                Importar / Exportar
              </Button>
            </div>

            {/* Mobile: el resto de acciones agrupadas en un menú, para no apilar botones */}
            <div className="[&_button]:w-full md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
                  <MoreHorizontal className="size-3.5" />
                  Más
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setMergeOpen(true)}>
                      <GitMergeIcon className="size-3.5" />
                      Fusionar duplicados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenMove}>
                      <ArrowRightLeftIcon className="size-3.5" />
                      Mover de espacio{selectedRowIds.length > 0 ? ` (${selectedRowIds.length})` : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setImportExportOpen(true)}>
                      <ArrowDownUpIcon className="size-3.5" />
                      Importar / Exportar
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

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

      <OrganizationPreviewSheet
        organization={selectedOrg}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onViewDetails={selectedOrg ? () => router.push(`/crm/organizations/${selectedOrg.id}`) : undefined}
      />

      {createOpen && (
        <CreateOrganizationSheet
          open
          onOpenChange={(o) => { if (!o) setCreateOpen(false) }}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {mergeOpen && (
        <DuplicateOrganizationsSheet
          open
          onOpenChange={(o) => { if (!o) setMergeOpen(false) }}
          onMerged={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {importExportOpen && (
        <OrganizationsImportExportSheet
          open
          onOpenChange={(o) => { if (!o) setImportExportOpen(false) }}
          totalOrganizations={total}
          onImported={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {editId !== null && (
        <CreateOrganizationSheet
          open
          onOpenChange={(o) => { if (!o) setEditId(null) }}
          organizationId={editId}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {moveOpen && (
        <MoveOrganizationsSheet
          open
          onOpenChange={(o) => { if (!o) setMoveOpen(false) }}
          initialSelectedIds={moveInitialIds}
          onMoved={() => { setRowSelection({}); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}
