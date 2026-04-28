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
import type { ActivityDetail } from "../data"

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
  alta:  { label: "Alta",  className: "bg-red-50 text-red-700"           },
  media: { label: "Media", className: "bg-amber-50 text-amber-700"       },
  baja:  { label: "Baja",  className: "bg-emerald-50 text-emerald-700"   },
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
  activity: ActivityDetail
}

export function Col1Info({ activity }: Props) {
  const typeStyle = TYPE_STYLE[activity.type] ?? { bg: "bg-muted", icon: "text-muted-foreground" }
  const TypeIcon  = TYPE_ICON[activity.type]  ?? CalendarIcon
  const stageConf    = STAGE_CONFIG[activity.stageId]    ?? STAGE_CONFIG.pendiente
  const priorityConf = PRIORITY_CONFIG[activity.priority] ?? PRIORITY_CONFIG.media

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Identidad ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 p-3.5">
          <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", typeStyle.bg)}>
            <TypeIcon className={cn("size-6", typeStyle.icon)} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{activity.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{activity.type}</p>
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

      {/* ── Propiedades ───────────────────────────────────────────────────── */}
      <CollapsibleSection title="Propiedades">
        <div className="divide-y">

          <PropRow label="Responsable">
            <Avatar className="size-5 shrink-0">
              <AvatarImage src={activity.responsible.avatar} alt={activity.responsible.name} />
              <AvatarFallback className="text-[9px] font-semibold">{activity.responsible.initials}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{activity.responsible.name}</span>
          </PropRow>

          <PropRow label="Fecha inicio">
            <span className="text-sm font-medium">{activity.startDate}</span>
          </PropRow>

          <PropRow label="Fecha fin">
            <span className="text-sm font-medium">{activity.endDate}</span>
          </PropRow>

          {activity.ubicacion && (
            <PropRow label="Ubicación">
              <span className="truncate text-sm font-medium">{activity.ubicacion}</span>
            </PropRow>
          )}

          {activity.opportunityName && (
            <PropRow label="Oportunidad">
              <span className="truncate text-right text-sm font-medium">{activity.opportunityName}</span>
            </PropRow>
          )}

          {activity.funnelName && (
            <PropRow label="Pipeline">
              <span className="truncate text-sm font-medium">{activity.funnelName}</span>
            </PropRow>
          )}

          <PropRow label="Creada">
            <span className="text-sm font-medium">{activity.createdAt}</span>
          </PropRow>

        </div>
      </CollapsibleSection>

      {/* ── Relacionado con ───────────────────────────────────────────────── */}
      {(activity.contact || activity.organization) && (
        <CollapsibleSection title="Relacionado con">
          <div className="divide-y">
            {activity.contact && (
              <PropRow label="Contacto">
                <div className="flex min-w-0 flex-col items-end">
                  <span className="truncate text-sm font-medium">{activity.contact.name}</span>
                  {activity.contact.position && (
                    <span className="text-xs text-muted-foreground">{activity.contact.position}</span>
                  )}
                </div>
              </PropRow>
            )}
            {activity.organization && (
              <PropRow label="Organización">
                <div className="flex min-w-0 flex-col items-end">
                  <span className="truncate text-sm font-medium">{activity.organization.name}</span>
                  {activity.organization.industry && (
                    <span className="text-xs text-muted-foreground">{activity.organization.industry}</span>
                  )}
                </div>
              </PropRow>
            )}
          </div>
        </CollapsibleSection>
      )}

    </div>
  )
}
