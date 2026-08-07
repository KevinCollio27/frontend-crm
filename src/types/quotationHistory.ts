export interface QuotationHistoryRaw {
  id:           number
  quotation_id: number
  user_id:      number | null
  action_type:  string
  title:        string
  description:  string
  metadata:     Record<string, unknown>
  created_at:   string
  user?: {
    id:    number
    name:  string
    email: string
  }
}

export interface QuotationHistoryPage {
  history: QuotationHistoryRaw[]
  total:   number
}
