"use client"

import { TrendingUpIcon } from "lucide-react"
import type { Flow } from "@/types/flow"
import type { SalesOpportunitiesStats } from "@/types/sales"
import { MonthlyBarChart } from "./MonthlyBarChart"

// Mide oportunidades NUEVAS (creadas), no ganadas — "ganadas por mes" queda muy flaco en la
// data real (validado con MCP), "nuevas por mes" tiene movimiento todos los meses. Wrapper
// fino sobre MonthlyBarChart (compartido con QuotationsEvolutionChart) — ver ese archivo
// para el detalle del chart y el modo "cantidad".
interface Props {
  flows: Flow[]
  flowId: number | null
  onFlowIdChange: (id: number) => void
  data: SalesOpportunitiesStats["newOpportunitiesMonthly"]
  loading: boolean
}

export function NewOpportunitiesChart(props: Props) {
  return (
    <MonthlyBarChart
      icon={TrendingUpIcon}
      kicker="Pipeline Generado"
      title="Nuevas Oportunidades por Mes"
      itemNamePlural="oportunidades"
      {...props}
    />
  )
}
