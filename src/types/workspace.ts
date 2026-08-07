export interface WorkspaceCurrency {
  id: number
  currency_id: number
  is_main: boolean
  currency: {
    id: number
    name: string
    symbol: string
  }
}

export interface Workspace {
  id: number
  name: string
  country_id: string
  timezone: string
  logo: string | null
  // Información Empresarial
  legal_name: string | null
  trade_name: string | null
  tax_id: string | null
  industry: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string | null
  company_website: string | null
  // Contexto IA
  objective: string | null
  business_description: string | null
  // Moneda
  workspace_currency: WorkspaceCurrency[]
  // API
  api_token: string | null
  flow_id: number | null
}
