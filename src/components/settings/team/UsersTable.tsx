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
  CheckIcon,
  ChevronDown,
  LayoutIcon,
  MailIcon,
  MoreHorizontal,
  PencilIcon,
  ShareIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

export interface User {
  id: number
  name: string
  email: string
  active: boolean
  admin: boolean
  owner: boolean
  whatsapp: string | null
  joinedAt: string
}

const data: User[] = [
  {
    id: 1,
    name: "Kevin Collio",
    email: "kevin.collio@goxt.io",
    active: true,
    admin: true,
    owner: true,
    whatsapp: null,
    joinedAt: "14/04/26 19:55",
  },
  {
    id: 5,
    name: "Rodrigo Valdés Badilla",
    email: "rodrigovaldes@goxt.io",
    active: true,
    admin: true,
    owner: false,
    whatsapp: null,
    joinedAt: "15/04/26 13:44",
  },
  {
    id: 7,
    name: "Katherine Paredes",
    email: "katherine.paredes@southconnect.cl",
    active: true,
    admin: false,
    owner: false,
    whatsapp: null,
    joinedAt: "24/12/25 12:33",
  },
]

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

const columnLabels: Record<string, string> = {
  name: "Usuario",
  active: "Activo",
  admin: "Admin",
  owner: "Propietario",
  whatsapp: "WhatsApp",
  joinedAt: "Unido el",
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <CheckIcon className="size-4 text-green-600" />
  ) : (
    <XIcon className="size-4 text-destructive" />
  )
}

export const columns: ColumnDef<User>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Usuario
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("name")
      const email: string = row.original.email
      return (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage src="https://github.com/shadcn.png" alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{email}</div>
          </div>
        </div>
      )
    },
    filterFn: (row, _id, value: string) => {
      const name: string = row.getValue("name")
      const email: string = row.original.email
      const q = value.toLowerCase()
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
    },
  },
  {
    accessorKey: "active",
    meta: { className: "hidden sm:table-cell" },
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Activo
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <BoolCell value={row.getValue("active")} />,
    filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))),
  },
  {
    accessorKey: "admin",
    meta: { className: "hidden md:table-cell" },
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Admin
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <BoolCell value={row.getValue("admin")} />,
    filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))),
  },
  {
    accessorKey: "owner",
    meta: { className: "hidden md:table-cell" },
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Propietario
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <BoolCell value={row.getValue("owner")} />,
    filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))),
  },
  {
    accessorKey: "whatsapp",
    meta: { className: "hidden lg:table-cell" },
    header: "WhatsApp",
    cell: ({ row }) => {
      const value: string | null = row.getValue("whatsapp")
      return <div className="text-sm text-muted-foreground">{value ?? "—"}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "joinedAt",
    meta: { className: "hidden lg:table-cell" },
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Unido el
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("joinedAt")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original
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
                <PencilIcon />
                Editar usuario
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acceso rápido</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.email)}
              >
                <MailIcon />
                Copiar email
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2Icon />
              Eliminar usuario
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function UsersTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

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
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 py-4">
        <Input
          className="w-full sm:max-w-xs"
          placeholder="Filtrar por nombre y correo..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter
          column={table.getColumn("active")!}
          title="Activo"
          options={[
            { label: "Activo", value: "true" },
            { label: "Inactivo", value: "false" },
          ]}
        />
        <DataTableFacetedFilter
          column={table.getColumn("admin")!}
          title="Admin"
          options={[
            { label: "Admin", value: "true" },
            { label: "No admin", value: "false" },
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
            {table.getFilteredRowModel().rows.length} usuarios
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <LayoutIcon className="size-4" />
              <span className="hidden sm:inline">Visualización</span>
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
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {columnLabels[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <ShareIcon className="size-4" />
            <span className="hidden md:inline">Compartir</span>
          </Button>
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
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.className}
                  >
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className}
                    >
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
    </div>
  )
}
