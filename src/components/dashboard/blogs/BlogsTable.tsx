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
import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon, BookOpenIcon, ChevronDown, EyeIcon, Link2Icon, MoreHorizontal, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
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

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  tags: string;
  views: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

const data: BlogPost[] = [
  { id: 1, title: "Suministro en festivales gastronómicos",               slug: "suministro-en-festivales-gastronomicos",           tags: "economía circular, suministros, cadena de suministro, NODO, Sostenibilidad",            views: 32,  isPublished: true,  publishedAt: "2026-03-25", createdAt: "2026-03-25" },
  { id: 2, title: "Encrucijada Geopolítica: Un Efecto Dominó",            slug: "encrucijada-geopolitica-un-efecto-domino",         tags: "economía circular, suministros, cadena de suministro, NODO, Sostenibilidad, Geopolítica", views: 0,   isPublished: true,  publishedAt: "2026-03-27", createdAt: "2026-03-27" },
  { id: 3, title: "El futuro del transporte de carga en Latinoamérica",   slug: "futuro-transporte-carga-latinoamerica",            tags: "logística, transporte, carga, Latinoamérica",                                           views: 148, isPublished: true,  publishedAt: "2026-02-10", createdAt: "2026-02-08" },
  { id: 4, title: "Cómo optimizar tu cadena de suministro",               slug: "optimizar-cadena-suministro-tecnologia",           tags: "cadena de suministro, tecnología, TMS",                                                 views: 214, isPublished: true,  publishedAt: "2026-02-20", createdAt: "2026-02-18" },
  { id: 5, title: "Tendencias logísticas 2026",                           slug: "tendencias-logisticas-2026",                       tags: "logística, tendencias, 2026",                                                           views: 89,  isPublished: true,  publishedAt: "2026-01-15", createdAt: "2026-01-12" },
  { id: 6, title: "Gestión de flotas inteligente con GOXT",               slug: "gestion-flotas-inteligente-goxt",                  tags: "flotas, gestión, TMS, GOXT",                                                            views: 67,  isPublished: true,  publishedAt: "2026-01-28", createdAt: "2026-01-25" },
  { id: 7, title: "Impacto del cambio climático en rutas de distribución", slug: "impacto-cambio-climatico-rutas-distribucion",     tags: "sostenibilidad, cambio climático, distribución",                                        views: 0,   isPublished: false,                            createdAt: "2026-04-10" },
  { id: 8, title: "Integración de IA en la logística moderna",            slug: "integracion-ia-logistica-moderna",                 tags: "inteligencia artificial, logística, automatización",                                     views: 0,   isPublished: false,                            createdAt: "2026-04-14" },
];

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />;
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />;
  return <ArrowUpDown className="ml-2 size-3.5" />;
};

const columnLabels: Record<string, string> = {
  id:          "ID",
  title:       "Título",
  tags:        "Etiquetas",
  views:       "Vistas",
  isPublished: "Estado",
  createdAt:   "Fecha",
};

export const columns: ColumnDef<BlogPost>[] = [
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
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Título
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const title: string = row.getValue("title");
      const slug = row.original.slug;
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-orange-500/10">
            <BookOpenIcon className="size-3.5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-muted-foreground">{slug}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Etiquetas
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const tags: string = row.getValue("tags");
      const tagList = tags.split(",").map((t) => t.trim());
      const visible = tagList.slice(0, 2);
      const extra = tagList.length - 2;
      return (
        <div className="flex flex-wrap items-center gap-1">
          {visible.map((tag, i) => (
            <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-xs text-muted-foreground">+{extra}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "views",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Vistas
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue<number>("views").toLocaleString()} vistas</div>
    ),
  },
  {
    accessorKey: "isPublished",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Estado
        {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const isPublished: boolean = row.getValue("isPublished");
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
          isPublished
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        }`}>
          <span className={`size-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-zinc-400"}`} />
          {isPublished ? "Publicado" : "Borrador"}
        </span>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))),
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
      const { publishedAt, createdAt } = row.original;
      return (
        <div className="leading-tight">
          <div className="text-sm text-muted-foreground">{publishedAt ?? createdAt}</div>
          <div className="text-xs text-muted-foreground/60">{publishedAt ? "Publicado" : "Borrador"}</div>
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
              Ver post
            </DropdownMenuItem>
            <DropdownMenuItem>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link2Icon />
              Copiar enlace
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

export function BlogsTable() {
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
          placeholder="Buscar posts..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter
          column={table.getColumn("isPublished")!}
          title="Estado"
          options={[
            { label: "Publicado", value: "true"  },
            { label: "Borrador",  value: "false" },
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
            {table.getFilteredRowModel().rows.length} posts
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
            Nuevo Post
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
