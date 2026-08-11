"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { opportunityService } from "@/services/opportunity.service"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { OpportunityDetailData } from "@/types/opportunity"
import { FunnelDetail } from "./FunnelDetail"
import { prefetchHistorial } from "./detail/tabs/HistorialTab"

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />
}

function LoadingSkeleton() {
  return (
    <>
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 gap-3">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="size-7 rounded-md" />
          <div className="h-4 w-px bg-border mx-1" />
          <SkeletonBlock className="size-7 rounded-md" />
          <SkeletonBlock className="h-4 w-52 rounded-md" />
        </div>
        <SkeletonBlock className="h-7 w-24 rounded-md" />
      </header>

      {/* 3 columns */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex w-[25%] shrink-0 flex-col gap-4 overflow-y-auto border-r p-4 [scrollbar-width:none]">
          <SkeletonBlock className="h-28 rounded-xl" />
          <SkeletonBlock className="h-52 rounded-xl" />
          <SkeletonBlock className="h-32 rounded-xl" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r">
          <SkeletonBlock className="h-12 rounded-none" />
          <div className="flex-1 p-4 flex flex-col gap-3">
            <SkeletonBlock className="h-6 w-1/3" />
            <SkeletonBlock className="h-20" />
            <SkeletonBlock className="h-20" />
          </div>
        </div>
        <div className="flex w-[25%] shrink-0 flex-col gap-4 overflow-y-auto p-4 [scrollbar-width:none]">
          <SkeletonBlock className="h-32 rounded-xl" />
          <SkeletonBlock className="h-40 rounded-xl" />
          <SkeletonBlock className="h-40 rounded-xl" />
        </div>
      </div>
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OpportunityDetail({ id }: { id: number }) {
  const router = useRouter()
  const [data, setData]       = React.useState<OpportunityDetailData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Tiempo real, nivel 2: alguien más edita/elimina ESTA oportunidad mientras la
  // estás viendo. Filtra por id — si la borraron, te saca de la página en vez de
  // dejarte viendo un detalle fantasma.
  useEntityRealtime("opportunity", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (changedId !== id) return
    if (payload.action === "deleted") {
      router.push("/crm/funnels")
      return
    }
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t0 = performance.now()
    const ms = () => `${(performance.now() - t0).toFixed(0)}ms`

    prefetchHistorial(id)

    opportunityService.getById(id)
      .then((raw) => {
        if (cancelled) return
        console.log(`[detail] getById → ${ms()}`)

        const flow        = raw.flow ?? null
        const stages      = (flow?.flow_stage ?? []).slice()
        const netCostItem = raw.opportunity_net_cost[0] ?? null
        const mainResp    = raw.opportunity_responsible.find((r) => r.is_main)

        const priorityDetail = raw.opportunity_detail.find((d) => d.label?.key === "priority")
        const originDetail   = raw.opportunity_detail.find((d) => d.label?.key === "origin")

        const person_email = raw.person?.person_detail?.find((d) => d.label?.key === "email")?.value ?? null
        const person_phone = raw.person?.person_detail?.find((d) => d.label?.key === "phone")?.value ?? null

        console.log(`[detail] setData  → ${ms()} ← total`)

        setData({
          id:                    raw.id,
          name:                  raw.name,
          description:           raw.description,
          is_won:                raw.is_won,
          is_lost:               raw.is_lost,
          flow:                  flow ? { id: flow.id, name: flow.name } : null,
          stages:                stages.map((s) => ({ id: s.id, name: s.name, order_number: s.order_number })),
          flow_stage_id:         raw.flow_stage_id,
          planned_clousure_date: raw.planned_clousure_date,
          created_at:            raw.created_at,
          owner:                 mainResp?.users ?? null,
          responsibles:          raw.opportunity_responsible.map((r) => ({
            id:        r.id,
            is_main:   r.is_main,
            name:      r.users?.name ?? "Sin nombre",
            avatarUrl: r.users?.avatar_url ?? null,
          })),
          netCost:         netCostItem?.value ?? 0,
          currency:        netCostItem?.currency?.symbol ?? "CLP",
          person:          raw.person,
          person_id:       raw.person_id,
          organization:    raw.organization,
          organization_id: raw.organization_id,
          priority:        (priorityDetail?.value as "alta" | "media" | "baja" | undefined) ?? null,
          origin:          originDetail?.value ?? null,
          person_email,
          person_phone,
        })
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id, refreshKey])

  function handleStatusChange(updates: { is_won: boolean; is_lost: boolean }) {
    setData((prev) => prev ? { ...prev, ...updates } : prev)
  }

  if (loading || !data) return <LoadingSkeleton />
  return <FunnelDetail data={data} onStatusChange={handleStatusChange} />
}
