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
  type PaginationState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDown,
  LayoutIcon,
  MailIcon,
  MoreHorizontal,
  PlusCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { teamService } from "@/services/team.service"
import { InviteUserSheet } from "./InviteUserSheet"
import type { InvitationRaw } from "@/types/team"
import { getSortIcon } from "@/lib/table-utils"
import { orgConfirm } from "@/lib/confirm"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import { useIsMobile } from "@/hooks/use-mobile"
import { notify } from "@/lib/notify"

interface Invitation {
  id: number
  email: string
  status: "pendiente" | "expirada"
  sentAt: string
  expiresAt: string
}

function mapInvitation(r: InvitationRaw): Invitation {
  return {
    id: r.id,
    email: r.email,
    status: r.is_expired ? "expirada" : "pendiente",
    sentAt: r.created_at
      ? new Date(r.created_at).toLocaleString("es-CL", {
          day: "2-digit", month: "2-digit", year: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })
      : "—",
    expiresAt: r.expire_at
      ? new Date(r.expire_at).toLocaleString("es-CL", {
          day: "2-digit", month: "2-digit", year: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })
      : "—",
  }
}

const statusStyles = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  expirada:  "bg-muted text-muted-foreground",
}

const statusLabels = {
  pendiente: "Pendiente",
  expirada:  "Expirada",
}

const columnLabels: Record<string, string> = {
  email:     "Email invitado",
  status:    "Estado",
  sentAt:    "Enviada el",
  expiresAt: "Expira el",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  expiresAt: false,
}

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  status:    false,
  sentAt:    false,
  expiresAt: false,
}

type StatusFilter = "pendiente" | "expirada" | null

function StatusFilter({
  value,
  onChange,
}: {
  value: StatusFilter
  onChange: (v: StatusFilter) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <PlusCircleIcon className="size-4" />
        Estado
        {value !== null && (
          <>
            <Separator orientation="vertical" className="mx-1 data-vertical:h-4 data-vertical:self-auto" />
            <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {statusLabels[value]}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36">
        <DropdownMenuCheckboxItem
          checked={value === "pendiente"}
          onCheckedChange={() => onChange(value === "pendiente" ? null : "pendiente")}
        >
          Pendiente
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={value === "expirada"}
          onCheckedChange={() => onChange(value === "expirada" ? null : "expirada")}
        >
          Expirada
        </DropdownMenuCheckboxItem>
        {value !== null && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange(null)}
            >
              Limpiar
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function getColumns(
  onResend: (inv: Invitation) => void,
  onRevoke: (inv: Invitation) => void,
  isAdmin: boolean,
): ColumnDef<Invitation>[] {
  return [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Email invitado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const email: string = row.getValue("email")
      return (
        <div className="flex items-center gap-2.5">
          <Avatar size="default">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="text-base">
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const s = row.getValue("status") as Invitation["status"]
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s]}`}>
          {statusLabels[s]}
        </span>
      )
    },
  },
  {
    accessorKey: "sentAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Enviada el {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("sentAt")}</div>
    ),
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Expira el {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("expiresAt")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const inv = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              {isAdmin && (
                <DropdownMenuItem onClick={() => onResend(inv)}>
                  <RefreshCwIcon />
                  Reenviar invitación
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(inv.email)}>
                <MailIcon />
                Copiar email
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRevoke(inv)}>
                  <Trash2Icon />
                  Revocar invitación
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  ]
}

const skeletonCell: Record<string, React.ReactNode> = {
  email: (
    <div className="flex items-center gap-2.5">
      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
    </div>
  ),
  status:    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />,
  sentAt:    <div className="h-4 w-28 animate-pulse rounded bg-muted" />,
  expiresAt: <div className="h-4 w-28 animate-pulse rounded bg-muted" />,
  actions:   <div className="size-8 animate-pulse rounded bg-muted" />,
}

interface QueryState {
  page: number
  pageSize: number
  search: string
}

export function InvitedUsersTable() {
  const isWorkspaceAdmin = useIsWorkspaceAdmin()
  const [invitations, setInvitations] = React.useState<Invitation[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(null)
  const [query, setQuery] = React.useState<QueryState>({ page: 1, pageSize: 10, search: "" })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

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
    teamService
      .listInvitations({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
      })
      .then((res) => {
        if (cancelled) return
        setInvitations(res.data.map(mapInvitation))
        setTotal(res.total)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [query, refreshKey])

  const handleResend = React.useCallback(async (inv: Invitation) => {
    try {
      await teamService.resendInvitation(inv.id)
      notify.success({ title: "Invitación reenviada", description: `Se reenvió el correo a "${inv.email}".` })
      setRefreshKey((k) => k + 1)
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo reenviar la invitación." })
    }
  }, [])

  const handleRevoke = React.useCallback(async (inv: Invitation) => {
    const confirmed = await orgConfirm.delete(inv.email)
    if (!confirmed) return
    setInvitations((prev) => prev.filter((i) => i.id !== inv.id))
    setTotal((t) => t - 1)
    teamService.cancelInvitation(inv.id)
      .then(() => {
        notify.success({ title: "Invitación revocada", description: `"${inv.email}" ya no puede unirse con este enlace.` })
      })
      .catch(() => {
        setRefreshKey((k) => k + 1)
        notify.error({ title: "Algo salió mal", description: "No se pudo revocar la invitación." })
      })
  }, [])

  const columns = React.useMemo(
    () => getColumns(handleResend, handleRevoke, isWorkspaceAdmin),
    [handleResend, handleRevoke, isWorkspaceAdmin]
  )

  // Filtro de estado client-side sobre los datos ya cargados
  const filteredInvitations = React.useMemo(
    () =>
      statusFilter === null
        ? invitations
        : invitations.filter((inv) => inv.status === statusFilter),
    [invitations, statusFilter]
  )

  const pagination: PaginationState = { pageIndex: query.page - 1, pageSize: query.pageSize }

  const handlePagination = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => {
    const next = typeof updater === "function" ? updater(pagination) : updater
    setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
  }

  const hasActiveFilters = searchInput || statusFilter !== null

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter(null)
    setQuery((q) => ({ ...q, page: 1, search: "" }))
  }

  const table = useReactTable({
    data: filteredInvitations,
    columns,
    manualPagination: true,
    rowCount: total,
    onPaginationChange: handlePagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, columnVisibility, pagination },
  })

  return (
    <div className="w-full">
      {/* Toolbar. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 py-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar por email..."
              className="h-8 pl-8 text-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Un solo filtro — ocupa todo el ancho en mobile en vez de quedar
              apretado a la izquierda con espacio vacío al lado. */}
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 w-full md:w-auto" onClick={resetFilters}>
              Reset
              <XIcon className="ml-1 size-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="w-full text-sm text-muted-foreground md:w-auto">
            {total} invitaciones
          </span>
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <LayoutIcon className="size-4" />
                Visualización
                <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    >
                      {columnLabels[col.id] ?? col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isWorkspaceAdmin && (
            <Button size="sm" className="w-full md:w-auto" onClick={() => setInviteOpen(true)}>
              <UserPlusIcon className="size-4" />
              Invitar Usuario
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
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
                  Sin invitaciones pendientes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="py-4">
        <DataTablePagination table={table} />
      </div>

      <InviteUserSheet open={inviteOpen} onOpenChange={setInviteOpen} onSuccess={() => setRefreshKey((k) => k + 1)} />
    </div>
  )
}
