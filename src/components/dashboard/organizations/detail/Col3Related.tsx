"use client"

import { ActivityIcon, HashIcon, TrendingUpIcon, UsersIcon } from "lucide-react"
import type { OrganizationDetail } from "../data"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  organization: OrganizationDetail
}

export function Col3Related({ organization }: Props) {
  const totalValue = organization.opportunities.reduce((sum, o) => sum + o.value, 0)
  const openCount  = organization.opportunities.filter((o) => o.status === "open").length
  const wonCount   = organization.opportunities.filter((o) => o.status === "won").length

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Resumen ───────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resumen
          </span>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{formatCLP(totalValue)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Valor total · {organization.opportunities.length} oportunidad{organization.opportunities.length !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x border-t">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUpIcon className="size-3.5" />
              <span className="text-base font-bold">{openCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Abiertas</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-emerald-600">
              <HashIcon className="size-3.5" />
              <span className="text-base font-bold">{wonCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ganadas</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x border-t">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-indigo-600">
              <ActivityIcon className="size-3.5" />
              <span className="text-base font-bold">{organization.activities.length}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Actividades</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-violet-600">
              <UsersIcon className="size-3.5" />
              <span className="text-base font-bold">{organization.contacts.length}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Contactos</span>
          </div>
        </div>
      </div>

    </div>
  )
}
