"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDown,
  ArrowUpIcon,
  MailIcon,
  MoreHorizontal,
  RefreshCwIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
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

interface Invitation {
  id: number
  email: string
  invitedBy: string
  invitedAt: string
  status: "pendiente" | "expirada"
}

const data: Invitation[] = [
  {
    id: 1,
    email: "nuevo@empresa.cl",
    invitedBy: "Kevin Collio",
    invitedAt: "20/04/26 10:00",
    status: "pendiente",
  },
  {
    id: 2,
    email: "colaborador@empresa.cl",
    invitedBy: "Rodrigo Valdés Badilla",
    invitedAt: "18/04/26 15:30",
    status: "expirada",
  },
]

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

const statusStyles: Record<Invitation["status"], string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  expirada: "bg-muted text-muted-foreground",
}

const statusLabels: Record<Invitation["status"], string> = {
  pendiente: "Pendiente",
  expirada: "Expirada",
}

const columns: ColumnDef<Invitation>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Email invitado
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const email: string = row.getValue("email")
      return (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage src="https://github.com/shadcn.png" alt={email} />
            <AvatarFallback>{email[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{email}</span>
        </div>
      )
    },
    filterFn: (row, _id, value: string) =>
      (row.getValue("email") as string).toLowerCase().includes(value.toLowerCase()),
  },
  {
    accessorKey: "invitedBy",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Invitado por
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("invitedBy")}</div>
    ),
  },
  {
    accessorKey: "invitedAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Fecha
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("invitedAt")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as Invitation["status"]
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
        >
          {statusLabels[status]}
        </span>
      )
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invitation = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem>
                <RefreshCwIcon />
                Reenviar invitación
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(invitation.email)}
              >
                <MailIcon />
                Copiar email
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2Icon />
              Revocar invitación
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function InvitedUsersTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 py-4">
        <Input
          className="w-full sm:max-w-xs"
          placeholder="Filtrar por email..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter
          column={table.getColumn("status")!}
          title="Estado"
          options={[
            { label: "Pendiente", value: "pendiente" },
            { label: "Expirada", value: "expirada" },
          ]}
        />
        {table.getState().columnFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} invitaciones
          </span>
          <Button size="sm">
            <UserPlusIcon className="size-4" />
            <span className="hidden sm:inline">Invitar Usuario</span>
          </Button>
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
            {table.getRowModel().rows?.length ? (
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
    </div>
  )
}
