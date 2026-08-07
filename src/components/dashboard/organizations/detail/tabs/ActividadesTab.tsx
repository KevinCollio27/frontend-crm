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
import {
  CalendarIcon,
  ChevronDown,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon, getInitials } from "@/lib/table-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { activityService } from "@/services/activity.service"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { ActivityRaw } from "@/types/activity"

// ─── Entity ───────────────────────────────────────────────────────────────────

interface TabActivity {
  id:              number
  title:           string
  type:            string
  isCompleted:     boolean
  dateFrom:        string | null
  opportunityName: string
  responsible:     string
  ubication:       string | null
  createdAt:       string
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function mapActivity(d: ActivityRaw): TabActivity {
  const type = d.opportunity_activity_detail
    ?.find((det) => det.label?.key === "activity_type")?.value ?? "Actividad"
  return {
    id:              d.id,
    title:           d.title ?? "Sin título",
    type,
    isCompleted:     d.is_completed,
    dateFrom:        d.date_from
      ? new Date(d.date_from).toLocaleDateString("es-CL", {
          day: "numeric", month: "short", year: "numeric",
        }) + " · " + new Date(d.date_from).toLocaleTimeString("es-CL", {
          hour: "2-digit", minute: "2-digit",
        })
      : null,
    opportunityName: d.opportunity?.name ?? "—",
    responsible:     d.user?.name ?? "—",
    ubication:       d.ubication,
    createdAt:       new Date(d.created_at).toLocaleDateString("es-CL", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  "Llamada":       { icon: <PhoneIcon  className="size-3.5" />, bg: "bg-blue-100",   color: "text-blue-600"   },
  "Reunión":       { icon: <UsersIcon  className="size-3.5" />, bg: "bg-violet-100", color: "text-violet-600" },
  "Video Llamada": { icon: <VideoIcon  className="size-3.5" />, bg: "bg-indigo-100", color: "text-indigo-600" },
  "Email":         { icon: <MailIcon   className="size-3.5" />, bg: "bg-sky-100",    color: "text-sky-600"    },
  "Visita":        { icon: <MapPinIcon className="size-3.5" />, bg: "bg-emerald-100",color: "text-emerald-600"},
}

const DEFAULT_ICON = { icon: <CalendarIcon className="size-3.5" />, bg: "bg-muted", color: "text-muted-foreground" }

const COLUMN_LABELS: Record<string, string> = {
  id:              "ID",
  title:           "Título",
  status:          "Estado",
  dateFrom:        "Fecha",
  opportunityName: "Oportunidad",
  responsible:     "Responsable",
  ubication:       "Ubicación",
  createdAt:       "Creada",
}

const DEFAULT_VISIBILITY: VisibilityState = {
  dateFrom:        false,
  status:          false,
  opportunityName: false,
  ubication:       false,
  createdAt:       false,
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select:  <div className="size-4 animate-pulse rounded bg-muted" />,
  id:      <div className="h-3 w-6 animate-pulse rounded bg-muted" />,
  title: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  status:          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  dateFrom:        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />,
  opportunityName: <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />,
  responsible:     <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />,
  ubication:       <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />,
  createdAt:       <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />,
  actions:         <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<TabActivity>[] = [
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
    enableHiding:  false,
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
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Título {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const act  = row.original
      return (
        <div className="flex items-stretch gap-2.5">
          <EntityAccentBar seed={act.id} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{act.title}</p>
            <p className="text-xs text-muted-foreground">{act.type}</p>
          </div>
        </div>
      )
    },
  },
  {
    id: "status",
    accessorFn: (row) => row.isCompleted,
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Estado {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const done: boolean = row.getValue("status")
      return (
        <Badge
          className={cn(
            "rounded-full border-0 px-2 py-0 text-xs",
            done
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          )}
          variant="secondary"
        >
          {done ? "Completada" : "Pendiente"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "dateFrom",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Fecha {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const date: string | null = row.getValue("dateFrom")
      return <span className="whitespace-nowrap text-sm text-muted-foreground">{date ?? "—"}</span>
    },
  },
  {
    accessorKey: "opportunityName",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Oportunidad {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("opportunityName")}</span>
    ),
  },
  {
    accessorKey: "responsible",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Responsable {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("responsible")
      return (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="text-[10px] font-medium">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "ubication",
    header: "Ubicación",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{(row.getValue("ubication") as string | null) ?? "—"}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Creada {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("createdAt")}</span>
    ),
  },
  // Editar/Eliminar deshabilitados por ahora — ver nota en el componente.
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const act = row.original
  //     return (
  //       <div className="flex justify-end">
  //         <DropdownMenu>
  //           <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
  //             <span className="sr-only">Abrir menú</span>
  //             <MoreHorizontalIcon className="size-4" />
  //           </DropdownMenuTrigger>
  //           <DropdownMenuContent align="end" className="min-w-44">
  //             <DropdownMenuGroup>
  //               <DropdownMenuLabel>{act.title}</DropdownMenuLabel>
  //               <DropdownMenuItem><PencilIcon /> Editar</DropdownMenuItem>
  //             </DropdownMenuGroup>
  //             <DropdownMenuSeparator />
  //             <DropdownMenuItem className="text-destructive focus:text-destructive">
  //               <Trash2Icon /> Eliminar
  //             </DropdownMenuItem>
  //           </DropdownMenuContent>
  //         </DropdownMenu>
  //       </div>
  //     )
  //   },
  // },
]

// ─── Component ────────────────────────────────────────────────────────────────

// Solo lectura por ahora: una actividad siempre pertenece a una oportunidad
// (opportunity_activity.opportunity_id, sin organization_id propio), y la org puede
// tener 0, 1 o varias oportunidades — no hay un target inequívoco para crear desde acá.
// Crear/Editar/Eliminar quedan comentados hasta resolver ese flujo (ya funcionan bien
// desde el detalle de la oportunidad, ver funnels/detail/tabs/ActividadesTab.tsx).
interface Props { orgId: number }

export function ActividadesTab({ orgId }: Props) {
  const [data, setData]             = React.useState<TabActivity[]>([])
  const [total, setTotal]           = React.useState(0)
  const [loading, setLoading]       = React.useState(true)
  const [search, setSearch]         = React.useState("")
  const [sorting, setSorting]       = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_VISIBILITY)
  const [query, setQuery]           = React.useState({ page: 1, pageSize: 10, search: "" })
  const [refreshKey, setRefreshKey] = React.useState(0)

  // El payload de "activity" no trae organization_id ni la oportunidad anidada
  // — no se puede filtrar por org acá, así que refresca ante cualquier evento
  // mientras esta pestaña está montada (la query igual queda scopeada a orgId).
  useEntityRealtime("activity", () => setRefreshKey((k) => k + 1))

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, page: 1, search })), 400)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    activityService
      .list({ page: query.page, take: query.pageSize, filter: query.search || undefined, organizationId: orgId })
      .then((res) => {
        if (cancelled) return
        setData(res.data.map(mapActivity))
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
      <div className="flex items-center gap-2">
        <Input
          className="h-8 max-w-45 text-sm"
          placeholder="Filtrar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {total} actividad{total !== 1 ? "es" : ""}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs" />}>
              Columnas <ChevronDown className="ml-1 size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
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
          {/* Crear actividad deshabilitado por ahora — ver nota en el componente.
          <Button size="sm" className="h-8 gap-1.5 text-xs">
            <PlusIcon className="size-3.5" /> Actividad
          </Button>
          */}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
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
                  Sin actividades vinculadas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}
