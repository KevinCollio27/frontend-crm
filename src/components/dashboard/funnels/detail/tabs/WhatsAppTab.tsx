"use client"

import * as React from "react"
import { HandIcon, LayoutTemplateIcon, Loader2Icon, MessageCircleIcon, MessageCircleOffIcon, SendIcon, SparklesIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { whatsappService } from "@/services/whatsapp.service"
import { normalizeWhatsAppRecipient } from "@/lib/whatsapp-phone"
import { useSendActions } from "@/hooks/useSendActions"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { mapWhatsAppConversation } from "@/components/dashboard/messaging/data"
import type { Conversation, ConversationMessage } from "@/components/dashboard/messaging/data"
import { SendTemplateSheet } from "@/components/dashboard/contacts/SendTemplateSheet"
import { SendTemplateToConversationSheet } from "@/components/dashboard/messaging/SendTemplateToConversationSheet"

// ─── Bubbles ──────────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <div className="max-w-[75%] rounded-2xl rounded-bl-sm border bg-background px-3 py-2 text-[12px] leading-relaxed text-foreground">
          {msg.content}
        </div>
        <span className="text-[10px] text-muted-foreground">{msg.createdAt}</span>
      </div>
    )
  }

  const isBot = msg.role === "bot"
  return (
    <div className="flex flex-col items-end gap-0.5">
      <div
        className={cn(
          "max-w-[75%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-relaxed",
          isBot
            ? "border border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"
            : "bg-emerald-100 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-50"
        )}
      >
        {isBot && (
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
            <SparklesIcon className="size-2.5" /> Asistente IA
          </p>
        )}
        {msg.content}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {msg.createdAt}
        {!isBot && <span className="text-blue-500">✓✓</span>}
      </div>
    </div>
  )
}

// ─── Estado 1 — sin conversación todavía ───────────────────────────────────────

function NoConversation({
  approvedTemplatesCount,
  onSendTemplate,
}: {
  approvedTemplatesCount: number
  onSendTemplate: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <MessageCircleIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Todavía no hay conversación con este contacto</p>
        <p className="text-xs text-muted-foreground">
          Para iniciar por WhatsApp necesitas enviar una plantilla aprobada — el contacto puede responder después y verás la conversación acá.
        </p>
      </div>
      <Button size="sm" className="mt-1 gap-1.5 bg-[#25D366] text-white hover:bg-[#20b857]" onClick={onSendTemplate} disabled={approvedTemplatesCount === 0}>
        <LayoutTemplateIcon className="size-3.5" />
        Enviar plantilla
      </Button>
      {approvedTemplatesCount === 0 && (
        <p className="text-xs text-destructive">No hay plantillas aprobadas — crea una en Configuración → Plantillas.</p>
      )}
    </div>
  )
}

function NoPhone() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <MessageCircleOffIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Este contacto no tiene teléfono</p>
        <p className="text-xs text-muted-foreground">Agrégale un teléfono al contacto para poder escribirle por WhatsApp.</p>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  opportunityId:  number
  personId:       number | null
  contactName:    string | null
  contactPhone:   string | null
  contactCountry: string
}

export function WhatsAppTab({ opportunityId, personId, contactName, contactPhone, contactCountry }: Props) {
  const { approvedTemplates } = useSendActions()
  // undefined = cargando, null = no hay conversación todavía
  const [conversation, setConversation] = React.useState<Conversation | null | undefined>(undefined)
  const [message, setMessage]           = React.useState("")
  const [sending, setSending]           = React.useState(false)
  const [takeoverLoading, setTakeoverLoading] = React.useState(false)
  const [templateSheetOpen, setTemplateSheetOpen] = React.useState(false)
  const [reopenSheetOpen, setReopenSheetOpen]      = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Igual que SendTemplateSheet: completa el código de país antes de consultar — si se
  // busca con el teléfono crudo (ej. sin el "56"), no matchea el from_number normalizado
  // con el que quedó guardada la conversación al mandar la plantilla, y el tab muestra
  // "sin conversación" aunque sí exista.
  const recipient = React.useMemo(
    () => (contactPhone ? normalizeWhatsAppRecipient(contactPhone, contactCountry) : null),
    [contactPhone, contactCountry]
  )

  const refresh = React.useCallback(() => {
    if (!recipient) {
      setConversation(null)
      return Promise.resolve()
    }
    return whatsappService.getConversationByNumber(recipient)
      .then((raw) => setConversation(raw ? mapWhatsAppConversation(raw) : null))
      .catch(() => setConversation(null))
  }, [recipient])

  React.useEffect(() => {
    setConversation(undefined)
    refresh()
  }, [refresh])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages.length])

  // El backend solo manda el id en el evento — si es la conversación que ya tenemos
  // abierta, refetch puntual; si todavía no teníamos ninguna, puede ser que recién se
  // haya creado (ej. alguien le mandó una plantilla desde otro lado) — reconsulta por número.
  useEntityRealtime("whatsapp_conversation", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (!changedId) return
    if (conversation && String(changedId) === conversation.id) {
      whatsappService.getConversation(changedId)
        .then((raw) => setConversation(mapWhatsAppConversation(raw)))
        .catch(() => {})
    } else if (!conversation) {
      refresh()
    }
  })

  async function handleSend() {
    const text = message.trim()
    if (!text || !conversation) return
    setSending(true)
    try {
      await whatsappService.sendMessageToConversation(Number(conversation.id), text)
      const sentMessage: ConversationMessage = { id: `local-${Date.now()}`, role: "agent", content: text, createdAt: "ahora" }
      setConversation({ ...conversation, messages: [...conversation.messages, sentMessage], lastMessage: text })
      setMessage("")
    } catch (error) {
      notify.error({ title: "No se pudo enviar", description: (error as { message?: string })?.message ?? "Intenta de nuevo." })
    } finally {
      setSending(false)
    }
  }

  async function handleToggleTakeover() {
    if (!conversation) return
    setTakeoverLoading(true)
    try {
      if (conversation.isAiActive) {
        await whatsappService.takeoverConversation(Number(conversation.id))
        notify.info({ title: "Tomaste el control", description: "La IA dejó de responder en esta conversación." })
      } else {
        await whatsappService.releaseConversation(Number(conversation.id))
        notify.info({ title: "Se lo devolviste a la IA", description: "El agente IA volvió a responder en esta conversación." })
      }
      setConversation({ ...conversation, isAiActive: !conversation.isAiActive })
    } catch (error) {
      notify.error({ title: "No se pudo actualizar la conversación", description: (error as { message?: string })?.message ?? "Intenta de nuevo." })
    } finally {
      setTakeoverLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!contactPhone) {
    return <div className="p-4"><NoPhone /></div>
  }

  if (conversation === undefined) {
    return (
      <div className="flex justify-center p-8">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="p-4">
        <NoConversation approvedTemplatesCount={approvedTemplates.length} onSendTemplate={() => setTemplateSheetOpen(true)} />
        <SendTemplateSheet
          open={templateSheetOpen}
          onOpenChange={(open) => { setTemplateSheetOpen(open); if (!open) refresh() }}
          contactName={contactName ?? "Contacto"}
          phone={contactPhone}
          country={contactCountry}
          templates={approvedTemplates}
          personId={personId ?? undefined}
          opportunityId={opportunityId}
        />
      </div>
    )
  }

  const windowClosed = conversation.windowOpen === false

  return (
    <div className="flex flex-col gap-3 p-4">

      {/* Header — estado + tomar/devolver control */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-3.5 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", windowClosed ? "bg-muted-foreground" : "bg-[#25D366]")} />
          {conversation.visitorName ?? contactPhone}
          <span>·</span>
          {windowClosed ? "Ventana de 24h cerrada" : "Ventana abierta"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-xs"
          disabled={takeoverLoading}
          onClick={handleToggleTakeover}
        >
          {conversation.isAiActive ? <HandIcon className="size-3.5" /> : <SparklesIcon className="size-3.5 text-violet-500" />}
          {conversation.isAiActive ? "Tomar control" : "Devolver a IA"}
        </Button>
      </div>

      {/* Mensajes */}
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 px-3.5 py-3">
        {conversation.messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Sin mensajes todavía.</p>
        ) : (
          conversation.messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={windowClosed || sending}
          placeholder={
            sending
              ? "Enviando..."
              : windowClosed
              ? "Ventana de 24h cerrada — reabre con una plantilla"
              : "Escribe un mensaje por WhatsApp..."
          }
          rows={3}
          className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <div className="flex items-center justify-between border-t px-3.5 py-2.5">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs" onClick={() => setReopenSheetOpen(true)}>
            <LayoutTemplateIcon className="size-3" />
            Plantilla
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-[#25D366] px-4 text-xs text-white hover:bg-[#20b857]"
            disabled={!message.trim() || sending || windowClosed}
            onClick={handleSend}
          >
            {sending ? <Loader2Icon className="size-3 animate-spin" /> : <SendIcon className="size-3" />}
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      <SendTemplateToConversationSheet
        open={reopenSheetOpen}
        onOpenChange={setReopenSheetOpen}
        conversationId={Number(conversation.id)}
        templates={approvedTemplates}
        onSent={(content, template) => {
          const sentMessage: ConversationMessage = { id: `local-${Date.now()}`, role: "agent", content, createdAt: "ahora", template }
          setConversation({ ...conversation, messages: [...conversation.messages, sentMessage], lastMessage: content, windowOpen: true })
        }}
      />
    </div>
  )
}
