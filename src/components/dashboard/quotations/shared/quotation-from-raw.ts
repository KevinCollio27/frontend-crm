import type { QuotationRaw } from "@/types/quotation"
import type { QuotationFormState, QuotationType, ServiceRow, AdditionalItem } from "./form-state"
import { resolveFieldKey } from "./resolve-field-key"
import { normalizeUnit } from "./units"

export function rawToForm(q: QuotationRaw): QuotationFormState {
  // ─── Rows: agrupar quotation_fields por service_index ─────────────────────
  const byIndex: Record<number, ServiceRow> = {}
  const labels = q.product?.product_label ?? []

  for (const field of q.quotation_fields ?? []) {
    const idx = field.service_index ?? 0

    if (!byIndex[idx]) {
      byIndex[idx] = {
        id:        crypto.randomUUID(),
        values:    {},
        unitPrice: "",
        unit:      "unidad",
        quantity:  "1",
        discount:  "0",
      }
    }

    byIndex[idx].values[resolveFieldKey(field.field_key, labels)] = field.field_value ?? ""

    if (field.rate     != null) byIndex[idx].unitPrice = String(Math.round(field.rate))
    if (field.quantity != null) byIndex[idx].quantity  = String(field.quantity)
    if (field.discount != null) byIndex[idx].discount  = String(field.discount)
    if (field.measurement_unit) {
      byIndex[idx].unit = normalizeUnit(field.measurement_unit)
    }
  }

  const rows: ServiceRow[] = Object.keys(byIndex)
    .map(Number)
    .sort((a, b) => a - b)
    .map((idx) => byIndex[idx])

  // ─── Additionals ──────────────────────────────────────────────────────────
  // rate/quantity/measurement_unit no existían antes de esta migración — los
  // adicionales creados antes no tienen esos campos guardados (vienen null),
  // así que se tratan como cantidad 1 al precio total, igual que se mostraban
  // antes (mismo comportamiento previo, sin romper cotizaciones viejas).
  const additionals: AdditionalItem[] = (q.quotation_additionals ?? []).map((a) => ({
    id:       crypto.randomUUID(),
    label:    a.service_name,
    unit:     a.measurement_unit ? normalizeUnit(a.measurement_unit) : "unidad",
    quantity: a.quantity != null ? String(a.quantity) : "1",
    amount:   String(Math.round(a.rate ?? a.amount)),
  }))

  // ─── Global discount ──────────────────────────────────────────────────────
  const globalDiscountType  = (q.global_discount_type as "percentage" | "fixed") ?? "percentage"
  const globalDiscountValue = q.global_discount_value != null ? String(q.global_discount_value) : ""

  return {
    type:               (q.type as QuotationType) ?? "sale",
    name:               q.name ?? "",
    status:             q.status ?? "draft",
    validUntil:         q.valid_until ? q.valid_until.slice(0, 10) : "",
    currency:           q.currency?.symbol ?? "CLP",
    currencyId:         q.currency?.id ?? null,
    applyDiscounts:     q.apply_discounts ?? true,
    productId:          q.product?.id ?? null,
    rows,
    additionals,
    globalDiscountType,
    globalDiscountValue,
    comment:            q.description ?? "",
  }
}
