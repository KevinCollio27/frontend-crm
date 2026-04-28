"use client"

import { cn } from "@/lib/utils"
import {
  CalendarIcon,
  FileTextIcon,
  PencilIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ActivityDetail, ActivityHistorialType } from "../../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

const HISTORIAL_ICON: Record<ActivityHistorialType, { Icon: LucideIcon; bg: string; icon: string }> = {
  created:        { Icon: PlusCircleIcon, bg: "bg-emerald-100", icon: "text-emerald-600" },
  updated:        { Icon: PencilIcon,     bg: "bg-violet-100",  icon: "text-violet-600"  },
  note:           { Icon: FileTextIcon,   bg: "bg-amber-100",   icon: "text-amber-600"   },
  status_changed: { Icon: RefreshCwIcon,  bg: "bg-sky-100",     icon: "text-sky-600"     },
  assigned:       { Icon: UserIcon,       bg: "bg-indigo-100",  icon: "text-indigo-600"  },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  activity: ActivityDetail
}

export function HistorialTab({ activity }: Props) {
  const months: string[] = []
  const grouped: Record<string, typeof activity.historial> = {}
  for (const entry of activity.historial) {
    if (!grouped[entry.month]) {
      months.push(entry.month)
      grouped[entry.month] = []
    }
    grouped[entry.month].push(entry)
  }

  if (activity.historial.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <CalendarIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Sin historial registrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {months.map((month) => (
        <div key={month} className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {month}
          </span>
          {grouped[month].map((entry) => {
            const conf = HISTORIAL_ICON[entry.type]
            return (
              <div key={entry.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="flex items-start gap-3 p-3.5">
                  <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", conf.bg)}>
                    <conf.Icon className={cn("size-3.5", conf.icon)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{entry.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{entry.actor} · {entry.date}</p>
                  </div>
                </div>
                {entry.content && (
                  <div className="border-t px-3.5 py-2.5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{entry.content}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
