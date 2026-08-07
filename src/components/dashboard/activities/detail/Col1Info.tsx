"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/table-utils"
import {
  CalendarIcon,
  ChevronDownIcon,
  EyeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"
import type { ActivityRaw } from "@/types/activity"

// ─── Configs ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  "Reunión":       UsersIcon,
  "Llamada":       PhoneIcon,
  "Correo":        MailIcon,
  "Seguimiento":   SearchIcon,
  "Revisión":      EyeIcon,
  "Planificación": CalendarIcon,
  "Video Llamada": VideoIcon,
  "Visita":        MapPinIcon,
}

const TYPE_STYLE: Record<string, { bg: string; icon: string }> = {
  "Reunión":       { bg: "bg-violet-100",  icon: "text-violet-600"  },
  "Llamada":       { bg: "bg-blue-100",    icon: "text-blue-600"    },
  "Correo":        { bg: "bg-amber-100",   icon: "text-amber-600"   },
  "Seguimiento":   { bg: "bg-cyan-100",    icon: "text-cyan-600"    },
  "Revisión":      { bg: "bg-orange-100",  icon: "text-orange-600"  },
  "Planificación": { bg: "bg-emerald-100", icon: "text-emerald-600" },
  "Video Llamada": { bg: "bg-pink-100",    icon: "text-pink-600"    },
  "Visita":        { bg: "bg-red-100",     icon: "text-red-600"     },
}

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente",   className: "bg-amber-50 text-amber-700"     },
  en_progreso: { label: "En progreso", className: "bg-blue-50 text-blue-700"       },
  completada:  { label: "Completada",  className: "bg-emerald-50 text-emerald-700" },
  cancelada:   { label: "Cancelada",   className: "bg-red-50 text-red-600"         },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  alta:  { label: "Alta",  className: "bg-red-50 text-red-700"         },
  media: { label: "Media", className: "bg-amber-50 text-amber-700"     },
  baja:  { label: "Baja",  className: "bg-emerald-50 text-emerald-700" },
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-3 transition-colors hover:bg-muted/30">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center justify-end gap-1.5">{children}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  activity: ActivityRaw
}

export function Col1Info({ activity }: Props) {
  const typeDetail = activity.opportunity_activity_detail.find((d) => d.label?.key === "activity_type")
  const prioDetail = activity.opportunity_activity_detail.find((d) => d.label?.key === "priority")

  const type      = typeDetail?.value ?? ""
  const priority  = prioDetail?.value?.toLowerCase() ?? "media"
  const stageId   = activity.status ?? (activity.is_completed ? "completada" : "pendiente")
  const responsible = activity.user?.name ?? "—"

  const typeStyle  = TYPE_STYLE[type]  ?? { bg: "bg-muted", icon: "text-muted-foreground" }
  const TypeIcon   = TYPE_ICON[type]   ?? CalendarIcon
  const stageConf    = STAGE_CONFIG[stageId]    ?? STAGE_CONFIG.pendiente
  const priorityConf = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.media

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Identidad */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 p-3.5">
          <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", typeStyle.bg)}>
            <TypeIcon className={cn("size-6", typeStyle.icon)} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{activity.title ?? "Sin título"}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{type || "Sin tipo"}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge className={cn("rounded-full border-0 px-2.5 py-0.5 text-xs", stageConf.className)}>
                {stageConf.label}
              </Badge>
              <Badge className={cn("rounded-full border-0 px-2.5 py-0.5 text-xs", priorityConf.className)}>
                {priorityConf.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Propiedades */}
      <CollapsibleSection title="Propiedades">
        <div className="divide-y">
          <PropRow label="Responsable">
            <Avatar className="size-5 shrink-0">
              <AvatarImage src="https://github.com/shadcn.png" alt={responsible} />
              <AvatarFallback className="text-[9px] font-semibold">{getInitials(responsible)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{responsible}</span>
          </PropRow>

          <PropRow label="Fecha inicio">
            <span className="text-sm font-medium">{fmtDate(activity.date_from)}</span>
          </PropRow>

          <PropRow label="Fecha fin">
            <span className="text-sm font-medium">{fmtDate(activity.date_to)}</span>
          </PropRow>

          {activity.ubication && (
            <PropRow label="Ubicación">
              <span className="truncate text-sm font-medium">{activity.ubication}</span>
            </PropRow>
          )}

          {activity.opportunity?.name && (
            <PropRow label="Oportunidad">
              <span className="truncate text-right text-sm font-medium">{activity.opportunity.name}</span>
            </PropRow>
          )}

          {activity.opportunity?.flow?.name && (
            <PropRow label="Pipeline">
              <span className="truncate text-sm font-medium">{activity.opportunity.flow.name}</span>
            </PropRow>
          )}

          <PropRow label="Creada">
            <span className="text-sm font-medium">{fmtDate(activity.created_at)}</span>
          </PropRow>
        </div>
      </CollapsibleSection>


    </div>
  )
}
