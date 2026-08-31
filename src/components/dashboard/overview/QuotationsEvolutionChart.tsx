"use client"

import { FileTextIcon } from "lucide-react"
import type { Flow } from "@/types/flow"
import type { SalesQuotationsStats } from "@/types/sales"
import { MonthlyBarChart } from "./MonthlyBarChart"

// Mide cotizaciones EMITIDAS (cualquier estado: draft/sent/accepted), no solo aceptadas —
// mismo criterio que NewOpportunitiesChart: validado con MCP, emitidas es igual o más denso
// que aceptadas (en GOXT, 5 meses con emitidas vs. 2 con aceptadas). Wrapper fino sobre
// MonthlyBarChart — ver ese archivo para el detalle del chart y el modo "cantidad".
interface Props {
  flows: Flow[]
  flowId: number | null
  onFlowIdChange: (id: number) => void
  data: SalesQuotationsStats["quotationsMonthly"]
  loading: boolean
}

export function QuotationsEvolutionChart(props: Props) {
  return (
    <MonthlyBarChart
      icon={FileTextIcon}
      kicker="Cotizaciones Emitidas"
      title="Cotizaciones por Mes"
      itemNamePlural="cotizaciones"
      {...props}
    />
  )
}
