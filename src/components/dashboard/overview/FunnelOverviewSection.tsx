"use client"

import * as React from "react"
import { dashboardService } from "@/services/dashboard.service"
import { flowService } from "@/services/flow.service"
import type { Flow } from "@/types/flow"
import type { DashboardStatsRaw } from "@/types/dashboard"
import { FunnelPipelineChart } from "./FunnelPipelineChart"
import { FunnelTotalsCard } from "./FunnelTotalsCard"

// Dueño del estado compartido (embudo elegido + pipelineByStage) entre las dos cards de
// embudo — un solo fetch, un solo selector (vive en FunnelPipelineChart), ambas cards
// se actualizan juntas al cambiar de embudo.
export function FunnelOverviewSection() {
  const [flows, setFlows] = React.useState<Flow[]>([])
  const [flowId, setFlowId] = React.useState<number | null>(null)
  const [stats, setStats] = React.useState<DashboardStatsRaw | null>(null)
  // loading se deriva comparando contra el embudo ya resuelto — evita un setState síncrono
  // al inicio del efecto (react-hooks/set-state-in-effect).
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
    dashboardService.getStats({ flowId })
      .then((res) => { if (cancelled) return; setStats(res); setResolvedFlowId(flowId) })
      .catch(() => { if (cancelled) return; setStats(null); setResolvedFlowId(flowId) })
    return () => { cancelled = true }
  }, [flowId])

  const stages = stats?.pipelineByStage ?? []
  const flowName = flows.find((f) => f.id === flowId)?.name ?? "—"

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <FunnelPipelineChart
        flows={flows}
        flowId={flowId}
        onFlowIdChange={setFlowId}
        flowName={flowName}
        stages={stages}
        loading={loading}
      />
      <FunnelTotalsCard flowName={flowName} stages={stages} loading={loading} />
    </div>
  )
}
