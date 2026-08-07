import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  EyeIcon,
  MailIcon,
  MapPinIcon,
  MinusIcon,
  PhoneIcon,
  SearchIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"
import { getInitials } from "@/lib/table-utils"
import type { ActivityRaw } from "@/types/activity"

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
  responsible: { name: string; initials: string; avatar?: string }
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
      name:     d.user?.name ?? "—",
      initials: getInitials(d.user?.name ?? ""),
    },
    opportunityName: d.opportunity?.name ?? "",
    funnelName:      d.opportunity?.flow?.name ?? "",
    googleEventId:   d.activity_calendar_events?.[0]?.google_event_id,
  }
}

export const ACTIVITY_TYPE_CONFIG: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  "Reunión":       { icon: UsersIcon,    iconClass: "text-violet-600", bgClass: "bg-violet-50"  },
  "Llamada":       { icon: PhoneIcon,    iconClass: "text-blue-600",   bgClass: "bg-blue-50"    },
  "Correo":        { icon: MailIcon,     iconClass: "text-amber-600",  bgClass: "bg-amber-50"   },
  "Seguimiento":   { icon: SearchIcon,   iconClass: "text-cyan-600",   bgClass: "bg-cyan-50"    },
  "Revisión":      { icon: EyeIcon,      iconClass: "text-orange-600", bgClass: "bg-orange-50"  },
  "Planificación": { icon: CalendarIcon, iconClass: "text-emerald-600",bgClass: "bg-emerald-50" },
  "Video Llamada": { icon: VideoIcon,    iconClass: "text-pink-600",   bgClass: "bg-pink-50"    },
  "Visita":        { icon: MapPinIcon,   iconClass: "text-red-600",    bgClass: "bg-red-50"     },
}

export const DEFAULT_TYPE_CONFIG = { icon: CalendarIcon, iconClass: "text-muted-foreground", bgClass: "bg-muted" }

export const PRIORITY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  alta:  { icon: ArrowUpIcon,   label: "Alta",  color: "text-red-600"          },
  media: { icon: MinusIcon,     label: "Media", color: "text-yellow-600"       },
  baja:  { icon: ArrowDownIcon, label: "Baja",  color: "text-muted-foreground" },
}
