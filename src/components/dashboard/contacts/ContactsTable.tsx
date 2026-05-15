"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
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
  ExternalLinkIcon,
  MailIcon,
  MoreHorizontal,
  PencilIcon,
  PhoneIcon,
  PlusCircleIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
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
import { ContactPreviewSheet } from "./ContactPreviewSheet"
import { contactService, type CountryCount } from "@/services/contact.service"
import { organizationService, type OrganizationOption } from "@/services/organization.service"
import type { Person } from "@/types/contact"
import { getFlag, getSortIcon, getInitials } from "@/lib/table-utils"

export interface Contact {
  id: number
  name: string
  org: string
  orgId: number | null
  email: string
  phone: string
  country: string
  source: string
  createdAt: string
  internalPosition: string
}

function mapPerson(p: Person): Contact {
  const email = p.person_detail?.find((d) => d.label?.key === "email")?.value ?? ""
  const phone =
    p.person_detail?.find((d) => d.label?.key === "phone" || d.label?.key === "telefono")?.value ?? ""
  return {
    id: p.id,
    name: p.name,
    org: p.organization?.name ?? "Sin organización",
    orgId: p.organization_id ?? null,
    email,
    phone,
    country: p.pais_origen ?? "CL",
    source: p.contact_source ?? p.origin ?? "CRM",
    createdAt: (p.created_at ?? "").slice(0, 10),
    internalPosition: p.internal_position ?? "",
  }
}

const COUNTRY_LABELS: Record<string, string> = {
  CL: "Chile",
  AR: "Argentina",
  CO: "Colombia",
  MX: "México",
  PE: "Perú",
  BR: "Brasil",
  UY: "Uruguay",
  EC: "Ecuador",
  VE: "Venezuela",
  BO: "Bolivia",
  PY: "Paraguay",
}

const columnLabels: Record<string, string> = {
  id: "ID",
  name: "Nombre",
  org: "Organización",
  phone: "Teléfono",
  country: "País",
  source: "Fuente",
  createdAt: "Creado",
  internalPosition: "Cargo",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  source: false,
  createdAt: false,
  internalPosition: false,
}

function getColumns(
  onPreview: (contact: Contact) => void,
  onDetail: (contact: Contact) => void
): ColumnDef<Contact>[] {
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
        const email: string = row.original.email
        return (
          <div className="flex items-center gap-2.5">
            <Avatar size="default">
              <AvatarImage src="https://github.com/shadcn.png" alt={name} />
              <AvatarFallback className="text-base">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{email || "—"}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "org",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Organización {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => <div className="text-sm">{row.getValue("org")}</div>,
    },
    {
      accessorKey: "internalPosition",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Cargo {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {(row.getValue("internalPosition") as string) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Teléfono {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {(row.getValue("phone") as string) || "—"}
        </div>
      ),
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
        const contact = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onDetail(contact)}>
                  <ExternalLinkIcon />
                  Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview(contact)}>
                  <UserIcon />
                  Vista Previa
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PencilIcon />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acceso rápido</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(contact.email)}
                >
                  <MailIcon />
                  Copiar email
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(contact.phone)}
                >
                  <PhoneIcon />
                  Copiar teléfono
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
      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  org:              <div className="h-4 w-32 animate-pulse rounded bg-muted" />,
  internalPosition: <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  phone:            <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  country: (
    <div className="flex items-center gap-1.5">
      <div className="size-4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-6 animate-pulse rounded bg-muted" />
    </div>
  ),
  source:    <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="size-8 animate-pulse rounded bg-muted" />,
}

function OrgFilter({
  orgs,
  selected,
  onChange,
}: {
  orgs: OrganizationOption[]
  selected: number | null
  onChange: (id: number | null) => void
}) {
  const selectedOrg = orgs.find((o) => o.id === selected)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <PlusCircleIcon className="size-4" />
        Organización
        {selected !== null && (
          <>
            <Separator
              orientation="vertical"
              className="mx-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <span className="inline-block max-w-35 truncate align-middle rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {selectedOrg?.name ?? "…"}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-60 min-w-44 overflow-y-auto">
        {orgs.map((org) => (
          <DropdownMenuCheckboxItem
            key={org.id}
            checked={selected === org.id}
            onCheckedChange={() => onChange(selected === org.id ? null : org.id)}
          >
            {org.name}
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

interface QueryState {
  page: number
  pageSize: number
  search: string
  orgId: number | null
  countries: string[]
}

export function ContactsTable() {
  const router = useRouter()
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [orgs, setOrgs] = React.useState<OrganizationOption[]>([])
  const [searchInput, setSearchInput] = React.useState("")
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    orgId: null,
    countries: [],
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [countryCounts, setCountryCounts] = React.useState<CountryCount[]>([])

  React.useEffect(() => {
    const t = setTimeout(
      () => setQuery((q) => ({ ...q, page: 1, search: searchInput })),
      400
    )
    return () => clearTimeout(t)
  }, [searchInput])

  React.useEffect(() => {
    const selected = (columnFilters.find((f) => f.id === "country")?.value as string[]) ?? []
    setQuery((q) => {
      if (JSON.stringify(q.countries) === JSON.stringify(selected)) return q
      return { ...q, page: 1, countries: selected }
    })
  }, [columnFilters])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    contactService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        organization_id: query.orgId ?? undefined,
        country: query.countries.length > 0 ? query.countries : undefined,
      })
      .then((res) => {
        if (cancelled) return
        setContacts(res.data.map(mapPerson))
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

  React.useEffect(() => {
    organizationService.allNoPaginate().then(setOrgs).catch(() => {})
  }, [])

  React.useEffect(() => {
    contactService.countryCounts().then(setCountryCounts).catch(() => {})
  }, [])

  const countryOptions = React.useMemo(
    () =>
      countryCounts.map((c) => ({
        label: COUNTRY_LABELS[c.code] ?? c.code,
        value: c.code,
        icon: (
          <img
            src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
            alt={c.code}
            width={20}
            height={15}
          />
        ),
      })),
    [countryCounts]
  )

  const countryCountsMap = React.useMemo(
    () => new Map(countryCounts.map((c) => [c.code, c.count])),
    [countryCounts]
  )

  const pagination: PaginationState = { pageIndex: query.page - 1, pageSize: query.pageSize }

  const handlePagination = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => {
    const next = typeof updater === "function" ? updater(pagination) : updater
    setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
  }

  const handleOrgFilter = (id: number | null) => {
    setQuery((q) => ({ ...q, page: 1, orgId: id }))
  }

  const hasActiveFilters = searchInput || query.orgId !== null || columnFilters.length > 0

  const resetFilters = () => {
    setSearchInput("")
    setQuery((q) => ({ ...q, page: 1, search: "", orgId: null }))
    setColumnFilters([])
  }

  const columns = React.useMemo(
    () =>
      getColumns(
        (contact) => {
          setSelectedContact(contact)
          setSheetOpen(true)
        },
        (contact) => router.push(`/crm/contacts/${contact.id}`)
      ),
    [router]
  )

  const table = useReactTable({
    data: contacts,
    columns,
    manualPagination: true,
    rowCount: total,
    onPaginationChange: handlePagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
  })

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <Input
          className="max-w-sm"
          placeholder="Buscar contacto..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <OrgFilter orgs={orgs} selected={query.orgId} onChange={handleOrgFilter} />
        <DataTableFacetedFilter
          column={table.getColumn("country")!}
          title="País"
          options={countryOptions}
          counts={countryCountsMap}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8" onClick={resetFilters}>
            Reset
            <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} contactos</span>
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
            Crear Contacto
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

      <ContactPreviewSheet
        contact={selectedContact}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
