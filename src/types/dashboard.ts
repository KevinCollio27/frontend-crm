export type DashboardTrendState = "up" | "down" | "flat"

export interface DashboardKpi {
  value: string
  description: string
  trend: { value: string; state: DashboardTrendState }
}

export interface DashboardPipelineValue {
  total: number
  totalFormatted: string
  trend: { value: string; state: DashboardTrendState }
  topOpportunities: { name: string; value: number; percent: number }[]
}

export interface DashboardStatsRaw {
  pipelineValue: DashboardPipelineValue
  kpis: {
    openOpportunities: DashboardKpi
    wonOpportunities: DashboardKpi
    lostOpportunities: DashboardKpi
    totalContacts: DashboardKpi
    totalOrganizations: DashboardKpi
    totalQuotations: DashboardKpi
    totalActivities: DashboardKpi
  }
  newOpportunitiesWeekly: { week: string; count: number }[]
  pipelineByStage: { stage: string; abiertas: number; ganadas: number; perdidas: number }[]
}
