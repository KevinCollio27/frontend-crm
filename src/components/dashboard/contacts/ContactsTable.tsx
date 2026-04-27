"use client";

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
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon, ChevronDown, MailIcon, MoreHorizontal, PencilIcon, PhoneIcon, PlusIcon, Trash2Icon, UserIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactPreviewSheet } from "./ContactPreviewSheet";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Contact {
  id: number;
  name: string;
  org: string;
  email: string;
  phone: string;
  country: string;
  source: string;
  createdAt: string;
}

const data: Contact[] = [
  {
    id: 1,
    name: "Kevin Collio",
    org: "GOXT",
    email: "kevin@goxt.io",
    phone: "+56 9 1234 5678",
    country: "CL",
    source: "CRM",
    createdAt: "2025-12-18",
  },
  {
    id: 2,
    name: "María González",
    org: "CamionGO",
    email: "maria@camionGO.io",
    phone: "+56 9 8765 4321",
    country: "CL",
    source: "Web",
    createdAt: "2026-01-05",
  },
  {
    id: 3,
    name: "Carlos Pérez",
    org: "No Aplica",
    email: "carlos@gmail.com",
    phone: "+54 9 1234 5678",
    country: "AR",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 4,
    name: "Ana Martínez",
    org: "CamionGO",
    email: "ana@camionGO.io",
    phone: "+56 9 1111 2222",
    country: "CL",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 5,
    name: "Angel Silva",
    org: "No Aplica",
    email: "angel@gmail.com",
    phone: "+54 9 1234 5678",
    country: "CO",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 6,
    name: "Sofia López",
    org: "GOXT",
    email: "sofia@goxt.io",
    phone: "+56 9 1234 8878",
    country: "CL",
    source: "CRM",
    createdAt: "2025-12-18",
  },
  {
    id: 7,
    name: "Yael Succo",
    org: "CamionGO",
    email: "yael@camionGO.io",
    phone: "+56 9 2233 4321",
    country: "CL",
    source: "Web",
    createdAt: "2026-01-05",
  },
  {
    id: 8,
    name: "Javiera Torres",
    org: "No Aplica",
    email: "javiera@gmail.com",
    phone: "+54 9 1234 5678",
    country: "AR",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 9,
    name: "Claudia Rojas",
    org: "CamionGO",
    email: "claudia@camionGO.io",
    phone: "+56 9 1111 2222",
    country: "CL",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 10,
    name: "Tomas Fernández",
    org: "No Aplica",
    email: "tomas@gmail.com",
    phone: "+54 9 1234 5678",
    country: "CO",
    source: "CRM",
    createdAt: "2026-02-20",
  },
];

const getFlag = (code: string) =>
  code.toUpperCase().split("").map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />;
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />;
  return <ArrowUpDown className="ml-2 size-3.5" />;
};

const columnLabels: Record<string, string> = {
  id: "ID",
  name: "Nombre",
  org: "Organización",
  phone: "Teléfono",
  country: "País",
  source: "Fuente",
  createdAt: "Creado",
};

function getColumns(onPreview: (contact: Contact) => void): ColumnDef<Contact>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
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
        const name: string = row.getValue("name");
        const email: string = row.original.email;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar size="default">
              <AvatarImage src="/images/avatar-contact.svg" alt={name} />
              <AvatarFallback>{name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
          </div>
        );
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
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Teléfono {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.getValue("phone")}</div>
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
        const code: string = row.getValue("country");
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <span>{getFlag(code)}</span>
            <span>{code}</span>
          </div>
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
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
        const contact = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contact.email)}>
                  <MailIcon />
                  Copiar email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contact.phone)}>
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
        );
      },
    },
  ];
}

export function ContactsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const columns = React.useMemo(
    () => getColumns((contact) => { setSelectedContact(contact); setSheetOpen(true); }),
    []
  );

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
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <Input
          className="max-w-sm"
          placeholder="Buscar contacto..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter
          column={table.getColumn("org")!}
          title="Organización"
          options={[
            { label: "GOXT", value: "GOXT" },
            { label: "CamionGO", value: "CamionGO" },
            { label: "No Aplica", value: "No Aplica" },
          ]}
        />
        <DataTableFacetedFilter
          column={table.getColumn("country")!}
          title="País"
          options={[
            { label: "Chile", value: "CL", icon: <img src="https://flagcdn.com/w40/cl.png" alt="CL" width={20} height={15} /> },
            { label: "Argentina", value: "AR", icon: <img src="https://flagcdn.com/w40/ar.png" alt="AR" width={20} height={15} /> },
            { label: "Colombia", value: "CO", icon: <img src="https://flagcdn.com/w40/co.png" alt="CO" width={20} height={15} /> },
          ]}
        />
        {table.getState().columnFilters.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8" onClick={() => table.resetColumnFilters()}>
            Reset
            <XIcon className="ml-1 size-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} contactos
          </span>
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
            {table.getRowModel().rows?.length ? (
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
  );
}
