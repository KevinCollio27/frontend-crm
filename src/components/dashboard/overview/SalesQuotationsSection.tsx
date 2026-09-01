"use client"

import * as React from "react"
import { flowService } from "@/services/flow.service"
import { salesService } from "@/services/sales.service"
import type { Flow } from "@/types/flow"
import type { SalesQuotationsStats } from "@/types/sales"
import { QuotationsEvolutionChart } from "./QuotationsEvolutionChart"
import { SalesQuotationsKpis } from "./SalesQuotationsKpis"

// Dueño del estado compartido (embudo elegido + stats) entre el KPI row y el chart de
// Cotizaciones por Mes — un solo fetch, un solo selector. Mismo patrón que
// SalesOpportunitiesSection usa para Oportunidades.
export function SalesQuotationsSection() {
  const [flows, setFlows] = React.useState<Flow[]>([])
  const [flowId, setFlowId] = React.useState<number | null>(null)
  const [stats, setStats] = React.useState<SalesQuotationsStats | null>(null)
  // loading se deriva comparando contra el embudo ya resuelto — evita un setState síncrono
  // al inicio del efecto (mismo criterio que SalesOpportunitiesSection/FunnelOverviewSection).
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
    salesService.getQuotationsStats({ flowId })
      .then((res) => {
        if (cancelled) return
        setStats(res)
        setResolvedFlowId(flowId)
      })
      .catch(() => {
        if (cancelled) return
        setStats(null)
        setResolvedFlowId(flowId)
      })
    return () => { cancelled = true }
  }, [flowId])

  return (
    <div className="flex flex-col gap-4">
      <SalesQuotationsKpis
        pendingValue={stats?.pendingValue ?? null}
        totalSales={stats?.totalSales ?? null}
        avgDealValue={stats?.avgDealValue ?? null}
        deals={stats?.deals ?? null}
        loading={loading}
      />
      <QuotationsEvolutionChart
        flows={flows}
        flowId={flowId}
        onFlowIdChange={setFlowId}
        data={stats?.quotationsMonthly ?? []}
        loading={loading}
      />
    </div>
  )
}
