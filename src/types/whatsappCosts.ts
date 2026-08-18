export interface WhatsappCostBreakdownRaw {
  conversations: number
  cost: number
}

export interface WhatsappCostCategoryRaw extends WhatsappCostBreakdownRaw {
  category: string
}

export interface WhatsappCostDayRaw extends WhatsappCostBreakdownRaw {
  date: string
}

export interface WhatsappCostAnalyticsRaw {
  currency: string
  from: string
  to: string
  totals: WhatsappCostBreakdownRaw
  byCategory: WhatsappCostCategoryRaw[]
  byDay: WhatsappCostDayRaw[]
}
