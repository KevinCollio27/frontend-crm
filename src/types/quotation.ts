export interface QuotationFieldRaw {
  id:               number
  field_key:        string
  field_value:      string | null
  field_type:       string | null
  service_index:    number
  rate:             number | null
  quantity:         number
  discount:         number | null
  final_amount:     number | null
  measurement_unit: string
  created_at:       string
  updated_at:       string
}

export interface QuotationAdditionalRaw {
  id:               number
  service_name:     string
  amount:           number
  rate:             number | null
  quantity:         number
  measurement_unit: string
  created_at:       string
  updated_at:       string
}

export interface QuotationRaw {
  id:                   number
  opportunity_id:       number
  name:                 string
  description:          string | null
  amount:               number
  status:               string
  type:                 string
  valid_until:          string | null
  created_at:           string
  apply_discounts:      boolean
  global_discount_type:  string | null
  global_discount_value: number | null
  subtotal:             number | null
  discount_amount:      number | null
  additional_amount:    number | null
  sku:                  string | null
  is_sent_to_cargo:     boolean
  pdf_template_id:      number | null
  currency:             { id: number; name: string; symbol: string } | null
  created_user:         { id: number; name: string; email: string; avatar_url: string | null } | null
  product:              { id: number; name: string; product_label: { key: string; name: string; type: string; order_number: number }[] } | null
  quotation_fields:     QuotationFieldRaw[]
  quotation_additionals: QuotationAdditionalRaw[]
  opportunity:          { id: number; name: string; default_pdf_template_id: number | null } | null
}
