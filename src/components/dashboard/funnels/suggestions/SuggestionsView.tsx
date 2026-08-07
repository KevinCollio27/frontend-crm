"use client"

import * as React from "react"
import DOMPurify from "dompurify"
import {
  ArrowRightIcon,
  Building2Icon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  FileTextIcon,
  MapPinIcon,
  MessageSquarePlusIcon,
  PaperclipIcon,
  PencilIcon,
  RefreshCwIcon,
  SendIcon,
  SettingsIcon,
  SparklesIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
  UserIcon,
  WalletIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getInitials } from "@/lib/table-utils"
import { useActiveIntegration } from "@/hooks/useActiveIntegration"
import { activityService } from "@/services/activity.service"
import { integrationService } from "@/services/integration.service"
import { opportunityService } from "@/services/opportunity.service"
import { opportunitySuggestionService } from "@/services/opportunitySuggestion.service"
import { notify, opportunityNotify, suggestionNotify } from "@/lib/notify"
import { useSessionStore } from "@/store/session.store"
import type { WorkspaceIntegrationRaw } from "@/types/integration"
import { AiSuggestionsActivationSheet } from "./AiSuggestionsActivationSheet"
import { PRIORITY_CONFIG, SIGNAL_CONFIG, type Priority } from "./mock-data"
import type { PendingActivityItem, RealCalendarDraft, RealEmailDraft, SuggestionAction, SuggestionGroup } from "./types"

// Col 1/2/3 conectadas a datos reales + Aplicar/Descartar reales (paso 12 del
// plan). Cada tipo de acción llama al endpoint real que ya existía en el
// resto del CRM (Gmail/Calendar/opportunity won-lost/opportunity-activity) —
// nada de eso se duplicó acá, solo se orquesta. "Reprogramar" en Actividades
// queda visual todavía: el endpoint real de actividades exige mandar
// title+date_from+date_to+responsible juntos (si se omite date_to lo pone en
// null), así que reprogramar bien requiere más que un date picker suelto —
// se deja para una vuelta aparte en vez de arriesgar corromper la actividad.

const PRIORITY_RANK: Record<Priority, number> = { Alta: 0, Media: 1, Baja: 2 }

function daysAgoLabel(days: number): string {
  if (days === 0) return "hoy"
  if (days === 1) return "hace 1 día"
  return `hace ${days} días`
}

function parseDurationMinutes(duration: string): number {
  const match = duration.match(/(\d+)/)
  return match ? Number(match[1]) : 30
}

function errorMessage(err: unknown): string | undefined {
  return (err as { message?: string } | undefined)?.message
}

function SuggestionCard({
  suggestion,
  selected,
  onClick,
}: {
  suggestion: SuggestionGroup
  selected: boolean
  onClick: () => void
}) {
  const signalConf = SIGNAL_CONFIG[suggestion.signal]
  const SignalIcon = signalConf.icon
  const subtitle = [suggestion.organizationName, suggestion.contactName].filter(Boolean).join(" · ")

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-2 border-b px-3.5 py-3 text-left transition-colors hover:bg-muted/50",
        selected && "bg-muted"
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <SparklesIcon className="size-3" /> IA · {daysAgoLabel(suggestion.daysAgo)}
        </span>
        <Badge className={cn("shrink-0 rounded-full px-2 py-0 text-[0.65rem] font-medium", PRIORITY_CONFIG[suggestion.priority])}>
          {suggestion.priority}
        </Badge>
      </div>

      <div className="space-y-0.5">
        <p className="truncate text-sm font-semibold">{suggestion.opportunityName}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <p className={cn("flex items-center gap-1.5 text-xs font-medium", signalConf.textClassName)}>
        <SignalIcon className="size-3.5" /> {signalConf.label}
      </p>

      <div className="flex items-center gap-1.5 border-t pt-2">
        <Avatar className="size-5 shrink-0">
          <AvatarImage src="https://github.com/shadcn.png" alt={suggestion.responsible} />
          <AvatarFallback className="text-[9px] font-semibold">{getInitials(suggestion.responsible)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-xs text-muted-foreground">{suggestion.responsible}</span>
      </div>
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function SnapshotRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function ContextPanel({ suggestion, onSelectAction }: { suggestion: SuggestionGroup; onSelectAction: () => void }) {
  const signalConf = SIGNAL_CONFIG[suggestion.signal]
  const SignalIcon = signalConf.icon
  const primaryAction = suggestion.actions[0]

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-4 space-y-1">
        <h3 className="text-sm font-semibold">{suggestion.opportunityName}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {suggestion.organizationName && (
            <span className="flex items-center gap-1">
              <Building2Icon className="size-3.5" /> {suggestion.organizationName}
            </span>
          )}
          {suggestion.contactName && (
            <span className="flex items-center gap-1">
              <UserIcon className="size-3.5" /> {suggestion.contactName}
            </span>
          )}
          {suggestion.stageName && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3.5" />
              {suggestion.stageName}
              {suggestion.stageOrder && suggestion.stageTotal ? ` (etapa ${suggestion.stageOrder} de ${suggestion.stageTotal})` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 divide-y rounded-lg border px-3">
        {suggestion.amount && <SnapshotRow icon={WalletIcon} label="Monto" value={suggestion.amount} />}
        <SnapshotRow icon={UserIcon} label="Responsable" value={suggestion.responsible} />
        <SnapshotRow icon={CalendarIcon} label="Creada" value={daysAgoLabel(suggestion.createdDaysAgo)} />
        <SnapshotRow icon={ClockIcon} label="Último movimiento" value={daysAgoLabel(suggestion.daysAgo)} />
      </div>

      <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
        <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
          <SparklesIcon className="size-3" /> Motivo
        </p>
        <p className="text-sm">{suggestion.reason}</p>
      </div>

      <div className="mb-4">
        <SectionLabel>Señal detectada</SectionLabel>
        <div className={cn("flex items-start gap-2 rounded-lg border p-3", signalConf.cardClassName)}>
          <div className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", signalConf.className)}>
            <SignalIcon className="size-3.5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{signalConf.label}</p>
            <p className="text-xs text-muted-foreground">{suggestion.signalDetail}</p>
          </div>
        </div>
      </div>

      {suggestion.formSubmission && (
        <Collapsible className="mb-4 overflow-hidden rounded-lg border">
          <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted/40">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <FileTextIcon className="size-3.5 text-muted-foreground" />
              Formulario completado
              <span className="text-muted-foreground">
                — {suggestion.formSubmission.formName} · {suggestion.formSubmission.submittedAt}
              </span>
            </span>
            <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y border-t">
              {suggestion.formSubmission.fields.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-muted-foreground">
                  Sin campos adicionales — solo dejó sus datos de contacto.
                </p>
              ) : (
                suggestion.formSubmission.fields.map((f, i) => (
                  <div key={i} className="px-3 py-2.5">
                    <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">{f.label}</p>
                    <p className="text-sm">{f.value}</p>
                  </div>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="mb-4">
        <SectionLabel>Línea de tiempo reciente</SectionLabel>
        {suggestion.timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin actividad registrada.</p>
        ) : (
          <div className="space-y-2 border-l pl-3">
            {suggestion.timeline.map((event, i) => (
              <div key={i} className="relative text-xs">
                <span className="absolute top-1 -left-3.75 size-1.5 rounded-full bg-muted-foreground" />
                <span className="font-medium text-muted-foreground">{event.date}</span>{" "}
                <span>{event.label}</span>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground italic">
              — sin más movimiento desde entonces ({daysAgoLabel(suggestion.daysAgo)}) —
            </p>
          </div>
        )}
      </div>

      {primaryAction && (
        <Button type="button" variant="outline" size="sm" className="w-full justify-between" onClick={onSelectAction}>
          Sugerencia: {primaryAction.suggestedActionLabel}
          <ArrowRightIcon className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

function ActionHeader({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <SparklesIcon className="size-3.5" /> Sugerido por IA
      </span>
      <Button type="button" size="sm" variant={editing ? "default" : "outline"} onClick={onToggle}>
        <PencilIcon className="size-3.5" /> {editing ? "Vista previa" : "Editar"}
      </Button>
    </div>
  )
}

// Cuando una señal tiene más de una acción relevante (ej. Correo + Calendario
// para "sin movimiento"), se muestran como chips arriba del panel — cada una
// independiente, no hace falta elegir una sola.
function ActionChips({
  actions,
  activeIndex,
  onSelect,
}: {
  actions: SuggestionAction[]
  activeIndex: number
  onSelect: (i: number) => void
}) {
  if (actions.length < 2) return null
  const ACTION_CHIP_LABEL: Record<SuggestionAction["actionType"], string> = {
    email: "Correo",
    calendar_event: "Calendario",
    status_action: "Estado",
    activity_task: "Tareas",
  }
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b px-4 py-2">
      {actions.map((a, i) => (
        <button
          key={a.suggestionId}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            i === activeIndex ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
        >
          {ACTION_CHIP_LABEL[a.actionType]}
        </button>
      ))}
    </div>
  )
}

// Bloqueado por defecto porque lo redactó la IA — recién al presionar "Editar" se
// habilitan Para/Asunto/Mensaje. "De" nunca es editable (es quien envía). Adjuntar y
// Enviar quedan siempre habilitados — no hace falta editar para mandar el borrador tal cual.
function EmailActionPanel({
  suggestionId,
  draft,
  userContext,
  opportunityId,
  onApplied,
  onDismissed,
  onRegenerated,
}: {
  suggestionId: number
  draft: RealEmailDraft
  userContext: string | null
  opportunityId: number
  onApplied: () => Promise<void>
  onDismissed: () => Promise<void>
  onRegenerated: (draft: RealEmailDraft, context: string) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [to, setTo] = React.useState(draft.to ?? "")
  const [subject, setSubject] = React.useState(draft.subject)
  const [body, setBody] = React.useState(draft.body)
  const [sending, setSending] = React.useState(false)
  const [discarding, setDiscarding] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [showContextBox, setShowContextBox] = React.useState(false)
  const [contextInput, setContextInput] = React.useState(userContext ?? "")
  const [regenerating, setRegenerating] = React.useState(false)
  const locked = !editing
  const { connection: gmail, loading: gmailLoading } = useActiveIntegration("gmail")
  const currentUser = useSessionStore((s) => s.user)
  // El "De:"/firma NO usa draft.signatureName/signatureEmail — eso es el
  // responsable resuelto al momento de la detección (puede ser otra persona,
  // ej. el fallback al dueño del workspace). Quien realmente envía es quien
  // apretó "Enviar" con SU PROPIA cuenta de Gmail conectada — mostrar otro
  // nombre acá sería una identidad falsa en el correo real.
  const senderName = currentUser?.name ?? draft.signatureName
  const senderEmail = gmail?.account_email ?? currentUser?.email ?? draft.signatureEmail

  // Firma REAL de Gmail (la misma que ya usa CorreoTab.tsx) — no la fabricamos
  // nosotros, se trae de la cuenta conectada para que lo que se ve en el
  // panel sea lo mismo que se agrega al correo de verdad.
  const [signatureHtml, setSignatureHtml] = React.useState<string | undefined>(undefined)
  React.useEffect(() => {
    if (!gmail) return
    integrationService.getGmailSignature(gmail.id).then(setSignatureHtml).catch(() => {})
  }, [gmail])

  async function handleSend() {
    if (!to.trim()) {
      notify.warning({ title: "Falta destinatario", description: "Agrega un correo de destino antes de enviar." })
      return
    }
    if (!gmail) {
      suggestionNotify.noIntegration("Gmail")
      return
    }
    setSending(true)
    try {
      await integrationService.sendGmailMessage(gmail.id, { to, subject, body, signatureHtml, opportunityId })
      suggestionNotify.emailSent()
      await onApplied()
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  async function handleDiscard() {
    setDiscarding(true)
    try {
      await onDismissed()
    } finally {
      setDiscarding(false)
    }
  }

  // Manda el borrador a la cuenta de quien está probando, para ver cómo queda
  // de verdad — SIN opportunityId (no se registra en opportunity_email de la
  // oportunidad real, para no ensuciar el historial ni el motor de detección,
  // que usa esa tabla como fuente de verdad de "se le hizo seguimiento") y sin
  // marcar la sugerencia como aplicada — sigue disponible después de probar.
  async function handleTestSend() {
    if (!currentUser?.email) return
    if (!gmail) {
      suggestionNotify.noIntegration("Gmail")
      return
    }
    setTesting(true)
    try {
      await integrationService.sendGmailMessage(gmail.id, { to: currentUser.email, subject: `[Prueba] ${subject}`, body, signatureHtml })
      notify.success({ title: "Correo de prueba enviado", description: `Revisa ${currentUser.email}.` })
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setTesting(false)
    }
  }

  // El equipo conoce el caso puntual mejor que la regla general del signal_type
  // (ej. "esto es una postulación a un evento, no venta") — la nota tiene prioridad
  // sobre la interpretación por defecto en el próximo redactado.
  async function handleRegenerate() {
    if (!contextInput.trim()) return
    setRegenerating(true)
    try {
      const newDraft = await opportunitySuggestionService.regenerate(suggestionId, contextInput.trim()) as RealEmailDraft
      setSubject(newDraft.subject)
      setBody(newDraft.body)
      if (!to) setTo(newDraft.to ?? "")
      onRegenerated(newDraft, contextInput.trim())
      setShowContextBox(false)
      notify.success({ title: "Borrador regenerado", description: "Se redactó de nuevo con tu contexto." })
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ActionHeader editing={editing} onToggle={() => setEditing((v) => !v)} />

      {showContextBox && (
        <div className="space-y-2 border-b bg-muted/20 p-3">
          <textarea
            className="min-h-16 w-full resize-none rounded-md border bg-background p-2 text-xs outline-none"
            placeholder='Ej: "Esto es una postulación a un evento, no una venta — agradece la participación en vez de ofrecer algo."'
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowContextBox(false)} disabled={regenerating}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleRegenerate} disabled={regenerating || !contextInput.trim()}>
              {regenerating ? "Regenerando..." : "Regenerar con este contexto"}
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm">
          <span className="w-14 shrink-0 text-muted-foreground">De:</span>
          <span className="truncate font-medium">{senderEmail}</span>
        </div>
        <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm">
          <span className="w-14 shrink-0 text-muted-foreground">Para:</span>
          {locked ? (
            to ? (
              <span className="truncate font-medium">{to}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Sin destinatario — presiona Editar para agregarlo</span>
            )
          ) : (
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              value={to}
              placeholder="Agregar destinatario..."
              onChange={(e) => setTo(e.target.value)}
            />
          )}
        </div>
        <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm">
          <span className="w-14 shrink-0 text-muted-foreground">Asunto:</span>
          {locked ? (
            <span className="truncate font-medium">{subject}</span>
          ) : (
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          )}
        </div>

        <div className="px-4 py-3">
          {locked ? (
            <p className="text-sm whitespace-pre-wrap">{body}</p>
          ) : (
            <textarea
              className="min-h-40 w-full resize-none bg-transparent text-sm outline-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
        </div>

        <div className="px-4 pb-4">
          <p className="mb-1.5 text-xs text-muted-foreground">Firma (se agrega automáticamente al enviar)</p>
          {signatureHtml ? (
            <div
              className="rounded-lg border p-3 text-sm [&_img]:max-w-full"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(signatureHtml) }}
            />
          ) : (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{senderName}</p>
              <p className="text-xs text-muted-foreground">{senderEmail}</p>
              <p className="mt-1 text-xs text-muted-foreground italic">Sin firma configurada en Gmail.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Descartar" onClick={handleDiscard} disabled={discarding}>
            <Trash2Icon className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Adjuntar" disabled>
            <PaperclipIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Añadir contexto"
            onClick={() => setShowContextBox((v) => !v)}
            className={cn(userContext && "text-primary")}
          >
            <MessageSquarePlusIcon className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleTestSend} disabled={testing || gmailLoading}>
            {testing ? "Enviando prueba..." : "Probar (enviarme una copia)"}
          </Button>
          <Button type="button" className="gap-1.5" onClick={handleSend} disabled={sending || gmailLoading}>
            <SendIcon className="size-3.5" /> {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CalendarActionPanel({
  suggestionId,
  draft,
  userContext,
  onApplied,
  onDismissed,
  onRegenerated,
}: {
  suggestionId: number
  draft: RealCalendarDraft
  userContext: string | null
  onApplied: () => Promise<void>
  onDismissed: () => Promise<void>
  onRegenerated: (draft: RealCalendarDraft, context: string) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [title, setTitle] = React.useState(draft.title)
  const [description, setDescription] = React.useState(draft.description)
  const [date, setDate] = React.useState(draft.date)
  const [time, setTime] = React.useState(draft.time)
  const [creating, setCreating] = React.useState(false)
  const [discarding, setDiscarding] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [showContextBox, setShowContextBox] = React.useState(false)
  const [contextInput, setContextInput] = React.useState(userContext ?? "")
  const [regenerating, setRegenerating] = React.useState(false)
  const locked = !editing
  const { connection: calendar, loading: calendarLoading } = useActiveIntegration("google-calendar")

  function buildEventPayload() {
    if (!date || !time) return null
    const start = new Date(`${date}T${time}:00`)
    const end = new Date(start.getTime() + parseDurationMinutes(draft.duration) * 60000)
    return { startDateTime: start.toISOString(), endDateTime: end.toISOString() }
  }

  async function handleSchedule() {
    const range = buildEventPayload()
    if (!range) {
      notify.warning({ title: "Falta fecha u hora", description: "Elige cuándo agendar la reunión." })
      return
    }
    if (!calendar) {
      suggestionNotify.noIntegration("Google Calendar")
      return
    }
    setCreating(true)
    try {
      await integrationService.createGoogleCalendarEvent({
        summary: title,
        description,
        ...range,
        workspaceIntegrationId: calendar.id,
      })
      suggestionNotify.eventCreated()
      await onApplied()
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  // El evento siempre se crea en TU PROPIO Google Calendar (la integración es
  // individual, ver useActiveIntegration) — a diferencia del correo, acá no
  // hay riesgo de "escribirle a otra persona" sin querer. Igual conviene un
  // botón de prueba separado: crea el evento real pero con "[Prueba]" en el
  // título y SIN marcar la sugerencia como aplicada, para poder revisarlo y
  // borrarlo sin perder la sugerencia de la lista.
  async function handleTestSchedule() {
    const range = buildEventPayload()
    if (!range) {
      notify.warning({ title: "Falta fecha u hora", description: "Elige cuándo agendar la reunión." })
      return
    }
    if (!calendar) {
      suggestionNotify.noIntegration("Google Calendar")
      return
    }
    setTesting(true)
    try {
      await integrationService.createGoogleCalendarEvent({
        summary: `[Prueba] ${title}`,
        description,
        ...range,
        workspaceIntegrationId: calendar.id,
      })
      notify.success({ title: "Evento de prueba creado", description: "Revisa tu Google Calendar." })
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setTesting(false)
    }
  }

  async function handleDiscard() {
    setDiscarding(true)
    try {
      await onDismissed()
    } finally {
      setDiscarding(false)
    }
  }

  async function handleRegenerate() {
    if (!contextInput.trim()) return
    setRegenerating(true)
    try {
      const newDraft = await opportunitySuggestionService.regenerate(suggestionId, contextInput.trim()) as RealCalendarDraft
      setTitle(newDraft.title)
      setDescription(newDraft.description)
      onRegenerated(newDraft, contextInput.trim())
      setShowContextBox(false)
      notify.success({ title: "Borrador regenerado", description: "Se redactó de nuevo con tu contexto." })
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ActionHeader editing={editing} onToggle={() => setEditing((v) => !v)} />

      {showContextBox && (
        <div className="space-y-2 border-b bg-muted/20 p-3">
          <textarea
            className="min-h-16 w-full resize-none rounded-md border bg-background p-2 text-xs outline-none"
            placeholder='Ej: "Esto es una postulación a un evento, no una venta — agradece la participación en vez de ofrecer algo."'
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowContextBox(false)} disabled={regenerating}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleRegenerate} disabled={regenerating || !contextInput.trim()}>
              {regenerating ? "Regenerando..." : "Regenerar con este contexto"}
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {locked ? (
          <h3 className="text-base font-medium">{title}</h3>
        ) : (
          <input
            className="w-full border-b bg-transparent pb-1 text-base font-medium outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="date"
              className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <span className="text-muted-foreground">({draft.duration})</span>
          </div>
          {draft.attendee && (
            <div className="flex items-center gap-2.5">
              <UserIcon className="size-4 shrink-0 text-muted-foreground" />
              <span>{draft.attendee}</span>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {locked ? (
              <p className="text-muted-foreground">{description}</p>
            ) : (
              <textarea
                className="min-h-20 w-full resize-none bg-transparent outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Añadir contexto"
          onClick={() => setShowContextBox((v) => !v)}
          className={cn(userContext && "text-primary")}
        >
          <MessageSquarePlusIcon className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" className="text-muted-foreground" onClick={handleDiscard} disabled={discarding}>
            Descartar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleTestSchedule} disabled={testing || calendarLoading}>
            {testing ? "Creando prueba..." : "Probar (crear en mi calendario)"}
          </Button>
          <Button type="button" className="gap-1.5" onClick={handleSchedule} disabled={creating || calendarLoading}>
            <CalendarIcon className="size-3.5" /> {creating ? "Agendando..." : "Agendar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Ganada/Perdida — no se fuerza la recomendación de la IA, se muestran ambas opciones
// válidas (acá solo llegan oportunidades abiertas) con la recomendada marcada. El
// usuario elige — la IA opina, no decide.
function StatusActionPanel({
  opportunityId,
  opportunityName,
  recommendation,
  onApplied,
}: {
  opportunityId: number
  opportunityName: string
  recommendation: "Ganada" | "Perdida"
  onApplied: () => Promise<void>
}) {
  const [choice, setChoice] = React.useState<"Ganada" | "Perdida" | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  async function handleConfirm() {
    if (!choice) return
    setConfirming(true)
    try {
      if (choice === "Ganada") {
        await opportunityService.won(opportunityId)
        opportunityNotify.won(opportunityName)
      } else {
        await opportunityService.lost(opportunityId)
        opportunityNotify.lost(opportunityName)
      }
      await onApplied()
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">
        <SparklesIcon className="size-3.5" /> Sugerido por IA
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          ¿Cómo quieres actualizar el estado de esta oportunidad?
        </p>

        <div className="space-y-2">
          {(["Ganada", "Perdida"] as const).map((option) => {
            const isRecommended = option === recommendation
            const isChosen = choice === option
            const Icon = option === "Ganada" ? ThumbsUpIcon : ThumbsDownIcon
            return (
              <button
                key={option}
                type="button"
                onClick={() => setChoice(option)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                  isChosen
                    ? option === "Ganada"
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                    : "hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4" /> Marcar como {option}
                </span>
                {isRecommended && (
                  <Badge className="gap-1 rounded-full border-teal-200 bg-teal-50 text-[0.65rem] text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-400">
                    <SparklesIcon className="size-2.5" /> Recomendación IA
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={() => setChoice(null)} disabled={confirming}>
          Cancelar
        </Button>
        <Button type="button" disabled={!choice || confirming} className="gap-1.5" onClick={handleConfirm}>
          <CheckIcon className="size-3.5" /> {confirming ? "Confirmando..." : `Confirmar${choice ? ` — ${choice}` : ""}`}
        </Button>
      </div>
    </div>
  )
}

// Lista de tareas propias vencidas — Completar es real (opportunity-activity/complete).
// Reprogramar queda visual por ahora — ver nota al inicio del archivo.
function ActivityActionPanel({
  activities,
  onApplied,
}: {
  activities: PendingActivityItem[]
  onApplied: () => Promise<void>
}) {
  const [resolved, setResolved] = React.useState<Set<number>>(new Set())
  const [busyId, setBusyId] = React.useState<number | null>(null)

  async function handleComplete(id: number) {
    setBusyId(id)
    try {
      await activityService.complete(id)
      suggestionNotify.activityCompleted()
      const next = new Set(resolved).add(id)
      setResolved(next)
      if (next.size === activities.length) {
        await onApplied()
      }
    } catch (err) {
      suggestionNotify.error(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">
        <SparklesIcon className="size-3.5" /> Sugerido por IA
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Tareas pendientes detectadas en esta oportunidad:
        </p>

        <div className="space-y-2">
          {activities.map((activity) => {
            const isResolved = resolved.has(activity.id)
            const isBusy = busyId === activity.id
            return (
              <div
                key={activity.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  isResolved && "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                )}
              >
                <p className={cn("text-sm font-medium", isResolved && "line-through opacity-70")}>
                  {activity.title}
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Venció: {activity.dueDate} ({activity.overdueDays} días)
                </p>
                {isResolved ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckIcon className="size-3.5" /> Completada
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      onClick={() => handleComplete(activity.id)}
                      disabled={isBusy}
                    >
                      <CheckIcon className="size-3.5" /> {isBusy ? "Completando..." : "Completar"}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <SparklesIcon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-64 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function ActionPanel({
  suggestion,
  action,
  onApplied,
  onDismissed,
  onEmailRegenerated,
  onCalendarRegenerated,
}: {
  suggestion: SuggestionGroup
  action: SuggestionAction
  onApplied: () => Promise<void>
  onDismissed: () => Promise<void>
  onEmailRegenerated: (suggestionId: number, draft: RealEmailDraft, context: string) => void
  onCalendarRegenerated: (suggestionId: number, draft: RealCalendarDraft, context: string) => void
}) {
  switch (action.actionType) {
    case "email":
      return (
        <EmailActionPanel
          key={action.suggestionId}
          suggestionId={action.suggestionId}
          draft={action.draft}
          userContext={action.userContext}
          opportunityId={suggestion.opportunityId}
          onApplied={onApplied}
          onDismissed={onDismissed}
          onRegenerated={(draft, context) => onEmailRegenerated(action.suggestionId, draft, context)}
        />
      )
    case "calendar_event":
      return (
        <CalendarActionPanel
          key={action.suggestionId}
          suggestionId={action.suggestionId}
          draft={action.draft}
          userContext={action.userContext}
          onApplied={onApplied}
          onDismissed={onDismissed}
          onRegenerated={(draft, context) => onCalendarRegenerated(action.suggestionId, draft, context)}
        />
      )
    case "status_action":
      return (
        <StatusActionPanel
          key={action.suggestionId}
          opportunityId={suggestion.opportunityId}
          opportunityName={suggestion.opportunityName}
          recommendation={action.recommendation}
          onApplied={onApplied}
        />
      )
    case "activity_task":
      return <ActivityActionPanel key={action.suggestionId} activities={action.activities} onApplied={onApplied} />
  }
}

// Estado inerte — la feature está construida pero no activada para este
// workspace. El punto de entrada vive ACÁ, no en Integraciones: a diferencia
// de Gmail/Calendar/Cargo, Sugerencias IA no tiene credenciales externas que
// conectar, reusa el motor de IA de la plataforma — no tiene sentido que
// compita visualmente con las conexiones reales en esa grilla.
function InertActivationState({ onActivateClick }: { onActivateClick: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <SparklesIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Sugerencias IA no está activada</p>
        <p className="max-w-80 text-xs text-muted-foreground">
          Detecta oportunidades sin seguimiento y sugiere la próxima acción — correo, llamada, o actualizar el
          estado. Actívala para este workspace.
        </p>
      </div>
      <Button type="button" size="sm" onClick={onActivateClick}>
        <SparklesIcon className="size-3.5" /> Activar
      </Button>
    </div>
  )
}

export function SuggestionsView() {
  const [activation, setActivation] = React.useState<"loading" | "inactive" | "active">("loading")
  const [aiConnection, setAiConnection] = React.useState<WorkspaceIntegrationRaw | undefined>(undefined)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const checkActivation = React.useCallback(() => {
    integrationService
      .getWorkspaceIntegrations()
      .then((connections) => {
        const conn = connections.find((c) => c.provider_key === "ai_suggestions" && c.is_active)
        setAiConnection(conn)
        setActivation(conn ? "active" : "inactive")
      })
      .catch(() => setActivation("inactive"))
  }, [])

  React.useEffect(() => {
    checkActivation()
  }, [checkActivation])

  const [suggestions, setSuggestions] = React.useState<SuggestionGroup[]>([])
  const [loading, setLoading] = React.useState(true)
  // Separado de `loading`: el botón "Actualizar" no debe arrancar en
  // disabled={true} en el primer render — @base-ui/react/button recién aplica
  // el atributo `disabled` nativo después de hidratar (usa `data-disabled`
  // para estilos mientras tanto), así que pasar `true` desde el montaje
  // inicial genera un mismatch de hidratación servidor/cliente. `refreshing`
  // arranca en `false` siempre — solo se toca por una acción del usuario.
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [activeActionIndex, setActiveActionIndex] = React.useState(0)

  const fetchSuggestions = React.useCallback(() => {
    setError(null)
    return opportunitySuggestionService
      .list()
      .then((data) => {
        const sorted = [...data].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
        setSuggestions(sorted)
        setSelectedId((current) => current ?? sorted[0]?.id ?? null)
      })
      .catch(() => setError("No se pudieron cargar las sugerencias."))
  }, [])

  React.useEffect(() => {
    if (activation !== "active") return
    setLoading(true)
    fetchSuggestions().finally(() => setLoading(false))
  }, [activation, fetchSuggestions])

  function handleManualRefresh() {
    setRefreshing(true)
    fetchSuggestions().finally(() => setRefreshing(false))
  }

  const selected = suggestions.find((s) => s.id === selectedId) ?? null
  const activeAction = selected?.actions[activeActionIndex] ?? selected?.actions[0]

  function handleSelectCard(id: string) {
    setSelectedId(id)
    setActiveActionIndex(0)
  }

  // Quita SOLO la acción resuelta — si la señal tenía más de una (ej. Correo +
  // Calendario), la tarjeta sigue viva con la que queda. Si era la última,
  // la tarjeta desaparece y se selecciona la siguiente disponible.
  function removeAction(groupId: string, suggestionId: number) {
    setSuggestions((prev) => {
      const next = prev
        .map((g) => (g.id === groupId ? { ...g, actions: g.actions.filter((a) => a.suggestionId !== suggestionId) } : g))
        .filter((g) => g.actions.length > 0)
      setSelectedId((currentId) => {
        if (currentId !== groupId) return currentId
        const stillExists = next.some((g) => g.id === groupId)
        return stillExists ? currentId : (next[0]?.id ?? null)
      })
      return next
    })
    setActiveActionIndex(0)
  }

  async function handleApplied(groupId: string, suggestionId: number) {
    await opportunitySuggestionService.apply(suggestionId)
    removeAction(groupId, suggestionId)
  }

  async function handleDismissed(groupId: string, suggestionId: number) {
    await opportunitySuggestionService.dismiss(suggestionId)
    suggestionNotify.dismissed()
    removeAction(groupId, suggestionId)
  }

  // El panel ya actualizó su propio estado local (subject/body o title/description)
  // apenas volvió la respuesta — esto solo mantiene el estado del padre en sync, para
  // que el chip/draft quede correcto si el usuario cambia de tarjeta y vuelve.
  function handleEmailRegenerated(suggestionId: number, draft: RealEmailDraft, context: string) {
    setSuggestions((prev) =>
      prev.map((g) => ({
        ...g,
        actions: g.actions.map((a) =>
          a.suggestionId === suggestionId && a.actionType === "email" ? { ...a, draft, userContext: context } : a
        ),
      }))
    )
  }

  function handleCalendarRegenerated(suggestionId: number, draft: RealCalendarDraft, context: string) {
    setSuggestions((prev) =>
      prev.map((g) => ({
        ...g,
        actions: g.actions.map((a) =>
          a.suggestionId === suggestionId && a.actionType === "calendar_event" ? { ...a, draft, userContext: context } : a
        ),
      }))
    )
  }

  if (activation === "loading") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-xs text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (activation === "inactive") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <InertActivationState onActivateClick={() => setSheetOpen(true)} />
        <AiSuggestionsActivationSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          connection={aiConnection}
          onSuccess={checkActivation}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AiSuggestionsActivationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        connection={aiConnection}
        onSuccess={checkActivation}
      />
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
        <SparklesIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Sugerencias</span>
        <span className="text-xs text-muted-foreground">({suggestions.length})</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Configurar Sugerencias IA"
            onClick={() => setSheetOpen(true)}
          >
            <SettingsIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            aria-label="Actualizar"
          >
            <RefreshCwIcon className={cn("size-3.5", (loading || refreshing) && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-96 shrink-0 flex-col overflow-hidden border-r">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-xs text-muted-foreground">Cargando sugerencias...</p>
            ) : error ? (
              <p className="p-4 text-xs text-destructive">{error}</p>
            ) : suggestions.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">No hay sugerencias pendientes por ahora.</p>
            ) : (
              suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  selected={selectedId === s.id}
                  onClick={() => handleSelectCard(s.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden border-r">
          {selected ? (
            <ContextPanel suggestion={selected} onSelectAction={() => setActiveActionIndex(0)} />
          ) : (
            <PlaceholderPanel
              title="Contexto"
              description="Selecciona una sugerencia para ver la evidencia que la justifica."
            />
          )}
        </div>

        <div className="flex w-120 shrink-0 flex-col overflow-hidden">
          {!selected || !activeAction ? (
            <PlaceholderPanel
              title="Vista previa"
              description="Selecciona una sugerencia para ver el borrador de la acción."
            />
          ) : (
            <>
              <ActionChips actions={selected.actions} activeIndex={activeActionIndex} onSelect={setActiveActionIndex} />
              <ActionPanel
                suggestion={selected}
                action={activeAction}
                onApplied={() => handleApplied(selected.id, activeAction.suggestionId)}
                onDismissed={() => handleDismissed(selected.id, activeAction.suggestionId)}
                onEmailRegenerated={handleEmailRegenerated}
                onCalendarRegenerated={handleCalendarRegenerated}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
