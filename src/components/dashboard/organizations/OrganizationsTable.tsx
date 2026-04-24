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
import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon, ChevronDown, MoreHorizontal, PencilIcon, PlusIcon, Trash2Icon, UserIcon, XIcon } from "lucide-react";
import { OrganizationPreviewSheet } from "./OrganizationPreviewSheet";
import * as React from "react";

import BoringAvatar from "boring-avatars";
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

export interface Organization {
  id: number;
  name: string;
  taxId: string;
  country: string;
  industry: string;
  website?: string;
  source: string;
  createdAt: string;
}

const data: Organization[] = [
  {
    id: 1,
    name: "GOXT SpA",
    taxId: "20.454.519-7",
    country: "CL",
    industry: "Tecnología e Informatica",
    website: "https://goxt.io",
    source: "CRM",
    createdAt: "2025-12-18",
  },
  {
    id: 2,
    name: "CamionGO SpA",
    taxId: "77.389.123-4",
    country: "CL",
    industry: "Servicios de Transporte de Carga",
    website: "https://camionGO.io",
    source: "Web",
    createdAt: "2026-01-05",
},
  {
    id: 3,
    name: "Fluxie S.A.",
    taxId: "78.987.654-3",
    country: "AR",
    industry: "Servicios Comunicacionales",
    website: "https://fluxie.xyz",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 4,
    name: "Southway Ltda.",
    taxId: "11.111.111-1",
    country: "CL",
    industry: "Servicios de Carga Maritima",
    website: "https://southconnect.cl",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 5,
    name: "Telecomunicaciones S.A.",
    taxId: "22.222.222-2",
    country: "CO",
    industry: "Servicios",
    website: "https://telco.co",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 6,
    name: "Transportes del Sur S.A.",
    taxId: "33.333.333-3",
    country: "CL",
    industry: "Tecnología e Informatica",
    website: "https://transportes-del-sur.com",
    source: "CRM",
    createdAt: "2025-12-18",
  },
  {
    id: 7,
    name: "Merpez S.A.",
    taxId: "44.444.444-4",
    country: "CL",
    industry: "Servicios",
    website: "https://merpes.com",
    source: "Web",
    createdAt: "2026-01-05",
  },
  {
    id: 8,
    name: "Latam Airlines S.A.",
    taxId: "55.555.555-5",
    country: "AR",
    industry: "Servicios",
    website: "https://latam.com",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 9,
    name: "Pronto S.A.",
    taxId: "66.666.666-6",
    country: "CL",
    industry: "Servicios",
    website: "https://pronto.cl",
    source: "CRM",
    createdAt: "2026-02-20",
  },
  {
    id: 10,
    name: "Tottus S.A.",
    taxId: "77.777.777-7",
    country: "CO",
    industry: "Servicios",
    website: "https://totus.com",
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
  country: "País",
  industry: "Industria",
  source: "Fuente",
  createdAt: "Creado",
};

function getColumns(onPreview: (org: Organization) => void): ColumnDef<Organization>[] {
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
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting()}
      >
        ID
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground text-xs">#{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting()}
      >
        Nombre
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("name");
      const taxId: string = row.original.taxId;
      return (
        <div className="flex items-center gap-2.5">
          <BoringAvatar
              name={name}
              colors={["#d0dccb", "#d7c7be", "#b3c5ba", "#88c3b5", "#95888f"]}
              variant="bauhaus"
              size={32}
            />
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{taxId}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "industry",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting()}
      >
        Industria
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const industry: string = row.getValue("industry");
      const website = row.original.website;
      return (
        <div className="leading-tight">
          <div className="text-sm font-medium">{industry}</div>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
            >
              {website}
            </a>
          ) : (
            <div className="text-xs">No Aplica</div>
          )}
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "country",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting()}
      >
        País
        {getSortIcon(column.getIsSorted())}
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
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting()}
      >
        Fuente
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="capitalize text-sm">{row.getValue("source")}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting()}
      >
        Creado
        {getSortIcon(column.getIsSorted())}
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
      const org = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button className="h-8 w-8 p-0" variant="ghost" />}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
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
      );
    },
  },
  ];
}

export function OrganizationsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const columns = React.useMemo(
    () => getColumns((org) => { setSelectedOrg(org); setSheetOpen(true); }),
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
          placeholder="Buscar organización..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
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
          <span className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} organizaciones
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

      <OrganizationPreviewSheet
        organization={selectedOrg}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
