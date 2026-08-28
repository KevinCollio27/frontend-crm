"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table"
import { AlertTriangleIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, Columns3Icon, StarIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/table-utils"
import { followUpService } from "@/services/follow-up.service"
import type { FollowUpAlert, FollowUpOpportunityRaw, ResponsibleRole } from "@/types/follow-up"

// A diferencia del listado de Funnels (estado/etapa/valor — algo estático), esta tabla
// muestra urgencia temporal: oportunidades abiertas ordenadas por días sin movimiento
// (último system_log), con nivel de alerta. El backend ya existía como
// follow-up-stats/days-without-contact (usado en el legacy bajo "Seguimiento") — se le
// sumó organización/responsable/etapa acá para esta versión del dashboard.
const ROLE_LABEL: Record<ResponsibleRole, string> = {
  owner:  "Propietario",
  admin:  "Administrador",
  member: "Miembro",
}

const ALERT_CONFIG: Record<FollowUpAlert, { label: string; dot: string; bar: string }> = {
  critical: { label: "Crítico",   dot: "bg-red-500",     bar: "bg-red-500" },
  at_risk:  { label: "En riesgo", dot: "bg-amber-500",   bar: "bg-amber-500" },
  on_track: { label: "Al día",    dot: "bg-emerald-500", bar: "bg-emerald-500" },
}

// Tope para la barra de severidad — más allá de esto, siempre se ve llena.
const SEVERITY_MAX_DAYS = 90
const TAKE = 5

const COLUMN_LABELS: Record<string, string> = {
  responsible:  "Responsable",
  organization: "Organización",
  name:         "Oportunidad",
  stage:        "Etapa",
  contact:      "Sin Contacto",
}

// Organización antes que Oportunidad — es corta (nombre de empresa) y no necesita
// truncar; el nombre de oportunidad va después, truncado más agresivo (max-w-44 en vez
// de los max-w-70 que usa Funnels), para que las 5 columnas quepan sin scroll horizontal.
const COLUMN_WIDTH: Record<string, string> = {
  responsible:  "w-44",
  organization: "w-28",
  stage:        "w-36",
  contact:      "w-32",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {}

function ResponsibleCell({ responsible }: { responsible: FollowUpOpportunityRaw["responsible"] }) {
  if (!responsible) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src={responsible.avatarUrl ?? "https://github.com/shadcn.png"} alt={responsible.name} />
        <AvatarFallback className="text-[10px] font-medium">{getInitials(responsible.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 max-w-32">
        <p className="truncate text-sm font-medium" title={responsible.name}>{responsible.name}</p>
        <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[responsible.role]}</p>
      </div>
    </div>
  )
}

function StageStars({ order, total }: { order: number | null; total: number }) {
  if (order == null || total === 0) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <StarIcon
            key={i}
            className={cn("size-3.5", i < order ? "fill-amber-400 text-amber-400" : "fill-muted-foreground/20 text-muted-foreground/20")}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{order}/{total}</span>
    </div>
  )
}

function ContactSeverityBar({ days, alert }: { days: number; alert: FollowUpAlert }) {
  const cfg = ALERT_CONFIG[alert]
  const width = Math.min(100, Math.round((days / SEVERITY_MAX_DAYS) * 100))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", cfg.bar)} style={{ width: `${width}%` }} />
      </div>
      <span className="flex items-center gap-1.5 text-xs">
        <span className={cn("size-1.5 shrink-0 rounded-full", cfg.dot)} />
        <span className="font-medium">{days} días</span>
        <span className="text-muted-foreground">· {cfg.label}</span>
      </span>
    </div>
  )
}

const columns: ColumnDef<FollowUpOpportunityRaw>[] = [
  {
    id: "responsible",
    header: "Responsable",
    cell: ({ row }) => <ResponsibleCell responsible={row.original.responsible} />,
  },
  {
    id: "organization",
    accessorFn: (row) => row.organizationName ?? "",
    header: "Organización",
    cell: ({ row }) => (
      <span className="block max-w-28 truncate text-sm text-muted-foreground" title={row.original.organizationName ?? undefined}>
        {row.original.organizationName ?? "—"}
      </span>
    ),
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Oportunidad",
    cell: ({ row }) => (
      <div className="flex items-stretch gap-2.5">
        <EntityAccentBar seed={row.original.id} />
        <span className="min-w-0 max-w-44 truncate text-sm font-medium" title={row.original.name}>
          {row.original.name}
        </span>
      </div>
    ),
  },
  {
    id: "stage",
    header: "Etapa",
    cell: ({ row }) => <StageStars order={row.original.stageOrder} total={row.original.stageTotal} />,
  },
  {
    id: "contact",
    header: "Sin Contacto",
    cell: ({ row }) => <ContactSeverityBar days={row.original.daysSinceContact} alert={row.original.alert} />,
  },
]

const SKELETON_ROWS = Array.from({ length: TAKE })

export function FollowUpTableCard() {
  const [rows, setRows] = React.useState<FollowUpOpportunityRaw[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [columnsOpen, setColumnsOpen] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    followUpService.daysWithoutContact({ page, take: TAKE })
      .then((res) => { if (!cancelled) { setRows(res.data); setTotal(res.total) } })
      .catch(() => { if (!cancelled) { setRows([]); setTotal(0) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page])

  const pageCount = Math.max(1, Math.ceil(total / TAKE))

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangleIcon className="size-8 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Seguimiento Pendiente</p>
              <p className="text-base font-semibold">Oportunidades abiertas por urgencia de contacto</p>
            </div>
          </div>
          <DropdownMenu open={columnsOpen} onOpenChange={setColumnsOpen}>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5" />}>
              <Columns3Icon className="size-3.5" />
              Columnas
              <ChevronDownIcon className={cn("size-3.5 transition-transform", columnsOpen && "rotate-180")} />
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
                    {COLUMN_LABELS[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
              {loading ? (
                SKELETON_ROWS.map((_, i) => (
                  <TableRow key={i}>
                    {table.getVisibleLeafColumns().map((col) => (
                      <TableCell key={col.id} className={COLUMN_WIDTH[col.id]}>
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center text-sm text-muted-foreground">
                    No hay oportunidades abiertas.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={COLUMN_WIDTH[cell.column.id]}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {total} oportunidad{total === 1 ? "" : "es"} abierta{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Página {page} de {pageCount}</span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="size-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeftIcon />
              </Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
