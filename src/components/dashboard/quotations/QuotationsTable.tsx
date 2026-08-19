"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChevronDown,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FileSearchIcon,
  FileTextIcon,
  HistoryIcon,
  ListIcon,
  Loader2Icon,
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  ShipIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSortIcon, getInitials } from "@/lib/table-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { KanbanFacetedFilter } from "@/components/ui/faceted-filter"
import { Separator } from "@/components/ui/separator"
import { SingleSelectFilter, type SingleSelectOption } from "@/components/ui/single-select-filter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { quotationService } from "@/services/quotation.service"
import { notify } from "@/lib/notify"
import { orgConfirm } from "@/lib/confirm"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { useCargoIntegration } from "@/hooks/useCargoIntegration"
import { useIsMobile } from "@/hooks/use-mobile"
import { downloadQuotationPdf, warmPdfCache, clearPdfCache } from "./shared/download-pdf"
import { confirmAndSendToCargo, isAcceptedStatus } from "./shared/send-to-cargo"
import type { QuotationRaw } from "@/types/quotation"
import { CreateQuotationSheet } from "./CreateQuotationSheet"
import { QuotationPreviewSheet } from "./QuotationPreviewSheet"
import { QuotationPdfPreviewSheet } from "./QuotationPdfPreviewSheet"
import { QuotationHistorySheet } from "./QuotationHistorySheet"
import { SendQuotationSheet } from "./SendQuotationSheet"
import { TemplateAssignmentSheet } from "./TemplateAssignmentSheet"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"

// ─── Entity ───────────────────────────────────────────────────────────────────

interface Quotation {
  id:              number
  name:            string
  itemCount:       number
  status:          string
  type:            string
  amount:          number
  currency:        string
  validUntil:      string | null
  createdAt:       string
  responsible:     { name: string; avatarUrl: string | null } | null
  opportunityId:   number | null
  opportunityName: string | null
  isSentToCargo:   boolean
  pdfTemplateId:   number | null
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function mapQuotation(q: QuotationRaw): Quotation {
  return {
    id:              q.id,
    name:            q.name,
    itemCount:       q.quotation_fields?.length ?? 0,
    status:          q.status,
    type:            q.type,
    amount:          q.amount,
    currency:        q.currency?.symbol ?? "CLP",
    validUntil:      q.valid_until
      ? new Date(q.valid_until).toLocaleDateString("es-CL", {
          day: "2-digit", month: "2-digit", year: "2-digit",
        })
      : null,
    createdAt:       new Date(q.created_at).toLocaleDateString("es-CL", {
      day: "numeric", month: "short", year: "numeric",
    }),
    responsible:     q.created_user ? { name: q.created_user.name, avatarUrl: q.created_user.avatar_url } : null,
    opportunityId:   q.opportunity?.id ?? null,
    opportunityName: q.opportunity?.name ?? null,
    isSentToCargo:   q.is_sent_to_cargo ?? false,
    pdfTemplateId:   q.pdf_template_id ?? null,
  }
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:     { label: "Borrador",  className: "bg-muted text-muted-foreground border-border"      },
  sent:      { label: "Enviada",   className: "bg-blue-50 text-blue-700 border-blue-200"          },
  accepted:  { label: "Aceptada",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:  { label: "Rechazada", className: "bg-red-50 text-red-600 border-red-200"             },
  borrador:  { label: "Borrador",  className: "bg-muted text-muted-foreground border-border"      },
  enviada:   { label: "Enviada",   className: "bg-blue-50 text-blue-700 border-blue-200"          },
  aceptada:  { label: "Aceptada",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rechazada: { label: "Rechazada", className: "bg-red-50 text-red-600 border-red-200"             },
}

const STATUSES = [
  { key: "draft",    label: "Borrador",  dot: "bg-muted-foreground/60" },
  { key: "sent",     label: "Enviada",   dot: "bg-blue-500"            },
  { key: "accepted", label: "Aceptada",  dot: "bg-emerald-500"         },
  { key: "rejected", label: "Rechazada", dot: "bg-red-500"             },
]

const LEGACY_STATUS: Record<string, string> = {
  borrador: "draft", enviada: "sent", aceptada: "accepted", rechazada: "rejected",
}

const STATUS_OPTIONS: SingleSelectOption[] = [
  { value: "all",      label: "Todas"     },
  { value: "draft",    label: "Borrador"  },
  { value: "sent",     label: "Enviada"   },
  { value: "accepted", label: "Aceptada"  },
  { value: "rejected", label: "Rechazada" },
]

const TYPE_LABEL: Record<string, string> = {
  sale:     "Venta",
  purchase: "Compra",
}

const TYPE_OPTIONS: SingleSelectOption[] = [
  { value: "all",      label: "Todas"  },
  { value: "sale",     label: "Venta"  },
  { value: "purchase", label: "Compra" },
]

const COLUMN_LABELS: Record<string, string> = {
  id:              "ID",
  name:            "Nombre",
  status:          "Estado",
  amount:          "Monto",
  responsible:     "Responsable",
  type:            "Tipo",
  validUntil:      "Válida hasta",
  createdAt:       "Creado",
  opportunityName: "Oportunidad",
}

const DEFAULT_VISIBILITY: VisibilityState = {
  type:       false,
  validUntil: false,
  createdAt:  false,
}

// En mobile no hay espacio para columnas de más — solo Nombre queda visible por
// defecto (Acciones y el checkbox de selección no dependen de esto, siempre se ven).
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id:              false,
  status:          false,
  amount:          false,
  responsible:     false,
  type:            false,
  validUntil:      false,
  createdAt:       false,
  opportunityName: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, symbol: string) {
  const n = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(amount)
  return symbol === "CLP" ? `$${n}` : `${symbol} ${n}`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SKELETON_ROW_COUNT = 6

const skeletonCell: Record<string, React.ReactNode> = {
  select: <div className="size-4 animate-pulse rounded bg-muted" />,
  id:     <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-7 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  status:          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />,
  amount:          <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  opportunityName: <div className="h-4 w-32 animate-pulse rounded bg-muted" />,
  responsible: (
    <div className="flex items-center gap-2">
      <div className="size-6 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  ),
  type:       <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  validUntil: <div className="h-4 w-16 animate-pulse rounded bg-muted" />,
  createdAt:  <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:    <div className="size-8 animate-pulse rounded bg-muted" />,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function getColumns(
  onEdit:         (id: number) => void,
  onDelete:       (row: Quotation) => void,
  onHistory:      (row: Quotation) => void,
  onDownload:     (row: Quotation) => void,
  onStatusChange: (row: Quotation, status: string) => void,
  onSend:         (row: Quotation) => void,
  downloading:    number | null,
  onPreview:      (id: number) => void,
  onSendToCargo:  (row: Quotation) => void,
  hasCargoIntegration: boolean,
  onDuplicate:    (row: Quotation) => void,
  onTemplate:     (row: Quotation) => void,
  onPdfPreview:   (row: Quotation) => void,
): ColumnDef<Quotation>[] {
  return [
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
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue("id")}</span>
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
        const q = row.original
        return (
          <div className="flex items-stretch gap-2.5">
            <EntityAccentBar seed={q.id} />
            <div className="leading-tight">
              <div className="text-sm font-medium">{q.name}</div>
              <div className="text-xs text-muted-foreground">{q.itemCount} item(s)</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const current = row.getValue("status") as string
        const conf    = STATUS_CONFIG[current]
          ?? { label: current, className: "bg-muted text-muted-foreground border-border" }
        const normalizedCurrent = LEGACY_STATUS[current] ?? current
        const options = STATUSES.filter((s) => s.key !== normalizedCurrent)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              nativeButton={false}
              render={
                <Badge
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs cursor-pointer hover:opacity-75 transition-opacity",
                    conf.className,
                  )}
                />
              }
            >
              {conf.label}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-36">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                {options.map((s) => (
                  <DropdownMenuItem key={s.key} onClick={() => onStatusChange(row.original, s.key)}>
                    <span className={cn("size-2 rounded-full", s.dot)} />
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Monto {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold tabular-nums text-emerald-600">
          {formatCurrency(row.getValue("amount") as number, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "opportunityName",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Oportunidad {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.original.opportunityName
        if (!name) return <span className="text-sm text-muted-foreground">—</span>
        return <span className="text-sm">{name}</span>
      },
    },
    {
      id: "responsible",
      accessorFn: (row) => row.responsible?.name ?? "",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Responsable {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const responsible = row.original.responsible
        if (!responsible) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-6 shrink-0">
              <AvatarImage src={responsible.avatarUrl ?? "https://github.com/shadcn.png"} alt={responsible.name} />
              <AvatarFallback className="text-[9px] font-semibold">{getInitials(responsible.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{responsible.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {TYPE_LABEL[row.getValue("type") as string] ?? row.getValue("type")}
        </span>
      ),
    },
    {
      accessorKey: "validUntil",
      header: "Válida hasta",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {(row.getValue("validUntil") as string) ?? "—"}
        </span>
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
        <span className="text-sm text-muted-foreground">{row.getValue("createdAt")}</span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const canSendToCargo = hasCargoIntegration && isAcceptedStatus(row.original.status)
        const showCargoBadge = canSendToCargo && !row.original.isSentToCargo
        return (
        <DropdownMenu onOpenChange={(open) => { if (open) warmPdfCache(row.original.id) }}>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 p-0" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontalIcon className="size-4" />
            {showCargoBadge && (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-500" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onPreview(row.original.id)}>
                <EyeIcon /> Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPdfPreview(row.original)}>
                <FileSearchIcon /> Vista Previa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                <PencilIcon /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
                <CopyIcon /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDownload(row.original)}
                disabled={downloading === row.original.id}
              >
                {downloading === row.original.id
                  ? <Loader2Icon className="animate-spin" />
                  : <DownloadIcon />
                }
                {downloading === row.original.id ? "Generando..." : "Descargar PDF"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSend(row.original)}>
                <MailIcon /> Enviar correo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHistory(row.original)}>
                <HistoryIcon /> Ver historial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTemplate(row.original)}>
                <FileTextIcon /> Plantilla
              </DropdownMenuItem>
              {canSendToCargo && (
                <DropdownMenuItem
                  onClick={() => onSendToCargo(row.original)}
                  disabled={row.original.isSentToCargo}
                >
                  <ShipIcon /> {row.original.isSentToCargo ? "Ya enviado a Cargo" : "Enviar a Cargo"}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2Icon /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )
      },
    },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuotationsTable() {
  const { hasCargoIntegration, cargoIntegration } = useCargoIntegration()
  const [rawItems, setRawItems]     = React.useState<QuotationRaw[]>([])
  const [data, setData]             = React.useState<Quotation[]>([])
  const [loading, setLoading]       = React.useState(true)
  const [sorting, setSorting]       = React.useState<SortingState>([])
  const [filter, setFilter]         = React.useState("")
  const [statusFilter, setStatusFilter]         = React.useState("all")
  const [typeFilter, setTypeFilter]             = React.useState("all")
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_VISIBILITY)
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [rowSelection, setRowSelection]         = React.useState({})
  const [createOpen, setCreateOpen]     = React.useState(false)
  const [editEntity, setEditEntity]     = React.useState<QuotationRaw | null>(null)
  const [previewEntity, setPreviewEntity] = React.useState<QuotationRaw | null>(null)
  const [historyTarget, setHistoryTarget] = React.useState<Quotation | null>(null)
  const [sendTarget, setSendTarget]     = React.useState<Quotation | null>(null)
  const [templateTarget, setTemplateTarget] = React.useState<Quotation | null>(null)
  const [pdfPreviewTarget, setPdfPreviewTarget] = React.useState<Quotation | null>(null)
  const [downloading, setDownloading]   = React.useState<number | null>(null)
  const [refreshKey, setRefreshKey]     = React.useState(0)

  // Tiempo real: si otra sesión crea/edita/elimina una cotización en este
  // workspace, refresca la tabla sin esperar a un F5 manual.
  useEntityRealtime("quotation", () => setRefreshKey((k) => k + 1))

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    quotationService
      .list(statusFilter !== "all" ? { status: statusFilter } : {})
      .then((res) => {
        if (cancelled) return
        setRawItems(res)
        setData(res.map(mapQuotation))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [statusFilter, refreshKey])

  function handleEdit(id: number) {
    const raw = rawItems.find((q) => q.id === id)
    if (raw) setEditEntity(raw)
  }

  function handlePreview(id: number) {
    const raw = rawItems.find((q) => q.id === id)
    if (raw) setPreviewEntity(raw)
  }

  async function handleDuplicate(row: Quotation) {
    const pendingId = notify.info({ title: "Duplicando cotización", description: "Procesando...", duration: Infinity })
    try {
      const duplicated = await quotationService.duplicate(row.id)
      setRawItems((prev) => [duplicated, ...prev])
      setData((prev) => [mapQuotation(duplicated), ...prev])
      notify.dismiss(pendingId)
      notify.success({ title: "Cotización duplicada", description: `"${duplicated.name}" se creó correctamente.` })
    } catch (error) {
      notify.dismiss(pendingId)
      notify.error({
        title:       "No se pudo duplicar",
        description: (error as { message?: string })?.message ?? `No se pudo duplicar "${row.name}".`,
      })
    }
  }

  async function handleSendToCargo(row: Quotation) {
    const raw = rawItems.find((q) => q.id === row.id)
    if (!raw || !cargoIntegration) return
    const ok = await confirmAndSendToCargo(raw, cargoIntegration.id)
    if (ok) {
      setRawItems((prev) => prev.map((q) => (q.id === row.id ? { ...q, is_sent_to_cargo: true } : q)))
      setData((prev) => prev.map((q) => (q.id === row.id ? { ...q, isSentToCargo: true } : q)))
      setPreviewEntity((prev) => (prev && prev.id === row.id ? { ...prev, is_sent_to_cargo: true } : prev))
    }
  }

  async function handleDelete(row: Quotation) {
    const confirmed = await orgConfirm.delete(row.name)
    if (!confirmed) return

    setData((prev) => prev.filter((q) => q.id !== row.id))
    setRawItems((prev) => prev.filter((q) => q.id !== row.id))

    quotationService.delete(row.id)
      .then(() => notify.success({ title: "Cotización eliminada", description: `"${row.name}" fue eliminada.` }))
      .catch(() => {
        setRawItems((prev) => [...prev])
        setData((prev) => [...prev])
        notify.error({ title: "Algo salió mal", description: `No se pudo eliminar "${row.name}".` })
      })
  }

  async function handleDownload(row: Quotation) {
    if (downloading === row.id) return
    setDownloading(row.id)
    try {
      await downloadQuotationPdf(row.id, row.name)
    } catch {
      notify.error({ title: "No se pudo generar el PDF", description: `"${row.name}" falló al generar.` })
    } finally {
      setDownloading(null)
    }
  }

  function handleStatusChange(row: Quotation, newStatus: string) {
    const prevStatus = row.status
    setData((prev) => prev.map((q) => q.id === row.id ? { ...q, status: newStatus } : q))
    setRawItems((prev) => prev.map((q) => q.id === row.id ? { ...q, status: newStatus } : q))
    clearPdfCache(row.id)

    quotationService.updateStatus(row.id, newStatus)
      .then(() => notify.success({
        title:       "Estado actualizado",
        description: `"${row.name}" ahora está ${STATUS_CONFIG[newStatus]?.label ?? newStatus}.`,
      }))
      .catch(() => {
        setData((prev) => prev.map((q) => q.id === row.id ? { ...q, status: prevStatus } : q))
        setRawItems((prev) => prev.map((q) => q.id === row.id ? { ...q, status: prevStatus } : q))
        notify.error({ title: "No se pudo actualizar", description: `No se pudo cambiar el estado de "${row.name}".` })
      })
  }

  function handleSheetSuccess(result: QuotationRaw, mode: "create" | "update") {
    if (mode === "create") {
      setRawItems((prev) => [result, ...prev])
      setData((prev) => [mapQuotation(result), ...prev])
    } else {
      clearPdfCache(result.id)
      setRawItems((prev) => prev.map((q) => q.id === result.id ? result : q))
      setData((prev) => prev.map((q) => q.id === result.id ? mapQuotation(result) : q))
      setEditEntity(null)
    }
  }

  const columns = React.useMemo(
    () => getColumns(
      handleEdit, handleDelete, setHistoryTarget, handleDownload, handleStatusChange, setSendTarget,
      downloading, handlePreview, handleSendToCargo, hasCargoIntegration, handleDuplicate,
      setTemplateTarget,
      setPdfPreviewTarget,
    ),
    [rawItems, downloading, hasCargoIntegration],
  )

  // Tipo y Responsable — client-side, el backend no tiene esos params (a
  // diferencia de Estado, que sí se manda al fetch).
  const responsibleOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return data.filter((q) => {
      const name = q.responsible?.name
      if (!name || seen.has(name)) return false
      seen.add(name)
      return true
    }).map((q) => ({ value: q.responsible!.name, label: q.responsible!.name }))
  }, [data])

  const visibleData = React.useMemo(() => {
    return data.filter((q) => {
      if (typeFilter !== "all" && q.type !== typeFilter) return false
      if (responsibleFilter.length > 0 && !responsibleFilter.includes(q.responsible?.name ?? "")) return false
      return true
    })
  }, [data, typeFilter, responsibleFilter])

  const table = useReactTable({
    data: visibleData,
    columns,
    onSortingChange:          setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:     setRowSelection,
    getCoreRowModel:          getCoreRowModel(),
    getFilteredRowModel:      getFilteredRowModel(),
    getPaginationRowModel:    getPaginationRowModel(),
    getSortedRowModel:        getSortedRowModel(),
    state: { sorting, columnVisibility, rowSelection },
    globalFilterFn: (row, _id, value: string) => {
      // Filtro puramente numérico (con o sin "#" adelante) matchea por ID exacto —
      // así un equipo puede compartir "#123" y encontrar la cotización al tiro.
      const idMatch = value.trim().match(/^#?(\d+)$/)
      return (
        row.original.name.toLowerCase().includes(value.toLowerCase()) ||
        (row.original.opportunityName?.toLowerCase().includes(value.toLowerCase()) ?? false) ||
        (idMatch !== null && row.original.id === Number(idMatch[1]))
      )
    },
  })

  React.useEffect(() => {
    table.setGlobalFilter(filter)
  }, [filter, table])

  const hasActiveFilters = !!filter || statusFilter !== "all" || typeFilter !== "all" || responsibleFilter.length > 0

  function resetFilters() {
    setFilter("")
    setStatusFilter("all")
    setTypeFilter("all")
    setResponsibleFilter([])
  }

  return (
    <div className="w-full">

      {/* Row 1 — view toggle + create */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
          <span className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-medium shadow-sm">
            <ListIcon className="size-3.5" />
            Lista
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Crear Cotización</Button>
      </div>

      {/* Row 2 — filters. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 border-b pb-2 md:flex-row md:items-center md:border-b-0 md:pb-0">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cotizaciones..."
              className="h-8 pl-8 text-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Grid de 2 columnas — "Restablecer" es un ítem más del grid (no fila propia),
              así que el filtro impar (son 3) se empareja con él en vez de quedar solo. */}
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Estado"
                options={STATUS_OPTIONS}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
            </div>

            <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />

            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SingleSelectFilter
                title="Tipo"
                options={TYPE_OPTIONS}
                selected={typeFilter}
                onChange={setTypeFilter}
              />
            </div>

            <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />

            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <KanbanFacetedFilter
                title="Responsable"
                options={responsibleOptions}
                selected={responsibleFilter}
                onChange={setResponsibleFilter}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="w-full h-8 px-2 text-xs md:w-auto" onClick={resetFilters}>
                <XIcon className="size-3.5" />
                Restablecer
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          {!loading && (
            <span className="w-full text-xs text-muted-foreground md:w-auto">
              {table.getFilteredRowModel().rows.length} cotizaciones
            </span>
          )}
          <div className="[&_button]:w-full md:[&_button]:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
                Columnas <ChevronDown className="ml-1.5 size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-4 mt-3 rounded-md border">
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
              Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                <TableRow key={i}>
                  {table.getVisibleLeafColumns().map((col) => (
                    <TableCell key={col.id}>
                      {skeletonCell[col.id] ?? <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />}
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
                  Sin cotizaciones registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3">
        <DataTablePagination table={table} />
      </div>

      {/* Sheets */}
      <CreateQuotationSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleSheetSuccess}
      />

      <CreateQuotationSheet
        open={!!editEntity}
        onOpenChange={(v) => { if (!v) setEditEntity(null) }}
        entity={editEntity ?? undefined}
        opportunityId={editEntity?.opportunity?.id}
        opportunityName={editEntity?.opportunity?.name}
        onSuccess={handleSheetSuccess}
      />

      <QuotationPreviewSheet
        open={!!previewEntity}
        onOpenChange={(v) => { if (!v) setPreviewEntity(null) }}
        entity={previewEntity}
        onEdit={() => {
          const id = previewEntity!.id
          setPreviewEntity(null)
          handleEdit(id)
        }}
        onDownload={() => {
          const row = data.find((d) => d.id === previewEntity!.id)
          if (row) handleDownload(row)
        }}
        downloading={downloading === previewEntity?.id}
        onSend={() => {
          const row = data.find((d) => d.id === previewEntity!.id)
          if (row) setSendTarget(row)
        }}
        onSendToCargo={() => {
          const row = data.find((d) => d.id === previewEntity!.id)
          if (row) handleSendToCargo(row)
        }}
      />

      {historyTarget && (
        <QuotationHistorySheet
          open
          onOpenChange={(v) => { if (!v) setHistoryTarget(null) }}
          quotationId={historyTarget.id}
          quotationName={historyTarget.name}
        />
      )}

      {sendTarget && (
        <SendQuotationSheet
          open
          onOpenChange={(v) => { if (!v) setSendTarget(null) }}
          quotationId={sendTarget.id}
          quotationName={sendTarget.name}
        />
      )}

      {templateTarget && (
        <TemplateAssignmentSheet
          open
          onOpenChange={(v) => { if (!v) setTemplateTarget(null) }}
          title="Plantilla"
          description="Elige la plantilla PDF de esta cotización."
          note="Tiene prioridad sobre la plantilla de la oportunidad y la predeterminada del workspace. Si no elegís ninguna, se usa la de la oportunidad o la del workspace."
          currentTemplateId={templateTarget.pdfTemplateId}
          onSelect={async (id) => {
            await quotationService.updatePdfTemplate(templateTarget.id, id)
            clearPdfCache(templateTarget.id)
            setData((prev) => prev.map((q) => (q.id === templateTarget.id ? { ...q, pdfTemplateId: id } : q)))
            setRawItems((prev) => prev.map((q) => (q.id === templateTarget.id ? { ...q, pdf_template_id: id } : q)))
            setTemplateTarget((prev) => (prev ? { ...prev, pdfTemplateId: id } : prev))
          }}
        />
      )}

      <QuotationPdfPreviewSheet
        open={!!pdfPreviewTarget}
        onOpenChange={(open) => { if (!open) setPdfPreviewTarget(null) }}
        quotationId={pdfPreviewTarget?.id ?? null}
        quotationName={pdfPreviewTarget?.name}
      />

    </div>
  )
}
