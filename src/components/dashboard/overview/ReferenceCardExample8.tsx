import { CalendarIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Réplica de la octava card de referencia ("Upcoming Events") — pensada para
// Oportunidades (próximos vencimientos/actividades). Header con el mismo tratamiento
// del resto de referencias (ícono + título/subtítulo, sin separador); la lista es
// literal a la imagen.
type EventCategory = "Exam" | "Event" | "Meeting"

const CATEGORY_CLASS: Record<EventCategory, string> = {
  Exam:    "bg-red-500/15 text-red-400",
  Event:   "bg-emerald-500/15 text-emerald-400",
  Meeting: "bg-amber-500/15 text-amber-400",
}

interface EventRow {
  title: string
  date: string
  time: string
  category: EventCategory
}

const EVENTS: EventRow[] = [
  { title: "Mid-term Examinations",   date: "Jun 20, 2026", time: "9:00 AM",  category: "Exam"    },
  { title: "Science Fair",            date: "Jun 25, 2026", time: "10:00 AM", category: "Event"   },
  { title: "Parent-Teacher Meeting",  date: "Jun 28, 2026", time: "2:00 PM",  category: "Meeting" },
  { title: "Annual Sports Day",       date: "Jul 5, 2026",  time: "8:00 AM",  category: "Event"   },
  { title: "Final Examinations",      date: "Jul 15, 2026", time: "9:00 AM",  category: "Exam"    },
]

export function ReferenceCardExample8() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
        <CalendarIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Upcoming Events</p>
          <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-800 border-t border-neutral-800">
        {EVENTS.map((e) => (
          <div key={e.title} className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate text-sm font-medium text-white">{e.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                <span className="flex shrink-0 items-center gap-1">
                  <CalendarIcon className="size-3" /> {e.date}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <ClockIcon className="size-3" /> {e.time}
                </span>
              </div>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", CATEGORY_CLASS[e.category])}>
              {e.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
