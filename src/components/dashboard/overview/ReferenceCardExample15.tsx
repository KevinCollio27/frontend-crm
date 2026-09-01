import { ExternalLinkIcon, MessagesSquareIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CHANNEL_LABELS, ChannelBadge } from "@/components/dashboard/messaging/ChannelBadge"
import type { ConversationChannel } from "@/components/dashboard/messaging/data"
import { cn } from "@/lib/utils"

// Mock de referencia — "Mensajería" (no solo WhatsApp): centraliza WhatsApp, Instagram,
// Facebook (estos 2 en trámite, casi sin uso real todavía — validado con MCP) y Widget IA,
// igual que /crm/messaging. Reutiliza el ChannelBadge real (mismo componente, no una
// reinvención) y la regla de avatar ya implementada ahí: imagen real si existe
// (visitorAvatarUrl, real en Instagram/Facebook), si no el placeholder de shadcn.
// Contenido inspirado en conversaciones reales de whatsapp_conversation (MCP), hardcodeado.
interface ConversationRow {
  name: string
  lastMessage: string
  time: string
  channel: ConversationChannel
  unread: boolean
}

const CONVERSATIONS: ConversationRow[] = [
  { name: "Kathy 🙊",       lastMessage: "Necesito ayuda con mi pedido, no me ha llegado la confirmación todavía...", time: "Hace 5 h",    channel: "whatsapp", unread: true  },
  { name: "Kevinn C.",      lastMessage: "Perfecto, muchas gracias por la ayuda!",                                   time: "Hace 6 h",    channel: "widget",   unread: false },
  { name: "Rodrigo Valdés", lastMessage: "¿Está disponible el servicio para la próxima semana?",                     time: "Hace 1 día",  channel: "whatsapp", unread: true  },
  { name: "Clau GB",        lastMessage: "Ok, quedo atenta a cualquier novedad",                                     time: "Hace 6 días", channel: "whatsapp", unread: false },
]

function initials(name: string) {
  return name.replace(/[^\p{L}\s]/gu, "").trim().split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

export function ReferenceCardExample15() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
        <MessagesSquareIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Mensajería</p>
          <p className="text-base font-semibold text-white">Conversaciones Recientes</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-800 border-t border-neutral-800">
        {CONVERSATIONS.map((c, i) => (
          <div key={i} className="flex items-start gap-3 px-6 py-3.5">
            <Avatar className="mt-0.5 shrink-0">
              <AvatarImage src="https://github.com/shadcn.png" alt={c.name} />
              <AvatarFallback className="text-[13px] font-medium">{initials(c.name)}</AvatarFallback>
              <ChannelBadge channel={c.channel} />
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm", c.unread ? "font-semibold text-white" : "font-medium text-neutral-300")}>
                {c.name}
              </p>
              <p className="truncate text-xs text-neutral-400">{CHANNEL_LABELS[c.channel]}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{c.lastMessage}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-xs text-neutral-500">{c.time}</span>
              <button type="button" className="text-neutral-500 hover:text-white" title="Ver Detalles">
                <ExternalLinkIcon className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
