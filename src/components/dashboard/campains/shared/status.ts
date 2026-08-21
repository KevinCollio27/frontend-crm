// Fuente única para el Estado de una campaña — antes CampaignsTable.tsx (Email)
// tenía la versión buena (bg opacidad + dark:), pero WhatsappCampaignsTable.tsx
// y WhatsappCampaignDetailSheet.tsx usaban fondo sólido sin dark: propio,
// heredando el color de texto del Badge por defecto. Mismo vocabulario en
// las dos pestañas (Email/WhatsApp), así que ahora comparten los mismos colores.
export const CAMPAIGN_STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  draft:      { dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Borrador"   },
  processing: { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",            label: "Procesando" },
  sent:       { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",      label: "Enviada"    },
  partial:    { dot: "bg-orange-500",  badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",         label: "Parcial"    },
  failed:     { dot: "bg-red-500",     badge: "bg-red-500/10 text-red-600 dark:text-red-400",                  label: "Fallida"    },
}

// Estado del destinatario dentro de una campaña de WhatsApp — vocabulario
// distinto al de la campaña (acá importa el progreso de entrega individual:
// pendiente → enviado → entregado → leído, o falló).
export const RECIPIENT_STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  pending:   { dot: "bg-zinc-400",  badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Pendiente" },
  sent:      { dot: "bg-blue-500",  badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",               label: "Enviado"   },
  delivered: { dot: "bg-sky-500",   badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",                  label: "Entregado" },
  read:      { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",    label: "Leído"     },
  failed:    { dot: "bg-red-500",   badge: "bg-red-500/10 text-red-600 dark:text-red-400",                  label: "Falló"     },
}
