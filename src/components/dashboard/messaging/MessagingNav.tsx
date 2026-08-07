import { InboxIcon, MessageSquareTextIcon } from "lucide-react"
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si"
import { cn } from "@/lib/utils"
import type { MessagingView } from "./data"

export interface AgentNavItem {
  id: number
  name: string
  count: number
}

interface MessagingNavProps {
  activeView: MessagingView
  onViewChange: (view: MessagingView) => void
  inboxCount: number
  whatsappCount: number
  instagramCount: number
  facebookCount: number
  agents: AgentNavItem[]
}

function NavButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">{label}</span>
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

export function MessagingNav({ activeView, onViewChange, inboxCount, whatsappCount, instagramCount, facebookCount, agents }: MessagingNavProps) {
  return (
    <nav className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-1">
        <NavButton
          icon={InboxIcon}
          label="Mi bandeja"
          count={inboxCount}
          active={activeView === "my_inbox"}
          onClick={() => onViewChange("my_inbox")}
        />
        <NavButton
          icon={SiWhatsapp}
          label="WhatsApp"
          count={whatsappCount}
          active={activeView === "whatsapp"}
          onClick={() => onViewChange("whatsapp")}
        />
        <NavButton
          icon={SiInstagram}
          label="Instagram"
          count={instagramCount}
          active={activeView === "instagram"}
          onClick={() => onViewChange("instagram")}
        />
        <NavButton
          icon={SiFacebook}
          label="Messenger"
          count={facebookCount}
          active={activeView === "facebook"}
          onClick={() => onViewChange("facebook")}
        />
      </div>

      {agents.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Por agente
          </p>
          {agents.map((agent) => (
            <NavButton
              key={agent.id}
              icon={MessageSquareTextIcon}
              label={agent.name}
              count={agent.count}
              active={activeView === agent.id}
              onClick={() => onViewChange(agent.id)}
            />
          ))}
        </div>
      )}
    </nav>
  )
}
