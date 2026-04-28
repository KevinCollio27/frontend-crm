"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ArrowRightIcon,
  CalendarIcon,
  FileTextIcon,
  PencilIcon,
  PlusCircleIcon,
  StarIcon,
  TrendingUpIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ContactActivityStatus, ContactDetail, ContactHistorialType } from "../../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

const HISTORIAL_ICON: Record<ContactHistorialType, { Icon: LucideIcon; bg: string; icon: string }> = {
  created:     { Icon: PlusCircleIcon, bg: "bg-emerald-100", icon: "text-emerald-600" },
  updated:     { Icon: PencilIcon,     bg: "bg-violet-100",  icon: "text-violet-600"  },
  note:        { Icon: FileTextIcon,   bg: "bg-amber-100",   icon: "text-amber-600"   },
  opportunity: { Icon: TrendingUpIcon, bg: "bg-sky-100",     icon: "text-sky-600"     },
  activity:    { Icon: CalendarIcon,   bg: "bg-indigo-100",  icon: "text-indigo-600"  },
  interest:    { Icon: StarIcon,       bg: "bg-rose-100",    icon: "text-rose-600"    },
}

const ACTIVITY_STATUS: Record<ContactActivityStatus, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente",   className: "bg-amber-50 text-amber-700"     },
  en_progreso: { label: "En progreso", className: "bg-blue-50 text-blue-700"       },
  completada:  { label: "Completada",  className: "bg-emerald-50 text-emerald-700" },
  cancelada:   { label: "Cancelada",   className: "bg-red-50 text-red-600"         },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contact: ContactDetail
}

export function HistorialTab({ contact }: Props) {
  const upcoming = contact.activities.filter(
    (a) => a.status === "pendiente" || a.status === "en_progreso"
  )

  const months: string[] = []
  const grouped: Record<string, typeof contact.historial> = {}
  for (const entry of contact.historial) {
    if (!grouped[entry.month]) {
      months.push(entry.month)
      grouped[entry.month] = []
    }
    grouped[entry.month].push(entry)
  }

  return (
    <div className="flex flex-col gap-5 p-4">

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Próximas actividades
          </span>
          {upcoming.map((a) => {
            const conf = ACTIVITY_STATUS[a.status]
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 shadow-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <CalendarIcon className="size-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.type} · {a.date_from}</p>
                </div>
                <Badge className={cn("shrink-0 rounded-full border-0 px-2 py-0.5 text-xs", conf.className)}>
                  {conf.label}
                </Badge>
              </div>
            )
          })}
        </div>
      )}

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
