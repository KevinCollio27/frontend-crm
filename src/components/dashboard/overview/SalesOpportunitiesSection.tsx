"use client"

import * as React from "react"
import { dashboardService } from "@/services/dashboard.service"
import { flowService } from "@/services/flow.service"
import { salesService } from "@/services/sales.service"
import type { Flow } from "@/types/flow"
import type { DashboardPipelineValue } from "@/types/dashboard"
import type { SalesOpportunitiesStats } from "@/types/sales"
import { NewOpportunitiesChart } from "./NewOpportunitiesChart"
import { SalesOpportunitiesKpis } from "./SalesOpportunitiesKpis"

// Dueño del estado compartido (embudo elegido + stats) entre el KPI row y el chart de
// Nuevas Oportunidades — un solo fetch, un solo selector, mismo patrón que
// FunnelOverviewSection usa en General para FunnelPipelineChart/FunnelTotalsCard.
export function SalesOpportunitiesSection() {
  const [flows, setFlows] = React.useState<Flow[]>([])
  const [flowId, setFlowId] = React.useState<number | null>(null)
  const [pipeline, setPipeline] = React.useState<DashboardPipelineValue | null>(null)
  const [salesStats, setSalesStats] = React.useState<SalesOpportunitiesStats | null>(null)
  // loading se deriva comparando contra el embudo ya resuelto — evita un setState síncrono
  // al inicio del efecto (ver FunnelOverviewSection: mismo patrón, mismo problema de lint).
  const [resolvedFlowId, setResolvedFlowId] = React.useState<number | null>(null)
  const loading = flowId === null || flowId !== resolvedFlowId

  React.useEffect(() => {
    flowService.all()
      .then((all) => {
        const active = all.filter((f) => f.is_active)
        setFlows(active)
        const initial = active.find((f) => f.is_default) ?? active[0]
        if (initial) setFlowId(initial.id)
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    if (flowId === null) return
    let cancelled = false
    Promise.all([dashboardService.getStats({ flowId }), salesService.getOpportunitiesStats({ flowId })])
      .then(([dashboardStats, sales]) => {
        if (cancelled) return
        setPipeline(dashboardStats.pipelineValue)
        setSalesStats(sales)
        setResolvedFlowId(flowId)
      })
      .catch(() => {
        if (cancelled) return
        setPipeline(null)
        setSalesStats(null)
        setResolvedFlowId(flowId)
      })
    return () => { cancelled = true }
  }, [flowId])

  return (
    <div className="flex flex-col gap-4">
      <SalesOpportunitiesKpis
        pipeline={pipeline ? { value: pipeline.totalFormatted, description: "Oportunidades vigentes", trend: pipeline.trend } : null}
        totalSales={salesStats?.totalSales ?? null}
        avgDealValue={salesStats?.avgDealValue ?? null}
        conversionRate={salesStats?.conversionRate ?? null}
        loading={loading}
      />
      <NewOpportunitiesChart
        flows={flows}
        flowId={flowId}
        onFlowIdChange={setFlowId}
        data={salesStats?.newOpportunitiesMonthly ?? []}
        loading={loading}
      />
    </div>
  )
}
