export type QuotationType = "sale" | "purchase"

export interface ServiceRow {
  id: string
  values: Record<string, string>
  unitPrice: string
  unit: string
  quantity: string
  discount: string
}

export interface AdditionalItem {
  id: string
  label: string
  unit: string
  quantity: string
  amount: string
}

export interface QuotationFormState {
  type: QuotationType
  name: string
  status: string
  validUntil: string
  currency: string       // ISO code para formateo (ej. "CLP")
  currencyId: number | null
  applyDiscounts: boolean
  productId: number | null
  rows: ServiceRow[]
  additionals: AdditionalItem[]
  globalDiscountType: "percentage" | "fixed"
  globalDiscountValue: string
  comment: string
}

export function createEmptyQuotationForm(): QuotationFormState {
  return {
    type: "sale",
    name: "",
    status: "draft",
    validUntil: "",
    currency: "CLP",
    currencyId: null,
    applyDiscounts: true,
    productId: null,
    rows: [],
    additionals: [],
    globalDiscountType: "percentage",
    globalDiscountValue: "",
    comment: "",
  }
}
