"use client"

import * as React from "react"
import { CheckIcon, MailIcon, MousePointerClickIcon, RefreshCwIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { campaignService, type CampaignContactEvent } from "@/services/campaign.service"
import type { CampaignRaw } from "@/types/campaign"

type PreviewTab = "general" | "metricas" | "seguimiento"
type SeguimientoFilter = "todos" | "abrieron" | "click" | "no_abrieron"

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  sent:       { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Enviada" },
  draft:      { dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Borrador" },
  processing: { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Procesando" },
  partial:    { dot: "bg-orange-500",  badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400", label: "Parcial" },
  failed:     { dot: "bg-red-500",     badge: "bg-red-500/10 text-red-600 dark:text-red-400", label: "Fallida" },
}

const audienceLabel: Record<string, string> = {
  all:          "General (todos los contactos)",
  recent:       "Recientes (último mes)",
  specific:     "Selección específica",
  organization: "Por organización",
  custom_list:  "Lista personalizada",
}

const eventIcon: Record<string, React.ReactNode> = {
  delivered:   <CheckIcon className="size-3 text-emerald-500" />,
  open:        <MailIcon className="size-3 text-sky-500" />,
  click:       <MousePointerClickIcon className="size-3 text-violet-500" />,
  bounce:      <XIcon className="size-3 text-red-500" />,
  unsubscribe: <XIcon className="size-3 text-orange-500" />,
  spamreport:  <XIcon className="size-3 text-red-700" />,
}

const eventLabel: Record<string, string> = {
  delivered:   "Entregado",
  open:        "Abrió",
  click:       "Hizo click",
  bounce:      "Rebotó",
  unsubscribe: "Se dio de baja",
  spamreport:  "Spam",
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface CampaignPreviewSheetProps {
  campaignId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResend: (campaign: CampaignRaw) => void
}

export function CampaignPreviewSheet({ campaignId, open, onOpenChange, onResend }: CampaignPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 500, padding: 0, gap: 0 }} className="w-full">
        {open && campaignId != null && (
          <CampaignPreviewBody campaignId={campaignId} onClose={() => onOpenChange(false)} onResend={onResend} />
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Body ─────────────────────────────────────────────────────────────────────

function CampaignPreviewBody({ campaignId, onClose, onResend }: {
  campaignId: number
  onClose: () => void
  onResend: (c: CampaignRaw) => void
}) {
  const [campaign, setCampaign] = React.useState<CampaignRaw | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<PreviewTab>("general")

  React.useEffect(() => {
    setLoading(true)
    campaignService.getById(campaignId).then(setCampaign).finally(() => setLoading(false))
  }, [campaignId])

  if (loading) return <PreviewSkeleton onClose={onClose} />
  if (!campaign) return (
    <div className="flex h-full flex-col">
      <SheetHeader campaign={null} onClose={onClose} tab={tab} onTab={setTab} />
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        No se pudo cargar la campaña.
      </div>
    </div>
  )

  const status = statusConfig[campaign.status]

  return (
    <div className="flex h-full flex-col">
      <SheetHeader campaign={campaign} onClose={onClose} tab={tab} onTab={setTab} status={status} />

      <div className="flex-1 overflow-y-auto">
        {tab === "general"    && <GeneralTab campaign={campaign} />}
        {tab === "metricas"   && <MetricasTab campaign={campaign} />}
        {tab === "seguimiento"&& <SeguimientoTab campaignId={campaignId} />}
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3.5">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose}>Cerrar</Button>
        <Button type="button" onClick={() => { onClose(); onResend(campaign) }}>
          <RefreshCwIcon className="size-4" /> Reenviar
        </Button>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "general",     label: "General"     },
  { id: "metricas",    label: "Métricas"    },
  { id: "seguimiento", label: "Seguimiento" },
]

function SheetHeader({ campaign, onClose, tab, onTab, status }: {
  campaign: CampaignRaw | null
  onClose: () => void
  tab: PreviewTab
  onTab: (t: PreviewTab) => void
  status?: { dot: string; badge: string; label: string }
}) {
  return (
    <div className="border-b p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 pr-4">
          <SheetTitle className="text-base leading-snug">{campaign?.name ?? "Campaña"}</SheetTitle>
          <SheetDescription className="sr-only">Vista previa de la campaña</SheetDescription>
          {status && (
            <div className="pt-1">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", status.badge)}>
                <span className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
          <XIcon />
        </Button>
      </div>
      <div className="flex gap-1 border rounded-lg p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── General tab ──────────────────────────────────────────────────────────────

function GeneralTab({ campaign }: { campaign: CampaignRaw }) {
  return (
    <>
      <section className="border-b p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalles</h3>
        <dl className="space-y-2">
          <InfoRow label="Asunto" value={campaign.subject} />
          <InfoRow label="Audiencia" value={audienceLabel[campaign.audience_filter] ?? campaign.audience_filter} />
          <InfoRow
            label="Enviada"
            value={campaign.sent_at
              ? new Date(campaign.sent_at).toLocaleString("es-CL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "—"}
          />
          <InfoRow label="Creada por" value={campaign.user.name} />
          <InfoRow
            label="Remitente"
            value={
              <span className="inline-flex items-center gap-1">
                <MailIcon className="size-3 shrink-0" />
                GOXT CRM &lt;contacto@mail.goxt.io&gt;
              </span>
            }
          />
        </dl>
      </section>

      <section className="p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contenido</h3>
        {campaign.content ? (
          <div
            className="rounded-lg border bg-white p-4 text-sm leading-relaxed text-zinc-800 overflow-auto max-h-125"
            dangerouslySetInnerHTML={{ __html: campaign.content }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Sin contenido disponible.</p>
        )}
      </section>
    </>
  )
}

// ─── Métricas tab ─────────────────────────────────────────────────────────────

function MetricasTab({ campaign }: { campaign: CampaignRaw }) {
  const total    = campaign.total_count || campaign.sent_count
  const sent     = campaign.sent_count
  const delivered= campaign.delivered_count
  const opened   = campaign.opened_count
  const clicked  = campaign.clicked_count

  const pct = (n: number, base: number) => base > 0 ? Math.round((n / base) * 100) : 0

  const stats = [
    { label: "Enviados",          value: sent,      sub: `de ${total.toLocaleString()} totales`,  color: "text-foreground" },
    { label: "Entregados",        value: delivered,  sub: `${pct(delivered, sent)}% tasa entrega`, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Tasa de apertura",  value: `${pct(opened, delivered)}%`,   sub: `${opened.toLocaleString()} abrieron`,  color: "text-sky-600 dark:text-sky-400" },
    { label: "Tasa de click",     value: `${pct(clicked, opened)}%`,     sub: `${clicked.toLocaleString()} hicieron click`, color: "text-violet-600 dark:text-violet-400" },
  ]

  const funnel = [
    { label: "Enviados",    value: sent,      color: "bg-primary",      pct: pct(sent, sent) },
    { label: "Entregados",  value: delivered, color: "bg-emerald-500",  pct: pct(delivered, sent) },
    { label: "Abiertos",    value: opened,    color: "bg-sky-500",      pct: pct(opened, sent) },
    { label: "Clicks",      value: clicked,   color: "bg-violet-500",   pct: pct(clicked, sent) },
  ]

  if (total === 0) return (
    <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-sm font-medium">Sin métricas disponibles</p>
      <p className="text-xs text-muted-foreground">Las métricas aparecen una vez enviada la campaña.</p>
    </div>
  )

  return (
    <div className="p-5 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold tabular-nums", s.color)}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Embudo</h3>
        <div className="space-y-2">
          {funnel.map((f) => (
            <div key={f.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-medium tabular-nums">
                  {f.value.toLocaleString()} <span className="text-muted-foreground">({f.pct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", f.color)} style={{ width: `${f.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Seguimiento tab ──────────────────────────────────────────────────────────

const filterLabels: { id: SeguimientoFilter; label: string }[] = [
  { id: "todos",        label: "Todos"         },
  { id: "abrieron",     label: "Abrieron"      },
  { id: "click",        label: "Hicieron click" },
  { id: "no_abrieron",  label: "No abrieron"   },
]

function SeguimientoTab({ campaignId }: { campaignId: number }) {
  const [contacts, setContacts] = React.useState<CampaignContactEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<SeguimientoFilter>("todos")

  React.useEffect(() => {
    setLoading(true)
    campaignService.getEvents(campaignId).then(setContacts).finally(() => setLoading(false))
  }, [campaignId])

  const filtered = React.useMemo(() => {
    switch (filter) {
      case "abrieron":    return contacts.filter((c) => c.events.includes("open"))
      case "click":       return contacts.filter((c) => c.events.includes("click"))
      case "no_abrieron": return contacts.filter((c) => c.events.includes("delivered") && !c.events.includes("open"))
      default:            return contacts
    }
  }, [contacts, filter])

  if (loading) return (
    <div className="p-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-8 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col">
      {/* Filtros */}
      <div className="flex gap-1 border-b px-5 py-3 overflow-x-auto">
        {filterLabels.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              filter === f.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto shrink-0 self-center text-xs text-muted-foreground tabular-nums">
          {filtered.length}
        </span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <MailIcon className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {contacts.length === 0 ? "Sin datos de seguimiento aún" : "Sin resultados para este filtro"}
          </p>
          <p className="text-xs text-muted-foreground">
            {contacts.length === 0
              ? "Los eventos aparecerán aquí una vez que SendGrid los reporte."
              : "Prueba con otro filtro."}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {filtered.map((c) => (
            <div key={c.email} className="flex items-start gap-3 px-5 py-3">
              <img
                src="https://github.com/shadcn.png"
                alt={c.email}
                className="size-8 shrink-0 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{c.email}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.last_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {c.events.map((ev) => (
                  <span
                    key={ev}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                    title={eventLabel[ev] ?? ev}
                  >
                    {eventIcon[ev] ?? null}
                    {eventLabel[ev] ?? ev}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function PreviewSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader campaign={null} onClose={onClose} tab="general" onTab={() => {}} />
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr] gap-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-60 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t px-5 py-3.5">
        <div className="h-9 w-20 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
