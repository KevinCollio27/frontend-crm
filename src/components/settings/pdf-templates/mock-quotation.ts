// Cotización de ejemplo para renderizar la vista previa de una plantilla PDF sin
// depender de una cotización real. Misma forma que espera QuotationPDF (quotation
// prop) y resolveTemplateVariables (src/lib/htmlToBlocks.ts).
export const MOCK_QUOTATION = {
  id: 163,
  name: "Vista Previa",
  amount: 8_400_000,
  subtotal: 8_400_000,
  apply_discounts: false,
  global_discount_value: 0,
  global_discount_type: null,
  discount_amount: 0,
  description: null,
  valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  currency: { symbol: "CLP" },
  created_user: { name: "Kevin Vendedor" },
  opportunity: {
    person: {
      name: "María González",
      person_detail: [
        { value: "maria.gonzalez@empresa.cl" },
        { value: "+56 9 1234 5678" },
      ],
      organization: {
        id: 1,
        name: "Empresa Ejemplo S.A.",
        document_number: "76.543.210-K",
        organization_detail: [
          { value: "Av. Providencia 1234, Of. 501, Santiago" },
        ],
      },
    },
    workspace: null,
  },
  quotation_fields: [
    {
      field_key:        "Servicio",
      field_value:       "Transporte de Carga",
      rate:              1_200_000,
      quantity:          7,
      discount:          0,
      service_index:     0,
      measurement_unit: "Diario",
    },
  ],
  quotation_additionals: [],
  product: {
    product_label: [
      { key: "Servicio", name: "Servicio", order_number: 0, is_conditional: false, type: "text" },
    ],
  },
}
