"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ActivityIcon,
  ChevronDownIcon,
  HashIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import type { OrgDetailData } from "@/types/organization"
import { opportunityService } from "@/services/opportunity.service"
import type { OpportunityRaw } from "@/types/opportunity"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data: OrgDetailData
}

export function Col3Related({ data }: Props) {
  const [opps, setOpps] = React.useState<OpportunityRaw[] | null>(null)

  React.useEffect(() => {
    opportunityService
      .list({ organizationId: data.id, take: 100 })
      .then((page) => setOpps(page.data))
      .catch(() => setOpps([]))
  }, [data.id])

  const loading    = opps === null
  const totalValue = opps?.reduce((sum, o) => sum + (o.opportunity_net_sales[0]?.value ?? 0), 0) ?? 0
  const openCount  = opps?.filter((o) => !o.is_won && !o.is_lost).length ?? 0
  const wonCount   = opps?.filter((o) => o.is_won).length ?? 0
  const actCount   = opps?.reduce((sum, o) => sum + o._count.opportunity_activity, 0) ?? 0
  const oppCount   = opps?.length ?? 0

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Resumen ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resumen
          </span>
          {loading ? (
            <>
              <div className="mt-1.5 h-8 w-36 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-28 animate-pulse rounded bg-muted" />
            </>
          ) : (
            <>
              <p className="mt-1.5 text-2xl font-bold tabular-nums">{formatCLP(totalValue)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Valor total · {oppCount} oportunidad{oppCount !== 1 ? "es" : ""}
              </p>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 divide-x border-t">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUpIcon className="size-3.5" />
              <span className="text-base font-bold">{loading ? "—" : openCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Abiertas</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-emerald-600">
              <HashIcon className="size-3.5" />
              <span className="text-base font-bold">{loading ? "—" : wonCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ganadas</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x border-t">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-indigo-600">
              <ActivityIcon className="size-3.5" />
              <span className="text-base font-bold">{loading ? "—" : actCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Actividades</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-violet-600">
              <UsersIcon className="size-3.5" />
              <span className="text-base font-bold">{data.contacts.length}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Contactos</span>
          </div>
        </div>
      </div>

      {/* ── Contactos asociados ──────────────────────────────────────────── */}
      {data.contacts.length > 0 && (
        <Collapsible defaultOpen className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-3 transition-colors hover:bg-muted/30">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contactos ({data.contacts.length})
            </span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y border-t">
              {data.contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage src="https://github.com/shadcn.png" alt={c.name} />
                    <AvatarFallback className="text-[10px] font-semibold">{getInitials(c.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium">{c.name}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

    </div>
  )
}
