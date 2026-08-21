// "Nice-ify" para las categorías legacy en minúscula — el resto de los valores
// reales en la base ("Contrato / Acuerdo", "Propuesta Comercial", "legal", etc.)
// ya vienen con su propio texto y se muestran tal cual, sin pasar por acá.
export const CATEGORY_LABEL: Record<string, string> = {
  contrato:     "Contrato",
  factura:      "Factura",
  presentacion: "Presentación",
  manual:       "Manual",
  otro:         "Otro",
}
