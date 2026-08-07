import type { QuotationFormState, ServiceRow } from "./form-state"
import type { ProductRaw } from "@/types/product"

function rowTotal(row: ServiceRow, applyDiscounts: boolean): number {
  const price = parseInt(row.unitPrice || "0", 10) || 0
  const qty   = parseInt(row.quantity  || "0", 10) || 0
  const gross = price * qty
  if (!applyDiscounts) return gross
  const pct = Math.min(100, Math.max(0, parseInt(row.discount || "0", 10) || 0))
  return gross - gross * (pct / 100)
}

export function buildQuotationPayload(form: QuotationFormState, product: ProductRaw | null) {
  const labels = product?.product_label ?? []

  const quotation_fields = form.rows.flatMap((row, i) =>
    labels.map((label) => ({
      field_key:        label.key,
      field_value:      row.values[label.key] ?? null,
      field_type:       label.type,
      service_index:    i,
      rate:             parseInt(row.unitPrice, 10) || 0,
      quantity:         parseInt(row.quantity,  10) || 1,
      discount:         form.applyDiscounts ? (parseInt(row.discount, 10) || 0) : null,
      final_amount:     rowTotal(row, form.applyDiscounts),
      measurement_unit: row.unit,
    }))
  )

  const subtotal         = form.rows.reduce((s, r) => s + rowTotal(r, form.applyDiscounts), 0)
  const additionalsTotal = form.additionals.reduce((s, a) => {
    return s + (parseInt(a.quantity, 10) || 0) * (parseInt(a.amount, 10) || 0)
  }, 0)
  const globalDiscountAmount = (() => {
    if (!form.applyDiscounts || !form.globalDiscountValue) return 0
    const raw = parseInt(form.globalDiscountValue, 10) || 0
    return form.globalDiscountType === "percentage"
      ? subtotal * (Math.min(100, Math.max(0, raw)) / 100)
      : raw
  })()
  const total = subtotal - globalDiscountAmount + additionalsTotal

  const quotation_additionals = form.additionals.map((a) => {
    const quantity = parseInt(a.quantity, 10) || 0
    const rate     = parseInt(a.amount, 10) || 0
    return {
      service_name:     a.label,
      rate,
      quantity,
      measurement_unit: a.unit,
      amount:           quantity * rate,
    }
  })

  const globalDiscountRaw = form.applyDiscounts && form.globalDiscountValue
    ? (form.globalDiscountType === "percentage"
        ? Math.min(100, parseInt(form.globalDiscountValue, 10) || 0)
        : parseInt(form.globalDiscountValue, 10) || 0)
    : null

  return {
    name:                  form.name.trim(),
    description:           form.comment.trim() || null,
    type:                  form.type,
    status:                form.status,
    valid_until:           form.validUntil || null,
    currency_id:           form.currencyId,
    product_id:            form.productId,
    apply_discounts:       form.applyDiscounts,
    global_discount_type:  form.applyDiscounts ? form.globalDiscountType : null,
    global_discount_value: globalDiscountRaw,
    subtotal,
    discount_amount:       globalDiscountAmount || null,
    additional_amount:     additionalsTotal || null,
    amount:                total,
    quotation_fields,
    quotation_additionals,
  }
}
