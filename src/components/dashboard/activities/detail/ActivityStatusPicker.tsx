"use client"

import * as React from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { activityService } from "@/services/activity.service"
import { notify } from "@/lib/notify"
import type { ActivityRaw } from "@/types/activity"

// Mismos tonos que STAGE_CONFIG en activity-utils.tsx — "cancelada" queda
// neutro (no rojo), el rojo se reserva para alertas reales.
const STAGE_CONFIG = {
  pendiente: {
    label: "Pendiente",
    activeBg: "bg-amber-100 dark:bg-amber-950/50",
    activeText: "text-amber-800 dark:text-amber-300",
    hoverColor: "hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 dark:hover:text-amber-300 dark:hover:bg-amber-950/40 dark:hover:border-amber-800/60",
  },
  en_progreso: {
    label: "En progreso",
    activeBg: "bg-blue-100 dark:bg-blue-950/50",
    activeText: "text-blue-800 dark:text-blue-300",
    hoverColor: "hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 dark:hover:text-blue-300 dark:hover:bg-blue-950/40 dark:hover:border-blue-800/60",
  },
  completada: {
    label: "Completada",
    activeBg: "bg-emerald-100 dark:bg-emerald-950/50",
    activeText: "text-emerald-800 dark:text-emerald-300",
    hoverColor: "hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-800/60",
  },
  cancelada: {
    label: "Cancelada",
    activeBg: "bg-slate-200 dark:bg-slate-800/60",
    activeText: "text-slate-700 dark:text-slate-300",
    hoverColor: "hover:text-slate-600 hover:bg-slate-100 hover:border-slate-300 dark:hover:text-slate-300 dark:hover:bg-slate-800/40 dark:hover:border-slate-700/60",
  },
} as const

type StageId = keyof typeof STAGE_CONFIG
const ALL_STAGES = Object.keys(STAGE_CONFIG) as StageId[]

interface Props {
  activity: ActivityRaw
  onStatusChange: (updates: Partial<ActivityRaw>) => void
}

// Selector de estado de una actividad — lo usan el detalle (Col3Related) y la vista previa.
// Optimista: aplica el cambio al instante y lo revierte si el backend falla.
export function ActivityStatusPicker({ activity, onStatusChange }: Props) {
  const [loading, setLoading] = React.useState(false)
  const stageId = (activity.status ?? (activity.is_completed ? "completada" : "pendiente")) as StageId

  async function handleStatusChange(newStatus: StageId) {
    if (newStatus === stageId || loading) return
    setLoading(true)
    const prev = { status: activity.status, is_completed: activity.is_completed }
    onStatusChange({ status: newStatus, is_completed: newStatus === "completada" })
    try {
      if (newStatus === "completada") {
        await activityService.complete(activity.id)
      } else {
        await activityService.updateStatus(activity.id, newStatus)
      }
      notify.success({ title: "Estado actualizado", description: `La actividad pasó a "${STAGE_CONFIG[newStatus].label}".` })
    } catch {
      onStatusChange(prev)
      notify.error({ title: "No se pudo actualizar el estado", description: "Intenta de nuevo." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ALL_STAGES.map((s) => {
        const conf     = STAGE_CONFIG[s]
        const isActive = s === stageId
        return (
          <button
            key={s}
            type="button"
            disabled={loading || isActive}
            onClick={() => handleStatusChange(s)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
              isActive
                ? cn(conf.activeBg, conf.activeText, "border-transparent cursor-default")
                : cn("border-border text-muted-foreground cursor-pointer", conf.hoverColor),
              loading && !isActive && "pointer-events-none opacity-40",
            )}
          >
            {isActive ? (
              <CheckIcon className="size-3 shrink-0" />
            ) : loading ? (
              <Loader2Icon className="size-3 shrink-0 animate-spin" />
            ) : null}
            {conf.label}
          </button>
        )
      })}
    </div>
  )
}
