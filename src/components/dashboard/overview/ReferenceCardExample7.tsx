import type { ReactNode } from "react"
import { ArrowRightIcon, MegaphoneIcon } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FacebookIcon, InstagramIcon, XSocialIcon } from "@/components/dashboard/campains/shared/social-icons"
import { cn } from "@/lib/utils"

// Réplica de la séptima card de referencia ("Campaign Performance") — pensada para
// mostrar el estado de las integraciones (Instagram/Google/Facebook/X) directo en el
// Dashboard, ya que esos datos ya existen. Por ahora es literal a la imagen. Header con
// el mismo tratamiento del resto de referencias (ícono + título/subtítulo, sin separador).
type CampaignStatus = "completed" | "running" | "stopped"

const STATUS_CLASS: Record<CampaignStatus, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  running:   "bg-amber-500/15 text-amber-400",
  stopped:   "bg-red-500/15 text-red-400",
}
const STATUS_LABEL: Record<CampaignStatus, string> = {
  completed: "Completed",
  running:   "Running",
  stopped:   "Stopped",
}

interface CampaignRow {
  platform: string
  users: string
  status: CampaignStatus
  chipClass: string
  chip: ReactNode
}

const CAMPAIGNS: CampaignRow[] = [
  { platform: "Instagram", users: "8.49k users", status: "completed", chipClass: "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400", chip: <InstagramIcon className="size-5 text-white" /> },
  { platform: "Google",    users: "9.12k users", status: "running",   chipClass: "bg-white",                                                      chip: <FcGoogle className="size-5" /> },
  { platform: "Facebook",  users: "6.98k users", status: "stopped",   chipClass: "bg-blue-600",                                                    chip: <FacebookIcon className="size-5 text-white" /> },
  { platform: "X/Twitter", users: "8.92k users", status: "stopped",   chipClass: "border border-neutral-700 bg-black",                             chip: <XSocialIcon className="size-4 text-white" /> },
]

export function ReferenceCardExample7() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
        <MegaphoneIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Campaign Performance</p>
          <p className="text-base font-semibold text-white">Shadcn Dashboard</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-800 border-t border-neutral-800">
        {CAMPAIGNS.map((c) => (
          <div key={c.platform} className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", c.chipClass)}>
                {c.chip}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{c.platform}</p>
                <p className="truncate text-xs text-neutral-500">{c.users}</p>
              </div>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", STATUS_CLASS[c.status])}>
              {STATUS_LABEL[c.status]}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 border-t border-neutral-800 px-6 py-3.5 text-sm text-white hover:bg-neutral-900"
      >
        See Report <ArrowRightIcon className="size-3.5" />
      </button>
    </div>
  )
}
