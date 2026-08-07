"use client"

import * as React from "react"
import {
  HandIcon,
  Loader2Icon,
  MessageSquareTextIcon,
  MessagesSquareIcon,
  MicIcon,
  PlusIcon,
  SendIcon,
  SmileIcon,
  SparklesIcon,
  UserPlusIcon,
  ZapIcon,
  UserIcon,
} from "lucide-react"
import { SiFacebook, SiInstagram } from "react-icons/si"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MarkdownContent } from "@/components/dashboard/MarkdownContent"
import { notify } from "@/lib/notify"
import { whatsappService } from "@/services/whatsapp.service"
import { instagramService } from "@/services/instagram.service"
import { facebookService } from "@/services/facebook.service"
import { type Conversation, type ConversationMessage } from "./data"
import { ContactSheet } from "./ContactSheet"

// Servicio a usar para enviar/tomar-control según el canal — WhatsApp, Instagram y Facebook
// comparten el mismo contrato (sendMessageToConversation/takeoverConversation/releaseConversation).
const DIRECT_CHANNEL_SERVICE = {
  whatsapp: whatsappService,
  instagram: instagramService,
  facebook: facebookService,
} as const

// ─── Bubble components ────────────────────────────────────────────────────────

function DateChip({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full border bg-background px-3 py-0.5 text-[10px] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}


function IncomingBubble({
  initials,
  avatarUrl,
  content,
  time,
}: {
  initials: string
  avatarUrl?: string
  content: string
  time: string
}) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-end gap-2">
        <Avatar size="sm" className="shrink-0">
          <AvatarImage src={avatarUrl || "https://github.com/shadcn.png"} alt="" />
          <AvatarFallback className="text-[9px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="max-w-[72%] rounded-2xl rounded-bl-sm border bg-background px-3 py-2 text-[12px] leading-relaxed text-foreground">
          {content}
        </div>
      </div>
      <span className="ml-8 text-[10px] text-muted-foreground">{time}</span>
    </div>
  )
}

function OutgoingBubble({
  content,
  time,
  channel,
  isBot,
}: {
  content: string
  time: string
  channel: Conversation["channel"]
  isBot?: boolean
}) {
  const isWsp = channel === "whatsapp"
  const isIg = channel === "instagram"
  const isFb = channel === "facebook"
  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-end justify-end gap-2">
        <div className={cn(
          "max-w-[72%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-relaxed",
          isBot
            ? "border border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"
            : isWsp
            ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-50"
            : isIg
            ? "bg-pink-100 text-pink-950 dark:bg-pink-950/40 dark:text-pink-50"
            : isFb
            ? "bg-blue-100 text-blue-950 dark:bg-blue-950/40 dark:text-blue-50"
            : "bg-violet-600 text-white"
        )}>
          {isBot && (
            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              <SparklesIcon className="size-2.5" /> Asistente IA
            </p>
          )}
          {isBot ? <MarkdownContent content={content} /> : content}
        </div>
        {isBot ? (
          <Avatar size="sm" className="shrink-0">
            <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              <SparklesIcon className="size-3" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <img src="/images/avatar-contact.svg" alt="Agente" className="size-6 shrink-0 rounded-full" />
        )}
      </div>
      <div className="mr-8 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        {time}
        {isWsp && !isBot && <span className="text-blue-500">✓✓</span>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ConversationViewProps {
  conversation: Conversation | undefined
  loadingMessages?: boolean
  onConversationChange?: (updated: Conversation) => void
}

export function ConversationView({ conversation, loadingMessages = false, onConversationChange }: ConversationViewProps) {
  const [message, setMessage]       = React.useState("")
  const [contactOpen, setContactOpen] = React.useState(false)
  const [sending, setSending]       = React.useState(false)
  const [takeoverLoading, setTakeoverLoading] = React.useState(false)
  const messagesEndRef               = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.id, conversation?.messages.length])

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <MessagesSquareIcon className="size-8 opacity-30" />
        <p className="text-sm">Selecciona una conversación</p>
      </div>
    )
  }

  const isWsp        = conversation.channel === "whatsapp"
  const isIg         = conversation.channel === "instagram"
  const isFb         = conversation.channel === "facebook"
  const channelLabel = isWsp ? "WhatsApp" : isIg ? "Instagram" : isFb ? "Messenger" : conversation.widgetName ?? "Widget web"
  const displayName  = conversation.visitorName ?? `Visitante · ${channelLabel}`
  const isDirect     = isWsp || isIg || isFb
  const windowClosed = isDirect && conversation.windowOpen === false

  async function handleSend() {
    const text = message.trim()
    if (!text || !conversation) return

    if (!isDirect) {
      // Envío real de Widget todavía no implementado en el backend de conversaciones.
      setMessage("")
      return
    }
    if (conversation.windowOpen === false) return

    const service = DIRECT_CHANNEL_SERVICE[conversation.channel as "whatsapp" | "instagram" | "facebook"]
    setSending(true)
    try {
      await service.sendMessageToConversation(Number(conversation.id), text)
      const sentMessage: ConversationMessage = {
        id: `local-${Date.now()}`,
        role: "agent",
        content: text,
        createdAt: "ahora",
      }
      onConversationChange?.({
        ...conversation,
        messages: [...conversation.messages, sentMessage],
        lastMessage: text,
      })
      setMessage("")
    } catch (error) {
      notify.error({
        title: "No se pudo enviar",
        description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
      })
    } finally {
      setSending(false)
    }
  }

  async function handleToggleTakeover() {
    if (!conversation || !isDirect) return
    const service = DIRECT_CHANNEL_SERVICE[conversation.channel as "whatsapp" | "instagram" | "facebook"]
    setTakeoverLoading(true)
    try {
      if (conversation.isAiActive) {
        await service.takeoverConversation(Number(conversation.id))
        notify.info({ title: "Tomaste el control", description: "La IA dejó de responder en esta conversación." })
      } else {
        await service.releaseConversation(Number(conversation.id))
        notify.info({ title: "Se lo devolviste a la IA", description: "El agente IA volvió a responder en esta conversación." })
      }
      onConversationChange?.({ ...conversation, isAiActive: !conversation.isAiActive })
    } catch (error) {
      notify.error({
        title: "No se pudo actualizar la conversación",
        description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
      })
    } finally {
      setTakeoverLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col">

      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
        {/* Avatar */}
        <Avatar className="shrink-0">
          <AvatarImage src={conversation.visitorAvatarUrl || "https://github.com/shadcn.png"} alt="" />
          <AvatarFallback className="text-[12px] font-semibold">
            {conversation.visitorInitials}
          </AvatarFallback>
          {isWsp ? (
            <AvatarBadge className="bg-[#25D366]">
              <img src="/images/WhatsApp.svg" alt="WhatsApp" className="size-2" />
            </AvatarBadge>
          ) : isIg ? (
            <AvatarBadge className="bg-[#E4405F] size-3.5! [&>svg]:size-2.5!">
              <SiInstagram className="text-white" />
            </AvatarBadge>
          ) : isFb ? (
            <AvatarBadge className="bg-[#1877F2] size-3.5! [&>svg]:size-2.5!">
              <SiFacebook className="text-white" />
            </AvatarBadge>
          ) : (
            <AvatarBadge className="bg-blue-600">
              <MessageSquareTextIcon />
            </AvatarBadge>
          )}
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", isWsp ? "bg-[#25D366]" : isIg ? "bg-pink-500" : isFb ? "bg-[#1877F2]" : "bg-blue-600")} />
            {channelLabel}
            {isIg && conversation.visitorUsername && (
              <><span>·</span><span className="truncate">@{conversation.visitorUsername}</span></>
            )}
            {conversation.companyName && (
              <><span>·</span><span className="truncate">{conversation.companyName}</span></>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            title="Ver / agregar contacto"
            onClick={() => setContactOpen(true)}
          >
            {conversation.crmContactId ? (
              <UserIcon className="size-3.5" />
            ) : (
              <UserPlusIcon className="size-3.5" />
            )}
          </Button>
          {isDirect && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title={conversation.isAiActive ? "Tomar control" : "Devolver a IA"}
              disabled={takeoverLoading}
              onClick={handleToggleTakeover}
            >
              {conversation.isAiActive ? (
                <HandIcon className="size-3.5" />
              ) : (
                <SparklesIcon className="size-3.5 text-violet-500" />
              )}
            </Button>
          )}
          {/* Asignar / "..." / Resolver: ocultos hasta que exista asignación y estado reales en el backend */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-muted/20 px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loadingMessages ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn("flex items-end gap-2 animate-pulse", i % 2 === 0 ? "" : "flex-row-reverse")}
            >
              <div className="size-6 shrink-0 rounded-full bg-muted" />
              <div
                className={cn(
                  "h-8 rounded-2xl bg-muted",
                  i % 2 === 0 ? "w-48 rounded-bl-sm" : "w-36 rounded-br-sm"
                )}
              />
            </div>
          ))
        ) : (
        <>
        <DateChip label="Hoy, 28 abr. 2026" />

        {conversation.messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <IncomingBubble
                key={msg.id}
                initials={conversation.visitorInitials}
                avatarUrl={conversation.visitorAvatarUrl}
                content={msg.content}
                time={msg.createdAt}
              />
            )
          }
          if (msg.role === "bot") {
            return (
              <OutgoingBubble
                key={msg.id}
                content={msg.content}
                time={msg.createdAt}
                channel={conversation.channel}
                isBot
              />
            )
          }
          if (msg.role === "agent") {
            return (
              <OutgoingBubble
                key={msg.id}
                content={msg.content}
                time={msg.createdAt}
                channel={conversation.channel}
              />
            )
          }
          return null
        })}

        <div ref={messagesEndRef} />
        </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t bg-background">
        {/* Channel pill */}
        <div className="flex items-center gap-2 px-4 pt-2.5">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              isWsp
                ? "border-[#25D366] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                : isIg
                ? "border-pink-400 bg-pink-50 text-pink-700 dark:bg-pink-950/30"
                : isFb
                ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30"
                : "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30"
            )}
          >
            {isWsp ? (
              <img src="/images/WhatsApp.svg" alt="" className="size-3" />
            ) : isIg ? (
              <SiInstagram className="size-3" />
            ) : isFb ? (
              <SiFacebook className="size-3" />
            ) : (
              <MessageSquareTextIcon className="size-3" />
            )}
            {channelLabel}
          </button>
        </div>

        {/* Textarea */}
        <div className="px-4 py-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={windowClosed || sending}
            placeholder={
              sending
                ? "Enviando..."
                : windowClosed
                ? "Ventana de 24h cerrada — solo puedes reabrir con un template"
                : `Escribe un mensaje por ${channelLabel}...`
            }
            rows={2}
            className="w-full resize-none bg-transparent text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        {/* Footer tools */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
              <PlusIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
              <SmileIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
              <MicIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 text-violet-500 hover:text-violet-600">
              <ZapIcon className="size-3.5" />
            </Button>
          </div>
          <Button
            size="sm"
            className={cn(
              "h-7 gap-1.5 text-xs text-white",
              isWsp
                ? "bg-[#25D366] hover:bg-[#1aab52]"
                : isIg
                ? "bg-linear-to-br from-purple-500 to-pink-500 hover:opacity-90"
                : isFb
                ? "bg-[#1877F2] hover:bg-[#1565d8]"
                : "bg-violet-600 hover:bg-violet-700"
            )}
            disabled={!message.trim() || sending || windowClosed}
            onClick={handleSend}
          >
            {sending ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : (
              <SendIcon className="size-3" />
            )}
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      <ContactSheet
        open={contactOpen}
        onOpenChange={setContactOpen}
        conversation={conversation}
      />
    </div>
  )
}
