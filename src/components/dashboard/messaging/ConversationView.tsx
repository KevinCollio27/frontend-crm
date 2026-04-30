"use client"

import * as React from "react"
import {
  CheckCircle2Icon,
  MessagesSquareIcon,
  MicIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SendIcon,
  SmileIcon,
  UserPlusIcon,
  UsersIcon,
  ZapIcon,
  UserIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type Conversation,
  AVATAR_COLOR_CLASSES,
  STATUS_CONFIG,
} from "./data"
import { ContactSheet } from "./ContactSheet"

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
  avatarColor,
  content,
  time,
  isBot,
}: {
  initials: string
  avatarColor: Conversation["visitorAvatarColor"]
  content: string
  time: string
  isBot?: boolean
}) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-end gap-2">
        <div className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
          isBot ? "bg-violet-100 text-violet-700" : AVATAR_COLOR_CLASSES[avatarColor]
        )}>
          {isBot ? "IA" : initials}
        </div>
        <div className={cn(
          "max-w-[72%] rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] leading-relaxed",
          isBot
            ? "border border-violet-200 bg-violet-50 text-violet-900 dark:bg-violet-950/30 dark:text-violet-200"
            : "border bg-background text-foreground"
        )}>
          {isBot && (
            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-violet-600">
              <ZapIcon className="size-2.5" /> Asistente IA
            </p>
          )}
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
}: {
  content: string
  time: string
  channel: Conversation["channel"]
}) {
  const isWsp = channel === "whatsapp"
  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-end justify-end gap-2">
        <div className={cn(
          "max-w-[72%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-relaxed",
          isWsp ? "bg-[#DCF8C6] text-[#1a3a1a]" : "bg-violet-600 text-white"
        )}>
          {content}
        </div>
        <img src="/images/avatar-contact.svg" alt="Agente" className="size-6 shrink-0 rounded-full" />
      </div>
      <div className="mr-8 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        {time}
        {isWsp && <span className="text-blue-500">✓✓</span>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ConversationViewProps {
  conversation: Conversation | undefined
}

export function ConversationView({ conversation }: ConversationViewProps) {
  const [message, setMessage]       = React.useState("")
  const [contactOpen, setContactOpen] = React.useState(false)
  const messagesEndRef               = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.id])

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <MessagesSquareIcon className="size-8 opacity-30" />
        <p className="text-sm">Selecciona una conversación</p>
      </div>
    )
  }

  const displayName  = conversation.visitorName ?? `Visitante · ${conversation.widgetName ?? "Widget"}`
  const statusCfg    = STATUS_CONFIG[conversation.status]
  const isWsp        = conversation.channel === "whatsapp"

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      setMessage("")
    }
  }

  return (
    <div className="flex h-full flex-col">

      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn(
            "flex size-8 items-center justify-center rounded-full text-[12px] font-semibold",
            AVATAR_COLOR_CLASSES[conversation.visitorAvatarColor]
          )}>
            {conversation.visitorInitials}
          </div>
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-[1.5px] border-background",
            isWsp ? "bg-[#25D366]" : "bg-violet-600"
          )}>
            <img
              src={isWsp ? "/images/WhatsApp.svg" : "/images/Asistente AI.svg"}
              alt={isWsp ? "WhatsApp" : "Widget"}
              className="size-2"
            />
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", isWsp ? "bg-[#25D366]" : "bg-violet-600")} />
            {isWsp ? "WhatsApp" : conversation.widgetName ?? "Widget web"}
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
          <Button variant="ghost" size="icon" className="size-7" title="Asignar">
            <UsersIcon className="size-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
              <MoreHorizontalIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem>Silenciar</DropdownMenuItem>
              <DropdownMenuItem>Bloquear</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Eliminar conversación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2Icon className="size-3" />
            Resolver
          </Button>
        </div>
      </div>

      {/* Assign bar */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/40 px-4 py-1.5 text-[11px] text-muted-foreground">
        <UsersIcon className="size-3 shrink-0" />
        Asignado a:
        <div className="flex size-4 items-center justify-center rounded-full bg-violet-100 text-[8px] font-semibold text-violet-700">
          KC
        </div>
        <span className="font-medium text-foreground">Kevin Collio</span>
        <span className="text-border">·</span>
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
          statusCfg.className
        )}>
          {statusCfg.label}
        </span>
        <span className="text-border">·</span>
        <span>{conversation.lastMessageAt}</span>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-muted/20 px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DateChip label="Hoy, 28 abr. 2026" />

        {conversation.messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <IncomingBubble
                key={msg.id}
                initials={conversation.visitorInitials}
                avatarColor={conversation.visitorAvatarColor}
                content={msg.content}
                time={msg.createdAt}
              />
            )
          }
          if (msg.role === "bot") {
            return (
              <IncomingBubble
                key={msg.id}
                initials="IA"
                avatarColor="purple"
                content={msg.content}
                time={msg.createdAt}
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
                : "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/30"
            )}
          >
            <img
              src={isWsp ? "/images/WhatsApp.svg" : "/images/Asistente AI.svg"}
              alt=""
              className="size-3"
            />
            {isWsp ? "WhatsApp" : "Widget"}
          </button>
        </div>

        {/* Textarea */}
        <div className="px-4 py-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe un mensaje por ${isWsp ? "WhatsApp" : "Widget"}...`}
            rows={2}
            className="w-full resize-none bg-transparent text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
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
                : "bg-violet-600 hover:bg-violet-700"
            )}
            disabled={!message.trim()}
            onClick={() => setMessage("")}
          >
            <SendIcon className="size-3" />
            Enviar
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
