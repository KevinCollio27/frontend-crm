"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, TrendingUpIcon } from "lucide-react"
import { STAGES, type DealDetail, type DealStatus, type Priority } from "../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DealStatus, { label: string; className: string }> = {
  open: { label: "Abierta",  className: "bg-blue-50 text-blue-700"       },
  won:  { label: "Ganada",   className: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Perdida",  className: "bg-red-50 text-red-600"         },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  alta:  { label: "Alta",  className: "bg-red-50 text-red-700"         },
  media: { label: "Media", className: "bg-amber-50 text-amber-700"     },
  baja:  { label: "Baja",  className: "bg-emerald-50 text-emerald-700" },
}

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Collapsible defaultOpen className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-3 transition-colors hover:bg-muted/30">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center justify-end">{children}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  deal: DealDetail
}

export function Col1Info({ deal }: Props) {
  const statusConf       = STATUS_CONFIG[deal.status]
  const priorityConf     = PRIORITY_CONFIG[deal.priority]
  const currentIndex     = STAGES.findIndex((s) => s.id === deal.stageId)
  const currentStageName = STAGES[currentIndex]?.name ?? deal.stageId
  const netCost          = deal.products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Identity + Pipeline ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Identidad */}
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <TrendingUpIcon className="size-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{deal.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatCLP(netCost)}&nbsp;·&nbsp;Oportunidad
            </p>
          </div>
        </div>

        {/* Pipeline */}
        <div className="border-t px-3.5 pb-3.5 pt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold">{currentStageName}</span>
            <span className="text-xs text-muted-foreground">
              Etapa {currentIndex + 1} de {STAGES.length}
            </span>
          </div>
          <div className="flex gap-1">
            {STAGES.map((stage, i) => (
              <div key={stage.id} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    i <= currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
                <span
                  className={cn(
                    "truncate text-center text-[9px] leading-none",
                    i === currentIndex ? "font-semibold text-primary" : "text-muted-foreground"
                  )}
                >
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Propiedades del negocio ──────────────────────────────────────── */}
      <CollapsibleSection title="Propiedades del negocio">
        <div className="divide-y">
          <PropRow label="Estado">
            <Badge className={cn("rounded-full border-0 px-2.5 py-0.5 text-xs", statusConf.className)}>
              {statusConf.label}
            </Badge>
          </PropRow>
          <PropRow label="Pipeline">
            <span className="truncate text-sm font-medium">{deal.pipeline}</span>
          </PropRow>
          <PropRow label="Fecha de cierre">
            <span className="text-sm font-medium">
              {deal.closeDate ?? <span className="text-muted-foreground">—</span>}
            </span>
          </PropRow>
          <PropRow label="Propietario">
            <span className="text-sm font-medium">{deal.responsible.name}</span>
          </PropRow>
          <PropRow label="Origen">
            <span className="text-sm font-medium">{deal.origin}</span>
          </PropRow>
          <PropRow label="Prioridad">
            <Badge className={cn("rounded-full border-0 px-2.5 py-0.5 text-xs", priorityConf.className)}>
              {priorityConf.label}
            </Badge>
          </PropRow>
          <PropRow label="Etiquetas">
            <div className="flex flex-wrap justify-end gap-1">
              <Badge className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground">
                Transporte
              </Badge>
              <Badge className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground">
                Refrigerado
              </Badge>
            </div>
          </PropRow>
          <PropRow label="Costo neto">
            <span className="text-sm font-semibold tabular-nums text-emerald-600">
              {formatCLP(netCost)} {deal.currency}
            </span>
          </PropRow>
        </div>
      </CollapsibleSection>

      {/* ── Responsables ─────────────────────────────────────────────────── */}
      <CollapsibleSection title="Responsables">
        <div className="divide-y px-3.5">
          {deal.responsibles.map((r) => (
            <div key={r.name} className="flex items-center gap-3 py-3">
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={r.avatar} alt={r.name} />
                <AvatarFallback className="text-[10px] font-semibold">
                  {r.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {r.isMain ? "Principal" : "Secundario"}
                </span>
              </div>
              {r.isMain && (
                <Badge className="shrink-0 rounded-full border-0 bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                  Principal
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

    </div>
  )
}
