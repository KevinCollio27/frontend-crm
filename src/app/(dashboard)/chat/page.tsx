"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ChatSidebar } from "@/components/dashboard/chat/ChatSidebar"
import { ChatView } from "@/components/dashboard/chat/ChatView"
import { type ChatConversation, type ChatMessage, type ChatDateGroup } from "@/components/dashboard/chat/data"
import { notify } from "@/lib/notify"
import { aiChatService } from "@/services/ai-chat.service"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { AiConversationGrouped, AiConversationListItem } from "@/types/ai-chat"

function groupedToList(grouped: AiConversationGrouped): ChatConversation[] {
  const entries: [ChatDateGroup, AiConversationListItem[]][] = [
    ["today", grouped.today],
    ["yesterday", grouped.yesterday],
    ["thisWeek", grouped.thisWeek],
    ["thisMonth", grouped.thisMonth],
    ["older", grouped.older],
  ]
  return entries.flatMap(([group, items]) =>
    items.map((item) => ({
      id: String(item.id),
      title: item.title,
      lastMessageAt: item.last_message_at,
      dateGroup: group,
      preview: item.last_message_preview ?? "",
      messages: [],
    }))
  )
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = React.useState<ChatConversation[]>([])
  const [selectedId, setSelectedId]       = React.useState<string | null>(null)
  const [currentMessages, setCurrentMessages] = React.useState<ChatMessage[]>([])
  const [sending, setSending]             = React.useState(false)

  const isMobile = useIsMobile()
  // Lista (historial) ⇄ Chat en mobile — a diferencia de Mensajería/Correo, acá se
  // arranca en el chat (mismo prompt vacío que ya se ve en desktop), no en la lista.
  const [mobileShowChat, setMobileShowChat] = React.useState(true)

  React.useEffect(() => {
    const welcome = searchParams.get("welcome")

    if (welcome === "workspace-deleted") {
      const name = searchParams.get("name")
      notify.success({
        title: "Workspace eliminado con éxito",
        description: name ? `Te dimos la bienvenida a "${name}".` : "Te cambiamos a otro de tus workspaces.",
      })
      router.replace("/chat")
      return
    }

    if (welcome !== "1") return
    notify.success({
      title: "¡Tu workspace está listo!",
      description: "Ya puedes empezar a gestionar tus ventas.",
    })
    router.replace("/chat")
  }, [searchParams, router])

  const loadConversations = React.useCallback(async () => {
    try {
      const grouped = await aiChatService.listConversations()
      setConversations(groupedToList(grouped))
    } catch (err) {
      console.error("[ChatPage] Error cargando conversaciones:", err)
    }
  }, [])

  React.useEffect(() => { loadConversations() }, [loadConversations])

  const handleSelect = async (id: string | null) => {
    if (isMobile) setMobileShowChat(true)
    if (id === selectedId) return
    setSelectedId(id)
    setCurrentMessages([])
    if (!id) return
    try {
      const detail = await aiChatService.getConversation(Number(id))
      setCurrentMessages(
        detail.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            id: String(m.id),
            role: m.role as "user" | "assistant",
            content: m.content,
            createdAt: m.created_at,
          }))
      )
    } catch {
      toast.error("No se pudo cargar la conversación")
    }
  }

  const handleNew = () => {
    if (isMobile) setMobileShowChat(true)
    setSelectedId(null)
    setCurrentMessages([])
  }

  const handleSubmit = async (prompt: string, _files: File[]) => {
    if (!prompt.trim() || sending) return
    setSending(true)

    const userMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: prompt,
      createdAt: "ahora",
    }
    const history = [...currentMessages, userMsg]
    setCurrentMessages(history)

    try {
      const response = await aiChatService.chat({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        conversationId: selectedId ? Number(selectedId) : undefined,
      })

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response.content,
        createdAt: "ahora",
      }
      setCurrentMessages((prev) => [...prev, assistantMsg])

      const newId = String(response.conversationId)
      if (selectedId !== newId) setSelectedId(newId)

      await loadConversations()
    } catch {
      toast.error("Error al enviar el mensaje")
      setCurrentMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await aiChatService.deleteConversation(Number(id))
      if (selectedId === id) handleNew()
      setConversations((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error("No se pudo eliminar la conversación")
    }
  }

  const handleRename = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return
    try {
      await aiChatService.updateTitle(Number(id), newTitle.trim())
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
      )
    } catch {
      toast.error("No se pudo renombrar la conversación")
    }
  }

  const selectedConv = conversations.find((c) => c.id === selectedId)

  const conversationForView: ChatConversation | undefined =
    currentMessages.length === 0 && selectedId === null
      ? undefined
      : {
          id: selectedId ?? "new",
          title: selectedConv?.title ?? "Nueva conversación",
          lastMessageAt: selectedConv?.lastMessageAt ?? "",
          dateGroup: "today" as ChatDateGroup,
          preview: selectedConv?.preview ?? "",
          messages: currentMessages,
        }

  return (
    <>
      <PageHeader
        icon={SparklesIcon}
        title="Chat IA"
        description="Asistente inteligente para gestión CRM"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Col 1 — historial. En mobile, pantalla completa y solo cuando se abre
            explícitamente desde el botón "Historial" del chat. */}
        <div className={cn(
          "w-full shrink-0 flex-col overflow-hidden border-r md:flex md:w-64",
          mobileShowChat ? "hidden md:flex" : "flex"
        )}>
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
            onRename={handleRename}
            onBack={isMobile ? () => setMobileShowChat(true) : undefined}
          />
        </div>
        {/* Col 2 — chat. Es el default en mobile (mismo prompt vacío que en desktop). */}
        <div className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden md:flex",
          mobileShowChat ? "flex" : "hidden md:flex"
        )}>
          <ChatView
            conversation={conversationForView}
            onSubmit={handleSubmit}
            sending={sending}
            onOpenHistory={isMobile ? () => setMobileShowChat(false) : undefined}
          />
        </div>
      </div>
    </>
  )
}
