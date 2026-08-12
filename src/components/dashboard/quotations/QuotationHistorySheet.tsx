"use client"

import * as React from "react"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowRightLeftIcon,
  ClockIcon,
  FileDownIcon,
  FileTextIcon,
  HistoryIcon,
  Loader2Icon,
  MailIcon,
  PaperclipIcon,
  PencilIcon,
  SettingsIcon,
  Trash2Icon,
  TruckIcon,
  XIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { quotationHistoryService } from "@/services/quotationHistory.service"
import type { QuotationHistoryRaw } from "@/types/quotationHistory"
import { getInitials } from "@/lib/table-utils"

// ─── Config ───────────────────────────────────────────────────────────────────

interface ActionConf {
  label:      string
  icon:       LucideIcon
  iconClass:  string
  badgeClass: string
}

const ACTION_CONFIG: Record<string, ActionConf> = {
  quotation_created:  { label: "Cotización creada",    icon: FileTextIcon,       iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400", badgeClass: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  quotation_updated:  { label: "Información editada",  icon: PencilIcon,         iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",         badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"         },
  services_updated:   { label: "Servicios editados",   icon: SettingsIcon,       iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",     badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"     },
  status_changed:     { label: "Estado cambiado",      icon: ArrowRightLeftIcon, iconClass: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400", badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
  pdf_downloaded:     { label: "PDF descargado",       icon: FileDownIcon,       iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  email_sent:         { label: "Correo enviado",       icon: MailIcon,           iconClass: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",         badgeClass: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400"         },
  file_attached:      { label: "Documento adjuntado",  icon: PaperclipIcon,      iconClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400", badgeClass: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" },
  file_deleted:       { label: "Documento eliminado",  icon: Trash2Icon,         iconClass: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",             badgeClass: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"             },
  sent_to_cargo:      { label: "Enviado a Cargo",      icon: TruckIcon,          iconClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",        badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"       },
  quotation_deleted:  { label: "Cotización eliminada", icon: Trash2Icon,         iconClass: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",             badgeClass: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"             },
}

const FALLBACK_CONF: ActionConf = {
  label:      "Evento",
  icon:       HistoryIcon,
  iconClass:  "bg-muted text-muted-foreground",
  badgeClass: "bg-muted text-muted-foreground",
}

const LIMIT = 25

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDay(items: QuotationHistoryRaw[]) {
  const groups: { label: string; key: string; items: QuotationHistoryRaw[] }[] = []
  const map = new Map<string, (typeof groups)[0]>()

  for (const item of items) {
    const date = new Date(item.created_at)
    const key  = format(date, "yyyy-MM-dd")
    if (!map.has(key)) {
      let label: string
      if (isToday(date))     label = "Hoy"
      else if (isYesterday(date)) label = "Ayer"
      else {
        const raw = format(date, "EEEE, d 'de' MMMM", { locale: es })
        label = raw.charAt(0).toUpperCase() + raw.slice(1)
      }
      const group = { label, key, items: [] }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key)!.items.push(item)
  }
  return groups
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 p-5">
      {[4, 3].map((count, gi) => (
        <div key={gi}>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="flex-1 border-t" />
          </div>
          <div className="relative ml-3">
            <div className="absolute bottom-0 left-0 top-3 border-l-2" />
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="relative pb-6 pl-8 last:pb-0">
                <div className="absolute left-px top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />
                <div className="flex items-start gap-3">
                  <div className="size-8 animate-pulse rounded-lg bg-muted shrink-0" />
                  <div className="space-y-1.5 flex-1 pt-0.5">
                    <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Timeline item ────────────────────────────────────────────────────────────

function HistoryItem({ item }: { item: QuotationHistoryRaw }) {
  const conf = ACTION_CONFIG[item.action_type] ?? FALLBACK_CONF
  const Icon = conf.icon
  const time = format(new Date(item.created_at), "HH:mm")

  return (
    <div className="relative pb-6 pl-8 last:pb-0">
      <div className="absolute left-px top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />

      <div className="flex items-start gap-3">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", conf.iconClass)}>
          <Icon className="size-3.5" />
        </div>

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            {item.user ? (
              <>
                <Avatar className="size-5 shrink-0">
                  <AvatarImage src={item.user.avatar_url ?? "https://github.com/shadcn.png"} alt={item.user.name} />
                  <AvatarFallback className="text-[8px] font-semibold">{getInitials(item.user.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium leading-none">{item.user.name}</span>
              </>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">Sistema</span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{item.description}</p>

          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3" />
              <span>{time}</span>
            </div>
            <Badge className={cn("rounded-full border-0 px-2 py-0 text-xs", conf.badgeClass)} variant="secondary">
              {conf.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Inner content ────────────────────────────────────────────────────────────

function HistoryContent({ quotationId }: { quotationId: number }) {
  const [items, setItems]         = React.useState<QuotationHistoryRaw[]>([])
  const [total, setTotal]         = React.useState(0)
  const [loading, setLoading]     = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [offset, setOffset]       = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setItems([])
    setOffset(0)

    const t0 = performance.now()
    quotationHistoryService
      .getByQuotation(quotationId, { limit: LIMIT, offset: 0 })
      .then((res) => {
        if (cancelled) return
        console.log(`[quotation-history] → ${(performance.now() - t0).toFixed(0)}ms (${res.history.length}/${res.total})`)
        setItems(res.history)
        setTotal(res.total)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [quotationId])

  function loadMore() {
    const nextOffset = offset + LIMIT
    setLoadingMore(true)
    quotationHistoryService
      .getByQuotation(quotationId, { limit: LIMIT, offset: nextOffset })
      .then((res) => {
        setItems((prev) => [...prev, ...res.history])
        setOffset(nextOffset)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  if (loading) return <Skeleton />

  if (!items.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Sin eventos registrados para esta cotización.
      </p>
    )
  }

  const groups  = groupByDay(items)
  const hasMore = items.length < total

  return (
    <div className="space-y-6 p-5">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold">{group.label}</span>
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">{group.items.length} evento(s)</span>
          </div>

          <div className="relative ml-3">
            <div className="absolute bottom-0 left-0 top-3 border-l-2" />
            {group.items.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {loadingMore ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface Props {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  quotationId:    number
  quotationName:  string
}

export function QuotationHistorySheet({ open, onOpenChange, quotationId, quotationName }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 520, padding: 0, gap: 0 }} className="w-full! flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="space-y-0.5">
            <SheetTitle className="flex items-center gap-2">
              <HistoryIcon className="size-4 text-muted-foreground" />
              Historial
            </SheetTitle>
            <SheetDescription className="truncate max-w-[360px]">{quotationName}</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {open && <HistoryContent quotationId={quotationId} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
