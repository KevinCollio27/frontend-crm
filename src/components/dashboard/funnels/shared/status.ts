// Fuente única para el Estado de una oportunidad — FunnelTable.tsx,
// FunnelPreviewSheet.tsx, FunnelKanban.tsx y detail/Col1Info.tsx antes tenían
// cada uno su propia copia (ninguna con dark:, y la de Col1Info ni siquiera
// distinguía "reabierta" de "en progreso"). "cancelada" no existe acá — el
// equivalente es "perdida", que sí es una alerta real, a diferencia de
// "cancelada" en Actividades/Cotizaciones.
export const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; border: string }> = {
  en_progreso: {
    label: "En Progreso",
    dot: "bg-blue-500",
    badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300",
    border: "",
  },
  ganada: {
    label: "Ganada",
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    border: "border-l-2 border-l-emerald-500",
  },
  perdida: {
    label: "Perdida",
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300",
    border: "border-l-2 border-l-red-400",
  },
  reabierta: {
    label: "Reabierta",
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
    border: "border-l-2 border-l-amber-400",
  },
}
// Alias legacy en inglés — callers antiguos de FunnelPreviewSheet/Col1Info
// usaban open/won/lost antes de que la tabla estandarizara las llaves en
// español. Mismos colores, para que ningún caller quede sin cubrir.
STATUS_CONFIG.open = STATUS_CONFIG.en_progreso
STATUS_CONFIG.won   = STATUS_CONFIG.ganada
STATUS_CONFIG.lost  = STATUS_CONFIG.perdida

import type { ElementType } from "react"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

// `color` = decoración liviana (ícono + texto) para donde Prioridad acompaña
// a Estado sin competir con él. `badge` = pill completo para donde va sola
// (Propiedades del negocio, en el detalle).
export const PRIORITY_CONFIG: Record<string, { icon: ElementType; label: string; color: string; badge: string }> = {
  alta: {
    icon: ArrowUpIcon,
    label: "Alta",
    color: "text-red-600 dark:text-red-400",
    badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300",
  },
  media: {
    icon: MinusIcon,
    label: "Media",
    color: "text-amber-600 dark:text-amber-400",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
  },
  baja: {
    icon: ArrowDownIcon,
    label: "Baja",
    color: "text-muted-foreground",
    badge: "border-border bg-muted text-muted-foreground",
  },
}
