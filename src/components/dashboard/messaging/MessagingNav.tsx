import {
  CheckCircle2Icon,
  InboxIcon,
  MessagesSquareIcon,
  UserXIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessagingView } from "./data"
import { VIEW_COUNTS } from "./data"

interface NavItem {
  id: MessagingView
  label: string
  icon: React.ElementType
}

const BANDEJA_ITEMS: NavItem[] = [
  { id: "my_inbox",   label: "Mi bandeja",   icon: InboxIcon          },
  { id: "all",        label: "Todos",         icon: MessagesSquareIcon },
  { id: "unassigned", label: "Sin asignar",   icon: UserXIcon          },
  { id: "resolved",   label: "Resueltos",     icon: CheckCircle2Icon   },
]

function WhatsAppIcon({ className }: { className?: string }) {
  return <img src="/images/WhatsApp.svg" alt="WhatsApp" className={className} />
}

function AsistenteAIIcon({ className }: { className?: string }) {
  return <img src="/images/Asistente AI.svg" alt="Asistente AI" className={className} />
}

const CHANNEL_ITEMS: NavItem[] = [
  { id: "whatsapp", label: "WhatsApp",   icon: WhatsAppIcon    },
  { id: "widget",   label: "Widget web", icon: AsistenteAIIcon },
]

interface MessagingNavProps {
  activeView: MessagingView
  onViewChange: (view: MessagingView) => void
}

function NavButton({ item, active, onViewChange }: {
  item: NavItem
  active: boolean
  onViewChange: (view: MessagingView) => void
}) {
  const Icon = item.icon
  const count = VIEW_COUNTS[item.id]
  return (
    <button
      type="button"
      onClick={() => onViewChange(item.id)}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {count > 0 && (
        <span className={cn(
          "ml-auto text-xs tabular-nums",
          active ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

export function MessagingNav({ activeView, onViewChange }: MessagingNavProps) {
  return (
    <nav className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-1">
        {BANDEJA_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onViewChange={onViewChange}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Por canal
        </p>
        {CHANNEL_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onViewChange={onViewChange}
          />
        ))}
      </div>
    </nav>
  )
}
