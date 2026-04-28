"use client"

import { BuildingIcon, UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityDetail } from "../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente",   className: "bg-amber-50 text-amber-700"     },
  en_progreso: { label: "En progreso", className: "bg-blue-50 text-blue-700"       },
  completada:  { label: "Completada",  className: "bg-emerald-50 text-emerald-700" },
  cancelada:   { label: "Cancelada",   className: "bg-red-50 text-red-600"         },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  activity: ActivityDetail
}

export function Col3Related({ activity }: Props) {
  const stageConf = STAGE_CONFIG[activity.stageId] ?? STAGE_CONFIG.pendiente

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Estado ────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Estado
          </span>
          <div className="mt-2">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium", stageConf.className)}>
              {stageConf.label}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {activity.stageId === "completada" ? "Marcada como completada" : "Sin completar"}
          </p>
        </div>
        <div className="border-t px-3.5 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{activity.startDate}</span>
            {" → "}
            <span className="font-medium text-foreground">{activity.endDate}</span>
          </p>
        </div>
      </div>

      {/* ── Contacto ──────────────────────────────────────────────────────── */}
      {activity.contact && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="px-3.5 pb-2 pt-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contacto
            </span>
          </div>
          <div className="flex items-center gap-3 border-t px-3.5 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <UserIcon className="size-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{activity.contact.name}</p>
              {activity.contact.position && (
                <p className="truncate text-xs text-muted-foreground">{activity.contact.position}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Organización ──────────────────────────────────────────────────── */}
      {activity.organization && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="px-3.5 pb-2 pt-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Organización
            </span>
          </div>
          <div className="flex items-center gap-3 border-t px-3.5 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <BuildingIcon className="size-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{activity.organization.name}</p>
              {activity.organization.industry && (
                <p className="truncate text-xs text-muted-foreground">{activity.organization.industry}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
