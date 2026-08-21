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
import { ChevronDownIcon } from "lucide-react"
import {
  ACTIVITY_TYPE_CONFIG,
  DEFAULT_TYPE_CONFIG,
  PRIORITY_CONFIG,
  STAGE_CONFIG,
} from "@/lib/activity-utils"
import type { ActivityRaw } from "@/types/activity"

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

  const type      = typeDetail?.option ?? ""
  const priority  = prioDetail?.option?.toLowerCase() ?? "media"
  const stageId   = activity.status ?? (activity.is_completed ? "completada" : "pendiente")
  const responsible = activity.user?.name ?? "—"
  const responsibleAvatarUrl = activity.user?.avatar_url ?? null

  const typeConfig = ACTIVITY_TYPE_CONFIG[type] ?? DEFAULT_TYPE_CONFIG
  const TypeIcon   = typeConfig.icon
  const stageConf    = STAGE_CONFIG[stageId]    ?? STAGE_CONFIG.pendiente
  const priorityConf = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.media

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Identidad */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 p-3.5">
          <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", typeConfig.bgClass)}>
            <TypeIcon className={cn("size-6", typeConfig.iconClass)} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{activity.title ?? "Sin título"}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{type || "Sin tipo"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", stageConf.badge)}>
                <span className={cn("size-1.5 rounded-full", stageConf.dot)} />
                {stageConf.label}
              </span>
              <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs gap-1", priorityConf.badge)}>
                <priorityConf.icon className="size-3" />
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
              <AvatarImage src={responsibleAvatarUrl ?? "https://github.com/shadcn.png"} alt={responsible} />
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
