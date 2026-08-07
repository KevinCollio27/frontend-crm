"use client"

import { MessageSquareTextIcon } from "lucide-react"
import { SiFacebook, SiInstagram } from "react-icons/si"
import { AvatarBadge } from "@/components/ui/avatar"
import type { ConversationChannel } from "./data"

// Mismos colores de marca en toda la app — acá y en las notificaciones de
// Mensajería, para que un canal se reconozca de un vistazo en cualquier lado.
export const CHANNEL_COLORS: Record<ConversationChannel, string> = {
  whatsapp: "#25D366",
  instagram: "#E4405F",
  facebook: "#1877F2",
  widget: "#7C3AED",
}

export const CHANNEL_LABELS: Record<ConversationChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook Messenger",
  widget: "Widget IA",
}

export function ChannelBadge({ channel }: { channel: ConversationChannel }) {
  if (channel === "whatsapp") {
    return (
      <AvatarBadge className="bg-[#25D366]">
        <img src="/images/WhatsApp.svg" alt="WhatsApp" className="size-2" />
      </AvatarBadge>
    )
  }
  if (channel === "instagram") {
    return (
      <AvatarBadge className="bg-[#E4405F] size-3! [&>svg]:size-2!">
        <SiInstagram className="text-white" />
      </AvatarBadge>
    )
  }
  if (channel === "facebook") {
    return (
      <AvatarBadge className="bg-[#1877F2] size-3! [&>svg]:size-2!">
        <SiFacebook className="text-white" />
      </AvatarBadge>
    )
  }
  return (
    <AvatarBadge className="bg-violet-600">
      <MessageSquareTextIcon />
    </AvatarBadge>
  )
}
