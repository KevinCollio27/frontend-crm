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
import type { OpportunityDetailData } from "@/types/opportunity"
import { PRIORITY_CONFIG, STATUS_CONFIG } from "../shared/status"

function formatCurrency(value: number, symbol: string) {
  const formatted = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
  return symbol === "CLP" ? formatted : `${symbol} ${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(value)}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
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
  data: OpportunityDetailData
}

export function Col1Info({ data }: Props) {
  const statusKey    = data.is_won ? "won" : data.is_lost ? "lost" : "open"
  const statusConf   = STATUS_CONFIG[statusKey]
  const priorityConf = data.priority ? PRIORITY_CONFIG[data.priority] : null

  const currentIndex     = data.stages.findIndex((s) => s.id === data.flow_stage_id)
  const currentStageName = data.stages[currentIndex]?.name ?? "—"

  const formattedCost  = formatCurrency(data.netCost, data.currency)
  const formattedClose = data.planned_clousure_date
    ? new Date(data.planned_clousure_date).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : null

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Identity + Pipeline ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Identidad */}
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
            <TrendingUpIcon className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{data.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formattedCost}&nbsp;·&nbsp;Oportunidad
            </p>
          </div>
        </div>

        {/* Pipeline */}
        <div className="border-t px-3.5 pb-3.5 pt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold">{currentStageName || "—"}</span>
            {data.stages.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Etapa {currentIndex + 1} de {data.stages.length}
              </span>
            )}
          </div>
          {data.stages.length > 0 ? (
            <div className="flex gap-1">
              {data.stages.map((stage, i) => (
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
          ) : (
            <p className="text-xs text-muted-foreground">Sin etapas configuradas</p>
          )}
        </div>
      </div>

      {/* ── Descripción ──────────────────────────────────────────────────── */}
      {data.description && (
        <CollapsibleSection title="Descripción">
          <p className="px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
            {data.description}
          </p>
        </CollapsibleSection>
      )}

      {/* ── Propiedades del negocio ──────────────────────────────────────── */}
      <CollapsibleSection title="Propiedades del negocio">
        <div className="divide-y">
          <PropRow label="Estado">
            <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs", statusConf.badge)}>
              {statusConf.label}
            </Badge>
          </PropRow>
          <PropRow label="Pipeline">
            <span className="truncate text-sm font-medium">{data.flow?.name ?? "—"}</span>
          </PropRow>
          <PropRow label="Fecha de cierre">
            <span className="text-sm font-medium">
              {formattedClose ?? <span className="text-muted-foreground">—</span>}
            </span>
          </PropRow>
          <PropRow label="Propietario">
            <span className="text-sm font-medium">{data.owner?.name ?? "—"}</span>
          </PropRow>
          {data.origin && (
            <PropRow label="Origen">
              <span className="text-sm font-medium">{data.origin}</span>
            </PropRow>
          )}
          {priorityConf && (
            <PropRow label="Prioridad">
              <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs", priorityConf.badge)}>
                {priorityConf.label}
              </Badge>
            </PropRow>
          )}
          <PropRow label="Costo neto">
            <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formattedCost}
            </span>
          </PropRow>
        </div>
      </CollapsibleSection>

      {/* ── Responsables ─────────────────────────────────────────────────── */}
      <CollapsibleSection title="Responsables">
        <div className="divide-y px-3.5">
          {data.responsibles.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">Sin responsables asignados.</p>
          ) : (
            data.responsibles.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <Avatar className="default shrink-0">
                  <AvatarImage src={r.avatarUrl ?? "https://github.com/shadcn.png"} alt={r.name} />
                  <AvatarFallback className="text-sm font-semibold"></AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.is_main ? "Principal" : "Secundario"}
                  </span>
                </div>
                {r.is_main && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300"
                  >
                    Principal
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

    </div>
  )
}
