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
} from "@tanstack/react-table"
import { ArrowDownCircleIcon, ArrowUpCircleIcon, ChevronLeftIcon, ChevronRightIcon, StarIcon, TrophyIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon } from "@/lib/table-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Ancho fijo por columna (con `table-fixed`) — sin esto, `table-layout: auto` deja
// que el sobrante de ancho se acumule en la última columna (Rating quedaba con un
// vacío enorme a la derecha). "product" es la única sin ancho fijo: se lleva todo
// el espacio restante.
const COLUMN_WIDTH: Record<string, string> = {
  id:      "w-20",
  users:   "w-24",
  revenue: "w-32",
  rating:  "w-28",
}

// Mismo dato/caso que la Referencia 12 ("Best Performing AI Products"), pero armada
// con el DataTable real del sistema — Table/Button+getSortIcon/DataTablePagination,
// las mismas piezas que usa FunnelTable — en vez de la tabla HTML plana hardcodeada
// del resto de referencias. Por eso, a diferencia de las demás, esta sí queda
// theme-aware (sin bg-[#131313] fijo): la idea es comparar cómo se ve el mismo
// contenido con nuestro datatable real.
interface ProductRow {
  id: string
  product: string
  users: number
  revenue: string
  up: boolean
  rating: number
}

const PRODUCTS: ProductRow[] = [
  { id: "#A1021", product: "AI Sales Copilot",     users: 12430, revenue: "$428.9K", up: true,  rating: 4.9 },
  { id: "#A1022", product: "Smart CRM Assistant",  users: 9820,  revenue: "$312.4K", up: false, rating: 4.8 },
  { id: "#A1023", product: "AI Analytics Pro",     users: 8540,  revenue: "$289.7K", up: true,  rating: 5.0 },
  { id: "#A1024", product: "AI Support Agent",     users: 7210,  revenue: "$248.1K", up: true,  rating: 4.7 },
  { id: "#A1025", product: "Workflow Automator",   users: 6430,  revenue: "$219.5K", up: true,  rating: 4.9 },
  { id: "#A1026", product: "AI Meeting Notes",     users: 5980,  revenue: "$198.2K", up: false, rating: 4.8 },
  { id: "#A1027", product: "Predictive Insights",  users: 4820,  revenue: "$167.4K", up: true,  rating: 4.6 },
]

const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        ID {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs text-muted-foreground tabular-nums">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "product",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Product {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("product")}</span>,
  },
  {
    accessorKey: "users",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Users {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm">{(row.getValue("users") as number).toLocaleString("en-US")}</span>,
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Revenue {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const p = row.original
      return (
        <span className={cn("flex items-center gap-1.5 text-sm font-medium", p.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {p.up ? <ArrowUpCircleIcon className="size-4" /> : <ArrowDownCircleIcon className="size-4" />}
          {p.revenue}
        </span>
      )
    },
  },
  {
    accessorKey: "rating",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Rating {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 text-sm">
        <StarIcon className="size-3.5 fill-orange-400 text-orange-400" />
        ({(row.getValue("rating") as number).toFixed(1)})
      </span>
    ),
  },
]

export function ReferenceCardExample12() {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data: PRODUCTS,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  })

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <TrophyIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Best Performing AI Products</p>
            <p className="text-base font-semibold">DataTable real del sistema</p>
          </div>
        </div>
        <div className="rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className={COLUMN_WIDTH[h.column.id]}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={COLUMN_WIDTH[cell.column.id]}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer sin línea de selección — esta tabla no tiene columna de checkbox,
            así que "0 de N fila(s) seleccionada(s)" no aplicaría (a diferencia de
            DataTablePagination, pensado para tablas reales con selección masiva). */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium">Filas por página</p>
            <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-17.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top" align="center">
                {[5, 10, 15, 20, 25].map((size) => (
                  <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeftIcon />
              </Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
