// Fuente única para el Estado de una cotización — QuotationsTable.tsx y
// QuotationPreviewSheet.tsx antes tenían cada uno su propia copia (y ninguna
// tenía variante dark:, por eso se veía mal en modo oscuro).
export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:     { label: "Borrador",  className: "bg-muted text-muted-foreground border-border" },
  sent:      { label: "Enviada",   className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300" },
  accepted:  { label: "Aceptada",  className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300" },
  rejected:  { label: "Rechazada", className: "border-red-200 bg-red-50 text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300" },
  borrador:  { label: "Borrador",  className: "bg-muted text-muted-foreground border-border" },
  enviada:   { label: "Enviada",   className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300" },
  aceptada:  { label: "Aceptada",  className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300" },
  rechazada: { label: "Rechazada", className: "border-red-200 bg-red-50 text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300" },
}
