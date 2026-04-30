"use client"

import * as React from "react"
import { MessagesSquareIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { MessagingNav } from "@/components/dashboard/messaging/MessagingNav"
import { ConversationList } from "@/components/dashboard/messaging/ConversationList"
import { ConversationView } from "@/components/dashboard/messaging/ConversationView"
import { conversations } from "@/components/dashboard/messaging/data"
import type { MessagingView } from "@/components/dashboard/messaging/data"

export default function MessagingPage() {
  const [activeView, setActiveView] = React.useState<MessagingView>("my_inbox")
  const [selectedId, setSelectedId] = React.useState<string | null>(
    conversations[0]?.id ?? null
  )

  return (
    <>
      <PageHeader
        icon={MessagesSquareIcon}
        title="Mensajería"
        description="Conversaciones de WhatsApp y Widget web"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Columna 1 — vistas y canales */}
        <div className="flex w-52 shrink-0 flex-col overflow-hidden border-r">
          <MessagingNav activeView={activeView} onViewChange={setActiveView} />
        </div>

        {/* Columna 2 — lista de conversaciones */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r">
          <ConversationList
            activeView={activeView}
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Columna 3 — vista de conversación */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ConversationView
            conversation={conversations.find((c) => c.id === selectedId)}
          />
        </div>
      </div>
    </>
  )
}
