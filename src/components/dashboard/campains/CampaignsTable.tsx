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
import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon, ChevronDown, CopyIcon, EyeIcon, MailIcon, MoreHorizontal, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import * as React from "react";

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

interface Campaign {
  id: number;
  name: string;
  subject: string;
  type: string;
  status: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  sentAt?: string;
  createdAt: string;
}

const data: Campaign[] = [
  { id: 1,  name: "Boletín GOXT CRM",           subject: "Novedades de febrero",                    type: "specific", status: "sent",      totalSent: 248,  totalOpened: 186, totalClicked: 42,  sentAt: "2026-02-13", createdAt: "2026-02-10" },
  { id: 2,  name: "Lanzamiento Form Widget",     subject: "Nuevo widget embebible en tu sitio",      type: "all",      status: "sent",      totalSent: 1043, totalOpened: 721, totalClicked: 198, sentAt: "2026-02-20", createdAt: "2026-02-18" },
  { id: 3,  name: "Actualización de Precios Q1", subject: "Cambios en planes para 2026",             type: "segment",  status: "sent",      totalSent: 85,   totalOpened: 52,  totalClicked: 14,  sentAt: "2026-03-01", createdAt: "2026-02-28" },
  { id: 4,  name: "Webinar CRM en acción",       subject: "Te invitamos a nuestro webinar",          type: "all",      status: "scheduled", totalSent: 0,    totalOpened: 0,   totalClicked: 0,                         createdAt: "2026-04-10" },
  { id: 5,  name: "Propuesta Enterprise",        subject: "Solución a medida para tu empresa",       type: "specific", status: "draft",     totalSent: 0,    totalOpened: 0,   totalClicked: 0,                         createdAt: "2026-04-12" },
  { id: 6,  name: "Reactivación leads fríos",   subject: "¿Sigues interesado en GOXT CRM?",         type: "segment",  status: "sent",      totalSent: 312,  totalOpened: 89,  totalClicked: 22,  sentAt: "2026-03-15", createdAt: "2026-03-14" },
  { id: 7,  name: "Novedad: Chat con IA",        subject: "Asistente virtual ya disponible",         type: "all",      status: "sent",      totalSent: 1150, totalOpened: 843, totalClicked: 261, sentAt: "2026-03-22", createdAt: "2026-03-20" },
  { id: 8,  name: "Encuesta de satisfacción",    subject: "Cuéntanos tu experiencia con el CRM",     type: "segment",  status: "draft",     totalSent: 0,    totalOpened: 0,   totalClicked: 0,                         createdAt: "2026-04-15" },
  { id: 9,  name: "Promoción abril 2026",        subject: "Oferta especial este mes para ti",        type: "all",      status: "scheduled", totalSent: 0,    totalOpened: 0,   totalClicked: 0,                         createdAt: "2026-04-16" },
  { id: 10, name: "Boletín GOXT CRM – Marzo",   subject: "Novedades de marzo 2026",                 type: "specific", status: "sent",      totalSent: 318,  totalOpened: 204, totalClicked: 67,  sentAt: "2026-04-02", createdAt: "2026-03-30" },
];

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  sent:      { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",  label: "Enviada"    },
  draft:     { dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Borrador"   },
  scheduled: { dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",           label: "Programada" },
  sending:   { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",        label: "Enviando"   },
};

const typeConfig: Record<string, { label: string; badge: string }> = {
  specific: { label: "Específica", badge: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
  all:      { label: "General",    badge: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"             },
  segment:  { label: "Segmento",   badge: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
};

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />;
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />;
  return <ArrowUpDown className="ml-2 size-3.5" />;
};

const columnLabels: Record<string, string> = {
  id:        "ID",
  name:      "Nombre",
  type:      "Tipo",
  status:    "Estado",
  totalSent: "Métricas",
  createdAt: "Fecha",
};

export const columns: ColumnDef<Campaign>[] = [
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
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Nombre
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("name");
      const subject = row.original.subject;
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <MailIcon className="size-3.5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{subject}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Tipo
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const type: string = row.getValue("type");
      const config = typeConfig[type];
      return (
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${config?.badge ?? "bg-muted text-muted-foreground"}`}>
          {config?.label ?? type}
        </span>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Estado
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      const config = statusConfig[status];
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config?.badge ?? "bg-muted text-muted-foreground"}`}>
          <span className={`size-1.5 rounded-full ${config?.dot ?? "bg-muted-foreground"}`} />
          {config?.label ?? status}
        </span>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "totalSent",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Métricas
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const totalSent: number = row.getValue("totalSent");
      const { totalOpened, totalClicked, status } = row.original;
      if (status === "draft" || status === "scheduled") {
        return <div className="text-xs text-muted-foreground">—</div>;
      }
      return (
        <div className="leading-tight">
          <div className="text-sm font-medium">{totalSent.toLocaleString()} enviados</div>
          <div className="text-xs text-muted-foreground">
            {totalOpened.toLocaleString()} abiertos · {totalClicked.toLocaleString()} clics
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Fecha
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const { sentAt, createdAt } = row.original;
      return (
        <div className="leading-tight">
          <div className="text-sm text-muted-foreground">{sentAt ?? createdAt}</div>
          <div className="text-xs text-muted-foreground/60">{sentAt ? "Enviada" : "Creada"}</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem>
              <EyeIcon />
              Ver campaña
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CopyIcon />
              Duplicar
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function CampaignsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
          placeholder="Buscar campañas..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter
          column={table.getColumn("status")!}
          title="Estado"
          options={[
            { label: "Enviada",    value: "sent"      },
            { label: "Borrador",   value: "draft"     },
            { label: "Programada", value: "scheduled" },
            { label: "Enviando",   value: "sending"   },
          ]}
        />
        <DataTableFacetedFilter
          column={table.getColumn("type")!}
          title="Tipo"
          options={[
            { label: "Específica", value: "specific" },
            { label: "Segmento",   value: "segment"  },
            { label: "General",    value: "all"      },
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
            {table.getFilteredRowModel().rows.length} campañas
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
            Crear Campaña
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
    </div>
  );
}
