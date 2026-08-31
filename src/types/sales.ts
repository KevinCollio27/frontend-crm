export type SalesTrendState = "up" | "down" | "flat"

export interface SalesKpi {
  value: string
  description: string
  // Ausente en "all_time" (sin periodo anterior con el que comparar) — ver resolveDateRange en backend
  trend?: { value: string; state: SalesTrendState }
}

export interface SalesOpportunitiesStats {
  totalSales: SalesKpi
  deals: SalesKpi
  avgDealValue: SalesKpi
  conversionRate: SalesKpi
  evolution: { month: string; monto: number; negocios: number }[]
  monthlyAvgTicket: { month: string; value: number }[]
  overallAvgTicket: number
  newOpportunitiesMonthly: { month: string; count: number; monto: number }[]
  topExecutives: { executive: string; monto: number; negocios: number }[]
  salesByOrigin: { origin: string; monto: number; fill: string }[]
}

export interface SalesQuotationsStats {
  totalSales: SalesKpi
  deals: SalesKpi
  avgDealValue: SalesKpi
  pendingValue: SalesKpi
  evolution: { month: string; monto: number; negocios: number }[]
  monthlyAvgTicket: { month: string; value: number }[]
  overallAvgTicket: number
  quotationsMonthly: { month: string; count: number; monto: number }[]
  topExecutives: { executive: string; monto: number; negocios: number }[]
  quotationsByStatus: { status: string; count: number; fill: string }[]
}
