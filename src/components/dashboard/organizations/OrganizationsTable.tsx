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
  CheckIcon,
  ChevronDown,
  ExternalLinkIcon,
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrganizationPreviewSheet } from "./OrganizationPreviewSheet"
import { organizationService } from "@/services/organization.service"
import type { OrganizationRaw } from "@/types/organization"
import { getFlag, getSortIcon, getInitials } from "@/lib/table-utils"

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

function getColumns(
  onPreview: (org: Organization) => void,
  onDetail: (org: Organization) => void
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
          <div className="flex items-center gap-2.5">
            <Avatar size="default">
              <AvatarImage src="https://github.com/shadcn.png" alt={name} />
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(name)}
              </AvatarFallback>
              <AvatarBadge className="bg-blue-500 text-white">
                <CheckIcon />
              </AvatarBadge>
            </Avatar>
            <div className="leading-tight">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{taxId || "—"}</div>
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
          <div className="leading-tight">
            <div className="text-sm">{industry || "N/A"}</div>
            {webPage ? (
              <a
                href={webPage.startsWith("http") ? webPage : `https://${webPage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
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
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Contactos {getSortIcon(column.getIsSorted())}
        </Button>
      ),
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

interface QueryState {
  page: number
  pageSize: number
  search: string
}

export function OrganizationsTable() {
  const router = useRouter()
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    DEFAULT_COLUMN_VISIBILITY
  )
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(null)
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
    organizationService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
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
  }, [query])

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

  const columns = React.useMemo(
    () =>
      getColumns(
        (org) => {
          setSelectedOrg(org)
          setSheetOpen(true)
        },
        (org) => router.push(`/crm/organizations/${org.id}`)
      ),
    [router]
  )

  const table = useReactTable({
    data: organizations,
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
          placeholder="Buscar organización..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8" onClick={resetFilters}>
            Reset
            <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} organizaciones</span>
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
            Crear Organización
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
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
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

      <OrganizationPreviewSheet
        organization={selectedOrg}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
