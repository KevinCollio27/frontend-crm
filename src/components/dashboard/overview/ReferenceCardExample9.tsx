import { CalendarIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Réplica de la novena card de referencia ("Upcoming Appointments") — pensada para
// miembros del equipo. Header con el mismo tratamiento del resto de referencias. Avatar
// con el placeholder clásico de shadcn (mismo que ya usa MailDisplay.tsx), con iniciales
// como fallback si la imagen no carga — el resto es literal a la imagen, incluida la
// variación de color por fila tal cual se ve ahí.
type Accent = "neutral" | "teal" | "orange"

const ACCENT_BAR: Record<Accent, string> = {
  neutral: "bg-neutral-600",
  teal:    "bg-emerald-500",
  orange:  "bg-orange-500",
}
const ACCENT_BADGE: Record<Accent, string> = {
  neutral: "bg-neutral-800 text-neutral-300",
  teal:    "bg-emerald-500/15 text-emerald-400",
  orange:  "bg-orange-500/15 text-orange-400",
}
const AVATAR_COLORS = ["bg-violet-600", "bg-blue-600", "bg-emerald-600", "bg-orange-600", "bg-rose-600", "bg-cyan-600", "bg-pink-600"]

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

interface AppointmentRow {
  patient: string
  doctor: string
  time: string
  type: string
  accent: Accent
}

const APPOINTMENTS: AppointmentRow[] = [
  { patient: "Marcus Lee",    doctor: "Dr. Sarah Mitchell", time: "09:00 AM", type: "Consultation", accent: "neutral" },
  { patient: "Nina Patel",    doctor: "Dr. James Carter",   time: "10:30 AM", type: "Follow-up",     accent: "teal"    },
  { patient: "Oscar Davis",   doctor: "Dr. Priya Sharma",   time: "11:15 AM", type: "Check-up",      accent: "neutral" },
  { patient: "Laura Hughes",  doctor: "Dr. Emily Walsh",    time: "01:00 PM", type: "Consultation",  accent: "orange"  },
  { patient: "Chris Evans",   doctor: "Dr. Robert Chen",    time: "02:30 PM", type: "Surgery Prep",  accent: "teal"    },
  { patient: "Amy Turner",    doctor: "Dr. Sarah Mitchell", time: "04:00 PM", type: "Follow-up",     accent: "neutral" },
  { patient: "Mark Deshmukh", doctor: "Dr. Sarah Mitchell", time: "04:00 PM", type: "Follow-up",     accent: "neutral" },
]

export function ReferenceCardExample9() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
        <CalendarIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Upcoming Appointments</p>
          <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-800 border-t border-neutral-800">
        {APPOINTMENTS.map((a, i) => (
          <div key={a.patient} className="flex items-center gap-3 px-6 py-3.5">
            <span className={cn("h-9 w-1 shrink-0 rounded-full", ACCENT_BAR[a.accent])} />
            <Avatar className="shrink-0">
              <AvatarImage src="https://github.com/shadcn.png" alt={a.patient} />
              <AvatarFallback className={cn("text-white", AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                {initials(a.patient)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{a.patient}</p>
              <p className="truncate text-xs text-neutral-500">{a.doctor}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm text-white">{a.time}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ACCENT_BADGE[a.accent])}>
                {a.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
