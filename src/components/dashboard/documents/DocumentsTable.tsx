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
import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon, ChevronDown, DownloadIcon, EyeIcon, MoreHorizontal, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { FaRegFile, FaRegFileExcel, FaRegFileImage, FaRegFilePdf, FaRegFilePowerpoint, FaRegFileWord, FaRegFileZipper } from "react-icons/fa6";
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
import { DocumentPreviewSheet } from "./DocumentPreviewSheet";
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

export interface Document {
  id: number;
  name: string;
  description?: string;
  extension: string;
  size: number;
  category: string;
  createdAt: string;
}

const data: Document[] = [
  { id: 1, name: "Logo GOXT", description: "Logo de GOXT", extension: "png", size: 36457, category: "otro", createdAt: "2026-02-13" },
  { id: 2, name: "Logo CRM", description: "Logo CRM Negro", extension: "png", size: 2146545, category: "otro", createdAt: "2026-03-12" },
  { id: 3, name: "GOXT, tecnología al servicio de las personas", description: "Presentación General GOXT", extension: "pdf", size: 11360343, category: "presentacion", createdAt: "2026-03-13" },
  { id: 4, name: "One Page Anastasia", description: "One Pager MX N1", extension: "pdf", size: 617457, category: "presentacion", createdAt: "2026-03-14" },
  { id: 5, name: "Contrato Marco GOXT", description: "Contrato marco de servicios", extension: "pdf", size: 245000, category: "contrato", createdAt: "2026-01-10" },
  { id: 6, name: "Manual de Identidad Visual", description: "Guía de uso de marca", extension: "pdf", size: 3200000, category: "presentacion", createdAt: "2026-01-25" },
  { id: 7, name: "Logo Fluxie", extension: "png", size: 45000, category: "otro", createdAt: "2026-02-01" },
  { id: 8, name: "Propuesta Comercial Q1", description: "Propuesta para cliente enterprise", extension: "pdf", size: 1500000, category: "presentacion", createdAt: "2026-02-15" },
  { id: 9, name: "Informe Mensual Marzo", description: "KPIs y métricas de marzo", extension: "pdf", size: 780000, category: "informe", createdAt: "2026-04-01" },
  { id: 10, name: "Logo CamionGO", description: "Versión principal fondo blanco", extension: "png", size: 128000, category: "otro", createdAt: "2026-04-05" },
];

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileConfig: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  pdf:  { icon: FaRegFilePdf,        iconClass: "text-red-600 dark:text-red-400",        bgClass: "bg-red-50 dark:bg-red-950" },
  png:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",      bgClass: "bg-blue-50 dark:bg-blue-950" },
  jpg:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",      bgClass: "bg-blue-50 dark:bg-blue-950" },
  jpeg: { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",      bgClass: "bg-blue-50 dark:bg-blue-950" },
  svg:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",      bgClass: "bg-blue-50 dark:bg-blue-950" },
  docx: { icon: FaRegFileWord,       iconClass: "text-sky-600 dark:text-sky-400",        bgClass: "bg-sky-50 dark:bg-sky-950" },
  doc:  { icon: FaRegFileWord,       iconClass: "text-sky-600 dark:text-sky-400",        bgClass: "bg-sky-50 dark:bg-sky-950" },
  xlsx: { icon: FaRegFileExcel,      iconClass: "text-green-600 dark:text-green-400",    bgClass: "bg-green-50 dark:bg-green-950" },
  xls:  { icon: FaRegFileExcel,      iconClass: "text-green-600 dark:text-green-400",    bgClass: "bg-green-50 dark:bg-green-950" },
  pptx: { icon: FaRegFilePowerpoint, iconClass: "text-orange-600 dark:text-orange-400",  bgClass: "bg-orange-50 dark:bg-orange-950" },
  ppt:  { icon: FaRegFilePowerpoint, iconClass: "text-orange-600 dark:text-orange-400",  bgClass: "bg-orange-50 dark:bg-orange-950" },
  zip:  { icon: FaRegFileZipper,     iconClass: "text-yellow-600 dark:text-yellow-400",  bgClass: "bg-yellow-50 dark:bg-yellow-950" },
  rar:  { icon: FaRegFileZipper,     iconClass: "text-yellow-600 dark:text-yellow-400",  bgClass: "bg-yellow-50 dark:bg-yellow-950" },
};

const extensionBadge: Record<string, string> = {
  pdf:  "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  png:  "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  jpg:  "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  docx: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  xlsx: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
};

const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />;
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />;
  return <ArrowUpDown className="ml-2 size-3.5" />;
};

const columnLabels: Record<string, string> = {
  id: "ID",
  name: "Nombre",
  extension: "Tipo",
  size: "Tamaño",
  category: "Categoría",
  createdAt: "Creado",
};

function getColumns(onPreview: (document: Document) => void): ColumnDef<Document>[] {
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
        const description = row.original.description;
        const extension = row.original.extension;
        const config = fileConfig[extension] ?? { icon: FaRegFile, iconClass: "text-muted-foreground", bgClass: "bg-muted" };
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2.5">
            <div className={`flex size-6 shrink-0 items-center justify-center rounded ${config.bgClass}`}>
              <Icon className={`size-3.5 ${config.iconClass}`} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{name}</div>
              {description && (
                <div className="text-xs text-muted-foreground">{description}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "extension",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Tipo
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const ext: string = row.getValue("extension");
        return (
          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium uppercase ${extensionBadge[ext] ?? "bg-muted text-muted-foreground"}`}>
            {ext}
          </span>
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "size",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Tamaño
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{formatSize(row.getValue("size"))}</div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Categoría
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize text-sm text-muted-foreground">{row.getValue("category")}</div>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
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
        const doc = row.original;
        return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onPreview(doc)}>
                <EyeIcon />
                Vista Previa
              </DropdownMenuItem>
              <DropdownMenuItem>
                <EyeIcon />
                Ver documento
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DownloadIcon />
                Descargar
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

export function DocumentsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const columns = React.useMemo(
    () => getColumns((doc) => { setSelectedDocument(doc); setSheetOpen(true); }),
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
          placeholder="Buscar documentos..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
        />
        <DataTableFacetedFilter
          column={table.getColumn("extension")!}
          title="Tipo"
          options={[
            { label: "PDF", value: "pdf" },
            { label: "PNG", value: "png" },
            { label: "JPG", value: "jpg" },
            { label: "DOCX", value: "docx" },
            { label: "XLSX", value: "xlsx" },
          ]}
        />
        <DataTableFacetedFilter
          column={table.getColumn("category")!}
          title="Categoría"
          options={[
            { label: "Presentación", value: "presentacion" },
            { label: "Contrato", value: "contrato" },
            { label: "Informe", value: "informe" },
            { label: "Otro", value: "otro" },
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
            {table.getFilteredRowModel().rows.length} documentos
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
            Subir Documento
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

      <DocumentPreviewSheet
        document={selectedDocument}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
