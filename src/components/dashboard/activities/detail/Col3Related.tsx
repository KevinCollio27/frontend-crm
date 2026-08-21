"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowUpRightIcon,
  BadgeCheck,
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { activityService } from "@/services/activity.service"
import { notify } from "@/lib/notify"
import type { ActivityRaw } from "@/types/activity"

// ─── Config ───────────────────────────────────────────────────────────────────

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

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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

function EmptySection({ title, message }: { title: string; message: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b px-3.5 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  activity:       ActivityRaw
  onStatusChange: (updates: Partial<ActivityRaw>) => void
}

export function Col3Related({ activity, onStatusChange }: Props) {
  const [loading, setLoading] = React.useState(false)

  const stageId      = (activity.status ?? (activity.is_completed ? "completada" : "pendiente")) as StageId
  const person       = activity.opportunity?.person
  const organization = activity.opportunity?.organization

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
    <div className="flex flex-col gap-4 p-4">

      {/* Estado */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Estado
          </span>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
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
        </div>
      </div>

      {/* Contacto */}
      {person ? (
        <CollapsibleSection title="Contacto">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt={person.name} />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -bottom-1 -right-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">Contacto asociado</p>
              </div>
              <Link
                href={`/crm/contacts/${person.id}`}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowUpRightIcon className="size-3.5" />
              </Link>
            </div>
          </div>
        </CollapsibleSection>
      ) : (
        <EmptySection title="Contacto" message="Sin contacto asociado." />
      )}

      {/* Empresa */}
      {organization ? (
        <CollapsibleSection title="Empresa">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt={organization.name} />
                  <AvatarFallback>{initials(organization.name)}</AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -bottom-1 -right-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{organization.name}</p>
                <p className="truncate text-xs text-muted-foreground">Empresa asociada</p>
              </div>
              <Link
                href={`/crm/organizations/${organization.id}`}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowUpRightIcon className="size-3.5" />
              </Link>
            </div>
          </div>
        </CollapsibleSection>
      ) : (
        <EmptySection title="Empresa" message="Sin empresa asociada." />
      )}

    </div>
  )
}
