"use client"

import * as React from "react"
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HelpCircleIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  VideoIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { googleEventConfirm } from "@/lib/confirm"
import { integrationService } from "@/services/integration.service"
import type { GoogleAttendeeStatus, GoogleEvent } from "@/lib/google-event-utils"

interface Props {
  event: GoogleEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // Necesario para editar/cancelar (llamadas van contra esta integración de Google Calendar).
  integrationId: number | null
  // Se llama tras guardar o cancelar exitosamente, para que el calendario se refresque.
  onChanged?: () => void
}

const ATTENDEE_STATUS_CONFIG: Record<GoogleAttendeeStatus, { icon: React.ElementType; label: string; className: string }> = {
  accepted:    { icon: CheckCircle2Icon, label: "Aceptó",    className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" },
  declined:    { icon: XCircleIcon,      label: "Rechazó",   className: "text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400" },
  tentative:   { icon: HelpCircleIcon,   label: "Tal vez",   className: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400" },
  needsAction: { icon: ClockIcon,        label: "Pendiente", className: "text-muted-foreground bg-muted" },
}

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-y bg-muted/30">
      <Icon className="size-3.5 text-blue-500" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-muted/50 rounded-lg">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  )
}

const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function GoogleEventPreviewSheet({ event, open, onOpenChange, integrationId, onChanged }: Props) {
  const [editing, setEditing]         = React.useState(false)
  const [saving, setSaving]           = React.useState(false)
  const [title, setTitle]             = React.useState("")
  const [startDateTime, setStart]     = React.useState("")
  const [endDateTime, setEnd]         = React.useState("")
  const [attendees, setAttendees]     = React.useState<string[]>([])
  const [attendeeInput, setAttendeeInput] = React.useState("")

  // Reinicia el form editable cada vez que se abre un evento distinto.
  React.useEffect(() => {
    if (!event) return
    setEditing(false)
    setTitle(event.title)
    setStart(`${event.startDate}T${event.startTime ?? "00:00"}`)
    setEnd(`${event.endDate}T${event.endTime ?? event.startTime ?? "00:00"}`)
    setAttendees(event.attendees.map((a) => a.email))
    setAttendeeInput("")
  }, [event])

  if (!event) return null

  const isAllDay = !event.startTime
  const sameDay = event.startDate === event.endDate

  function addAttendee() {
    const email = attendeeInput.trim()
    if (!email) return
    if (!EMAIL_RE.test(email)) {
      notify.error({ title: "Correo inválido", description: `"${email}" no es un correo válido.` })
      return
    }
    setAttendees((prev) => (prev.includes(email) ? prev : [...prev, email]))
    setAttendeeInput("")
  }

  function removeAttendee(email: string) {
    setAttendees((prev) => prev.filter((e) => e !== email))
  }

  async function handleSave() {
    if (!event || integrationId == null) return
    if (!title.trim()) {
      notify.error({ title: "Falta el título", description: "El título es requerido." })
      return
    }
    if (!startDateTime || !endDateTime) {
      notify.error({ title: "Faltan fechas", description: "Completa fecha/hora de inicio y término." })
      return
    }
    if (endDateTime <= startDateTime) {
      notify.error({ title: "Fechas inválidas", description: "La fecha de término debe ser posterior a la de inicio." })
      return
    }
    setSaving(true)
    const t0 = Date.now()
    console.log(`[google-event] update start id=${event.id}`)
    try {
      await integrationService.updateGoogleCalendarEvent(integrationId, event.id, {
        summary: title.trim(),
        description: event.description,
        startDateTime,
        endDateTime,
        attendees,
      })
      console.log(`[google-event] update OK → ${Date.now() - t0}ms`)
      notify.success({ title: "Evento actualizado", description: "Se guardaron los cambios y se notificó a los invitados." })
      setEditing(false)
      onChanged?.()
      onOpenChange(false)
    } catch (err) {
      console.log(`[google-event] update FAILED → ${Date.now() - t0}ms`)
      notify.error({
        title: "No se pudo actualizar",
        description: (err as { message?: string })?.message ?? "Intenta nuevamente.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelEvent() {
    if (!event || integrationId == null) return
    const confirmed = await googleEventConfirm.cancel(event.title)
    if (!confirmed) return
    setSaving(true)
    const t0 = Date.now()
    console.log(`[google-event] delete start id=${event.id}`)
    try {
      await integrationService.deleteGoogleCalendarEvent(integrationId, event.id)
      console.log(`[google-event] delete OK → ${Date.now() - t0}ms`)
      notify.success({ title: "Reunión cancelada", description: "Se notificó a los invitados." })
      onChanged?.()
      onOpenChange(false)
    } catch (err) {
      console.log(`[google-event] delete FAILED → ${Date.now() - t0}ms`)
      notify.error({
        title: "No se pudo cancelar",
        description: (err as { message?: string })?.message ?? "Intenta nuevamente.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full! flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        {/* Identity */}
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-4">
          <div className="size-14 shrink-0 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-950">
            <FcGoogle className="size-7" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {editing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la reunión" />
            ) : (
              <span className="text-sm font-medium leading-snug line-clamp-2">{event.title}</span>
            )}
            <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              Evento de Google Calendar
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          {editing ? (
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Desde</Label>
                  <InputGroup>
                    <InputGroupAddon><ClockIcon /></InputGroupAddon>
                    <InputGroupInput type="datetime-local" value={startDateTime} onChange={(e) => setStart(e.target.value)} />
                  </InputGroup>
                </div>
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Hasta</Label>
                  <InputGroup>
                    <InputGroupAddon><ClockIcon /></InputGroupAddon>
                    <InputGroupInput type="datetime-local" value={endDateTime} onChange={(e) => setEnd(e.target.value)} />
                  </InputGroup>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Invitados</Label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border p-2">
                  {attendees.map((email) => (
                    <span
                      key={email}
                      className="flex items-center gap-1 rounded-full bg-muted py-0.5 pl-2.5 pr-1.5 text-xs font-medium"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeAttendee(email)}
                        className="rounded-full p-0.5 hover:bg-accent"
                        aria-label={`Quitar ${email}`}
                      >
                        <XIcon className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addAttendee() } }}
                    onBlur={addAttendee}
                    placeholder={attendees.length === 0 ? "correo@ejemplo.com" : "Agregar otro..."}
                    className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <SectionHeader icon={CalendarIcon} label="Información" />
              <div className="flex flex-col gap-1.5 px-4 py-3">
                <InfoRow label="Fecha">
                  {sameDay ? fmtDate(event.startDate) : `${fmtDate(event.startDate)} — ${fmtDate(event.endDate)}`}
                </InfoRow>
                <InfoRow label="Hora">
                  {isAllDay ? "Todo el día" : `${event.startTime} – ${event.endTime ?? event.startTime}`}
                </InfoRow>
                {event.location && <InfoRow label="Ubicación">{event.location}</InfoRow>}
              </div>

              {event.attendees.length > 0 && (
                <>
                  <SectionHeader icon={UsersIcon} label="Invitados" />
                  <div className="flex flex-col gap-1.5 px-4 py-3">
                    {event.attendees.map((att) => {
                      const statusConf = ATTENDEE_STATUS_CONFIG[att.responseStatus] ?? ATTENDEE_STATUS_CONFIG.needsAction
                      const StatusIcon = statusConf.icon
                      return (
                        <div key={att.email} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                          <span className="min-w-0 truncate text-xs">
                            {att.email}
                            {(att.organizer || att.self) && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">(tú)</span>
                            )}
                          </span>
                          <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", statusConf.className)}>
                            <StatusIcon className="size-3" />
                            {statusConf.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {event.description && (
                <>
                  <SectionHeader icon={FileTextIcon} label="Descripción" />
                  <div className="px-4 py-3">
                    <p className="whitespace-pre-line text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <SheetFooter className="flex-col gap-2 border-t px-4 py-3 shrink-0">
          {editing ? (
            <>
              <Button className="w-full justify-start text-xs h-8 gap-1.5" onClick={handleSave} disabled={saving}>
                {saving && <Loader2Icon className="size-3.5 animate-spin" />}
                Guardar cambios
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs h-8 gap-1.5" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar edición
              </Button>
            </>
          ) : (
            <>
              {event.meetLink ? (
                <>
                  <Button
                    className="w-full justify-start text-xs h-8 gap-1.5 bg-[#534AB7] hover:bg-[#4840A0]"
                    onClick={() => window.open(event.meetLink, "_blank", "noopener,noreferrer")}
                  >
                    <VideoIcon className="size-3.5" /> Ir a reunión
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs h-8 gap-1.5"
                    onClick={() => window.open(event.htmlLink, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLinkIcon className="size-3.5" /> Ver en Google Calendar
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full justify-start text-xs h-8 gap-1.5 bg-[#534AB7] hover:bg-[#4840A0]"
                  onClick={() => window.open(event.htmlLink, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLinkIcon className="size-3.5" /> Ver en Google Calendar
                </Button>
              )}
              {integrationId != null && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs h-8 gap-1.5"
                    onClick={() => setEditing(true)}
                    disabled={saving}
                  >
                    <PencilIcon className="size-3.5" /> Editar / Aplazar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs h-8 gap-1.5 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={handleCancelEvent}
                    disabled={saving}
                  >
                    {saving ? <Loader2Icon className="size-3.5 animate-spin" /> : <Trash2Icon className="size-3.5" />}
                    Cancelar reunión
                  </Button>
                </>
              )}
            </>
          )}
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
