import type { ElementType } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  EyeIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  MegaphoneIcon,
  MinusIcon,
  PhoneIcon,
  SearchIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"
import { getInitials, OVERDUE_BADGE_CLASS } from "@/lib/table-utils"
import type { ActivityRaw } from "@/types/activity"

export { OVERDUE_BADGE_CLASS }

// El backend guarda date_from/date_to en UTC. Un recorte de texto ingenuo sobre ese
// string (slice) muestra la fecha/hora UTC tal cual, no la del workspace — con
// actividades de tarde/noche eso cruza medianoche y muestra el día siguiente.
// `timezone` es la configurada en Settings del workspace (país y zona horaria).
export function toWorkspaceDateTimeParts(iso: string, timezone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  }
}

export interface Activity {
  id: number
  title: string
  type: string
  priority: string
  startDate: string
  endDate: string
  startTime?: string
  stageId: string
  createdAt: string
  responsible: { name: string; initials: string; avatarUrl?: string | null }
  opportunityName: string
  funnelName: string
  googleEventId?: string
}

export function mapActivity(d: ActivityRaw, timezone: string): Activity {
  const typeDetail     = d.opportunity_activity_detail.find((det) => det.label?.key === "activity_type")
  const priorityDetail = d.opportunity_activity_detail.find((det) => det.label?.key === "priority")
  const start = d.date_from ? toWorkspaceDateTimeParts(d.date_from, timezone) : null
  const end   = d.date_to   ? toWorkspaceDateTimeParts(d.date_to, timezone)   : null
  return {
    id:              d.id,
    title:           d.title ?? "",
    type:            typeDetail?.option ?? "",
    priority:        priorityDetail?.option?.toLowerCase() ?? "",
    startDate:       start?.date ?? "",
    endDate:         end?.date ?? "",
    startTime:       start?.time,
    stageId:         d.status ?? (d.is_completed ? "completada" : "pendiente"),
    createdAt:       (d.created_at ?? "").slice(0, 10),
    responsible: {
      name:      d.user?.name ?? "—",
      initials:  getInitials(d.user?.name ?? ""),
      avatarUrl: d.user?.avatar_url ?? null,
    },
    opportunityName: d.opportunity?.name ?? "",
    funnelName:      d.opportunity?.flow?.name ?? "",
    googleEventId:   d.activity_calendar_events?.[0]?.google_event_id,
  }
}

// ─── Estado ─────────────────────────────────────────────────────────────────
//
// Fuente única para Tabla, Kanban, Vista Previa y Detalle — antes cada uno
// tenía su propia copia de estos colores (con "cancelada" en gris en unos
// lugares y en rojo en otros) y ninguna tenía variante dark:, por eso se veía
// mal en modo oscuro. "cancelada" queda neutro (no rojo) porque es un cierre,
// no un error — el rojo se reserva para alertas reales (Atrasada, prioridad Alta).
export const STAGE_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  pendiente: {
    label: "Pendiente",
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
  },
  en_progreso: {
    label: "En Progreso",
    dot: "bg-blue-500",
    badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300",
  },
  completada: {
    label: "Completada",
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  cancelada: {
    label: "Cancelada",
    dot: "bg-slate-400",
    badge: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400",
  },
}

// ─── Prioridad ──────────────────────────────────────────────────────────────
//
// `color` = decoración liviana (ícono + texto, sin fondo) para Tabla y Vista
// Previa, donde Prioridad acompaña a Estado sin competir con él. `badge` =
// pill completo para Kanban y el encabezado de Detalle, donde va sola.
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

// ─── Tipo ───────────────────────────────────────────────────────────────────
//
// Tipo es texto libre (el usuario lo escribe al crear la actividad, no un
// select cerrado) — igual que Cargo en Contactos, así que perseguir un color
// por valor nunca cubre todo. En vez de eso: cada tipo *conocido* (el que
// viene de la plantilla original) tiene su propio ícono/color como decoración,
// y todo lo demás (incluido "Desarrollo", el valor más común en la base) cae
// al genérico — sin fingir una categoría que no existe.
export const ACTIVITY_TYPE_CONFIG: Record<string, { icon: ElementType; iconClass: string; bgClass: string }> = {
  "Reunión":         { icon: UsersIcon,    iconClass: "text-violet-600 dark:text-violet-400",   bgClass: "bg-violet-50 dark:bg-violet-950/40"   },
  "Generar reunión": { icon: UsersIcon,    iconClass: "text-violet-600 dark:text-violet-400",   bgClass: "bg-violet-50 dark:bg-violet-950/40"   },
  "Llamada":         { icon: PhoneIcon,    iconClass: "text-blue-600 dark:text-blue-400",       bgClass: "bg-blue-50 dark:bg-blue-950/40"       },
  "WhatsApp":        { icon: PhoneIcon,    iconClass: "text-blue-600 dark:text-blue-400",       bgClass: "bg-blue-50 dark:bg-blue-950/40"       },
  "Correo":          { icon: MailIcon,     iconClass: "text-amber-600 dark:text-amber-400",     bgClass: "bg-amber-50 dark:bg-amber-950/40"     },
  "Mensaje":         { icon: MailIcon,     iconClass: "text-amber-600 dark:text-amber-400",     bgClass: "bg-amber-50 dark:bg-amber-950/40"     },
  "Seguimiento":     { icon: SearchIcon,   iconClass: "text-cyan-600 dark:text-cyan-400",       bgClass: "bg-cyan-50 dark:bg-cyan-950/40"       },
  "Revisión":        { icon: EyeIcon,      iconClass: "text-orange-600 dark:text-orange-400",   bgClass: "bg-orange-50 dark:bg-orange-950/40"   },
  "Levantamiento":   { icon: EyeIcon,      iconClass: "text-orange-600 dark:text-orange-400",   bgClass: "bg-orange-50 dark:bg-orange-950/40"   },
  "Planificación":   { icon: CalendarIcon, iconClass: "text-indigo-600 dark:text-indigo-400",   bgClass: "bg-indigo-50 dark:bg-indigo-950/40"   },
  "Definición":      { icon: CalendarIcon, iconClass: "text-indigo-600 dark:text-indigo-400",   bgClass: "bg-indigo-50 dark:bg-indigo-950/40"   },
  "Video Llamada":   { icon: VideoIcon,    iconClass: "text-pink-600 dark:text-pink-400",       bgClass: "bg-pink-50 dark:bg-pink-950/40"       },
  "Visita":          { icon: MapPinIcon,   iconClass: "text-red-600 dark:text-red-400",         bgClass: "bg-red-50 dark:bg-red-950/40"         },
  "Visita Terreno":  { icon: MapPinIcon,   iconClass: "text-red-600 dark:text-red-400",         bgClass: "bg-red-50 dark:bg-red-950/40"         },
  "Documentación":   { icon: FileTextIcon, iconClass: "text-slate-600 dark:text-slate-400",     bgClass: "bg-slate-100 dark:bg-slate-800/40"    },
  "Marketing":       { icon: MegaphoneIcon,iconClass: "text-fuchsia-600 dark:text-fuchsia-400", bgClass: "bg-fuchsia-50 dark:bg-fuchsia-950/40" },
}

export const DEFAULT_TYPE_CONFIG = { icon: CalendarIcon, iconClass: "text-muted-foreground", bgClass: "bg-muted" }
