export interface CurrencyRaw {
  id: number
  name: string
  code: string  // ISO code, e.g. "CLP" — from DB "symbol" field
}
