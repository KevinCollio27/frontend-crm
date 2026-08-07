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
import { ChevronDown, MoreHorizontal, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { getFlag, getSortIcon, getInitials, SOURCE_LABEL } from "@/lib/table-utils"
import { contactService } from "@/services/contact.service"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { contactConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import type { Person } from "@/types/contact"
import { LinkContactSheet } from "../sheets/LinkContactSheet"
import { CreateContactSheet } from "@/components/dashboard/contacts/CreateContactSheet"

// ─── Entity ───────────────────────────────────────────────────────────────────

interface TabContact {
  id:               number
  name:             string
  internalPosition: string
  email:            string
  phone:            string
  country_code:     string
  origin:           string
  created_at:       string
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function mapTabContact(p: Person): TabContact {
  const email = p.person_detail?.find((d) => d.label?.key === "email")?.value ?? ""
  const phone = p.person_detail?.find(
    (d) => d.label?.key === "phone" || d.label?.key === "telefono"
  )?.value ?? ""
  return {
    id:               p.id,
    name:             p.name,
    internalPosition: p.internal_position ?? "",
    email,
    phone,
    country_code:     p.pais_origen ?? "CL",
    origin:           SOURCE_LABEL[p.contact_source ?? ""] ?? p.contact_source ?? p.origin ?? "CRM",
    created_at:       new Date(p.created_at).toLocaleDateString("es-CL", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  id:           "ID",
  name:         "Nombre",
  phone:        "Teléfono",
  country_code: "País",
  origin:       "Origen",
  created_at:   "Creado",
}

const DEFAULT_VISIBILITY: VisibilityState = {
  phone:      false,
  created_at: false,
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select:       <div className="size-4 animate-pulse rounded bg-muted" />,
  id:           <div className="h-3 w-6 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  phone:        <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />,
  country_code: <div className="h-3.5 w-10 animate-pulse rounded bg-muted" />,
  origin:       <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />,
  created_at:   <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />,
  actions:      <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(
  onEdit: (c: TabContact) => void,
  onUnlink: (c: TabContact) => void,
): ColumnDef<TabContact>[] {
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
      const c = row.original
      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src="https://github.com/shadcn.png" alt={c.name} />
            <AvatarFallback className="text-[10px] font-semibold">{getInitials(c.name)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-sm font-medium">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.internalPosition || c.email || "—"}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    enableSorting: false,
    header: "Teléfono",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{(row.getValue("phone") as string) || "—"}</div>
    ),
  },
  {
    accessorKey: "country_code",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        País {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const code: string = row.getValue("country_code")
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <span>{getFlag(code)}</span>
          <span>{code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "origin",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Origen {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <div className="text-sm">{row.getValue("origin")}</div>,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Creado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("created_at")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const c = row.original
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{c.name}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(c)}><PencilIcon /> Editar</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onUnlink(c)}
              >
                <Trash2Icon /> Desvincular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { orgId: number; orgName?: string }

export function ContactosTab({ orgId, orgName = "esta organización" }: Props) {
  const [data, setData]             = React.useState<TabContact[]>([])
  const [total, setTotal]           = React.useState(0)
  const [loading, setLoading]       = React.useState(true)
  const [search, setSearch]         = React.useState("")
  const [sorting, setSorting]       = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_VISIBILITY)
  const [query, setQuery]           = React.useState({ page: 1, pageSize: 10, search: "" })
  const [linkOpen, setLinkOpen]     = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [editContactId, setEditContactId] = React.useState<number | null>(null)
  const [editOpen, setEditOpen]     = React.useState(false)

  async function handleUnlink(c: TabContact) {
    const confirmed = await contactConfirm.unlink(c.name, orgName)
    if (!confirmed) return
    try {
      await contactService.unlinkFromOrg(c.id)
      notify.success({ title: "Contacto desvinculado", description: `"${c.name}" ya no está asociado a ${orgName}.` })
      setRefreshKey((k) => k + 1)
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo desvincular el contacto." })
    }
  }

  const columns = React.useMemo(
    () => getColumns(
      (c) => { setEditContactId(c.id); setEditOpen(true) },
      handleUnlink,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgName]
  )

  // "deleted" solo trae { id } (sin organization_id) — no se puede filtrar,
  // así que ahí refresca sin condición; created/updated sí filtran por org.
  useEntityRealtime("contact", (payload) => {
    if (payload.action !== "deleted") {
      const changedOrgId = (payload.data as { organization_id?: number | null })?.organization_id
      if (changedOrgId !== orgId) return
    }
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, page: 1, search })), 400)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    contactService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        organization_id: orgId,
      })
      .then((res) => {
        if (cancelled) return
        setData(res.data.map(mapTabContact))
        setTotal(res.total)
      })
      .catch(() => { if (!cancelled) { setData([]); setTotal(0) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query, orgId, refreshKey])

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
      const next = typeof updater === "function"
        ? updater({ pageIndex: query.page - 1, pageSize: query.pageSize })
        : updater
      setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-col gap-3 p-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-8 max-w-45 text-sm"
          placeholder="Buscar contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {total} contacto{total !== 1 ? "s" : ""}
          </span>
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
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setLinkOpen(true)}>
            <PlusIcon className="size-3.5" /> Vincular contacto
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-md border">
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
                      {skeletonCell[col.id] ?? <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />}
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
                  Sin contactos vinculados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      <LinkContactSheet
        open={linkOpen}
        onOpenChange={setLinkOpen}
        orgId={orgId}
        orgName={orgName}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {editOpen && (
        <CreateContactSheet
          open
          onOpenChange={(v) => { if (!v) setEditOpen(false) }}
          contactId={editContactId ?? undefined}
          onSuccess={() => { setEditOpen(false); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}
