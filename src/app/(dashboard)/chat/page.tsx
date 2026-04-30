"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ChatSidebar } from "@/components/dashboard/chat/ChatSidebar"
import { ChatView } from "@/components/dashboard/chat/ChatView"
import { mockConversations, type ChatConversation, type ChatMessage } from "@/components/dashboard/chat/data"

export default function ChatPage() {
  const [conversations, setConversations] = React.useState<ChatConversation[]>(mockConversations)
  const [selectedId, setSelectedId]       = React.useState<string | null>(null)

  const selected = conversations.find((c) => c.id === selectedId)

  const handleNew = () => setSelectedId(null)

  const handleSubmit = (prompt: string, _files: File[]) => {
    if (!prompt) return

    if (selectedId) {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: prompt,
        createdAt: "ahora",
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, messages: [...c.messages, userMsg], preview: prompt, lastMessageAt: "ahora" }
            : c
        )
      )
    } else {
      const id = Date.now().toString()
      const newConv: ChatConversation = {
        id,
        title: prompt.length > 48 ? prompt.slice(0, 48) + "…" : prompt,
        lastMessageAt: "ahora",
        dateGroup: "today",
        preview: prompt,
        messages: [{ id: "m1", role: "user", content: prompt, createdAt: "ahora" }],
      }
      setConversations((prev) => [newConv, ...prev])
      setSelectedId(id)
    }
  }

  return (
    <>
      <PageHeader
        icon={SparklesIcon}
        title="Chat IA"
        description="Asistente inteligente para gestión CRM"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Col 1 — historial */}
        <div className="flex w-64 shrink-0 flex-col overflow-hidden border-r">
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNew={handleNew}
          />
        </div>

        {/* Col 2 — chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatView conversation={selected} onSubmit={handleSubmit} />
        </div>
      </div>
    </>
  )
}
