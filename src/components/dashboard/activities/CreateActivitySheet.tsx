"use client"

import * as React from "react"
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  Loader2Icon,
  LoaderCircleIcon,
  SettingsIcon,
  SparklesIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Section } from "@/components/ui/section"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { getInitials } from "@/lib/table-utils"
import { toWorkspaceDateTimeParts } from "@/lib/activity-utils"
import { activityService } from "@/services/activity.service"
import { catalogService, activeOptions } from "@/services/catalog.service"
import { flowService } from "@/services/flow.service"
import { integrationService } from "@/services/integration.service"
import { opportunityService } from "@/services/opportunity.service"
import { teamService } from "@/services/team.service"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { useSessionStore } from "@/store/session.store"
import { useWorkspaceTimezone } from "@/hooks/useWorkspaceTimezone"
import type { CatalogOption } from "@/types/catalog"
import type { ActivityRaw } from "@/types/activity"
import type { WorkspaceIntegrationRaw } from "@/types/integration"

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode     = "actividad" | "google"
type Priority = string

interface PickerUser { id: number; name: string }

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

// Module-level team cache — shared across all sheet instances, 5-min TTL
let _teamCache: { data: PickerUser[]; ts: number } | null = null
const TEAM_CACHE_TTL = 5 * 60_000

// ─── Responsible picker ───────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  return (
    <Avatar className="size-6 shrink-0">
      <AvatarImage src="https://github.com/shadcn.png" alt={name} />
      <AvatarFallback className="text-[10px] font-semibold">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

function ResponsiblePicker({ value, onChange }: { value: PickerUser | null; onChange: (v: PickerUser | null) => void }) {
  const [open, setOpen]         = React.useState(false)
  const [search, setSearch]     = React.useState("")
  const [all, setAll]           = React.useState<PickerUser[]>([])
  const [loading, setLoading]   = React.useState(false)
  const [dropStyle, setDropStyle] = React.useState<React.CSSProperties>({})
  const triggerRef              = React.useRef<HTMLButtonElement>(null)
  const containerRef            = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let cancelled = false
    if (_teamCache && Date.now() - _teamCache.ts < TEAM_CACHE_TTL) {
      setAll(_teamCache.data)
      return
    }
    setLoading(true)
    teamService.list({ take: 100, is_active: true })
      .then((res) => {
        if (cancelled) return
        const users = res.data.map((m) => ({ id: m.user_id, name: m.user.name }))
        _teamCache = { data: users, ts: Date.now() }
        setAll(users)
      })
      .catch(() => { if (!cancelled) setAll([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = all.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))

  function handleOpen() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom
      const estimated  = 300
      if (spaceBelow < estimated && r.top > estimated) {
        setDropStyle({ bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width })
      } else {
        setDropStyle({ top: r.bottom + 6, left: r.left, width: r.width })
      }
    }
    setOpen((o) => !o)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          open && "border-ring ring-3 ring-ring/50"
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2", value ? "text-foreground" : "text-muted-foreground")}>
          {value ? (
            <>
              <UserAvatar name={value.name} />
              <span className="truncate">{value.name}</span>
            </>
          ) : "Selecciona un responsable"}
        </span>
        <ChevronDownIcon className={cn("ml-2 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-md" style={dropStyle}>
          <div className="border-b p-1.5">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onChange(u); setOpen(false) }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value?.id === u.id && "bg-accent/50"
                  )}
                >
                  <CheckIcon className={cn("size-3.5 shrink-0 opacity-0", value?.id === u.id && "opacity-100")} />
                  <UserAvatar name={u.name} />
                  <span>{u.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Preselected context (from opportunity detail — these fields become hidden)
  opportunityId?: number
  opportunityName?: string
  flowName?: string | null
  // Edit mode
  activity?: ActivityRaw | null
  onSuccess?: (updated: ActivityRaw | null) => void
  // Preselected date (e.g. from calendar day click), format yyyy-MM-dd
  defaultDate?: string
  // When set, this sheet was opened from another sheet still mounted behind it —
  // shows a breadcrumb and turns "Cancelar" into "Anterior" (same pattern as CreateContactSheet)
  breadcrumb?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateActivitySheet({
  open,
  onOpenChange,
  opportunityId,
  opportunityName,
  flowName,
  activity,
  onSuccess,
  defaultDate,
  breadcrumb,
}: Props) {
  const isEdit         = !!activity
  const hasContext     = opportunityId !== undefined
  const showAssignment = !hasContext && !isEdit
  const currentUser    = useSessionStore((s) => s.user)
  const timezone       = useWorkspaceTimezone()

  // ── Flow / opportunity selection (standalone mode) ─────────────────────────
  const [linkOpportunity, setLinkOpportunity]              = React.useState(false)
  const [selectedFlowId, setSelectedFlowId]               = React.useState<number | null>(null)
  const [selectedOpportunityId, setSelectedOpportunityId] = React.useState<number | null>(null)
  const [flows, setFlows]                                 = React.useState<{ value: string; label: string }[]>([])
  const [flowsLoading, setFlowsLoading]                   = React.useState(false)
  const [opportunities, setOpportunities]                 = React.useState<{ value: string; label: string }[]>([])
  const [oppsLoading, setOppsLoading]                     = React.useState(false)

  // ── Catalog state ──────────────────────────────────────────────────────────
  const [actTypeOptions, setActTypeOptions] = React.useState<CatalogOption[]>([])
  const [prioOptions, setPrioOptions]       = React.useState<CatalogOption[]>([])
  const [actTypeLabelId, setActTypeLabelId] = React.useState<number | null>(null)
  const [prioLabelId, setPrioLabelId]       = React.useState<number | null>(null)
  const [catalogLoading, setCatalogLoading] = React.useState(false)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [mode, setMode]             = React.useState<Mode>("actividad")
  const [title, setTitle]           = React.useState("")
  const [activityType, setActivityType] = React.useState("")
  const [startDate, setStartDate]   = React.useState("")
  const [endDate, setEndDate]       = React.useState("")
  const [priority, setPriority]     = React.useState<Priority>("")
  const [responsible, setResponsible] = React.useState<PickerUser | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors]         = React.useState<Record<string, string>>({})

  // ── Google Calendar sync ────────────────────────────────────────────────────
  const [googleConnection, setGoogleConnection] = React.useState<WorkspaceIntegrationRaw | null>(null)
  const [createMeetLink, setCreateMeetLink]     = React.useState(true)
  const [attendees, setAttendees]               = React.useState<string[]>([])
  const [attendeeInput, setAttendeeInput]       = React.useState("")

  React.useEffect(() => {
    if (!open) return
    integrationService.getWorkspaceIntegrations()
      .then((connections) => {
        const conn = connections.find((c) => c.provider_key === "google-calendar" && c.is_active)
        setGoogleConnection(conn ?? null)
      })
      .catch(() => setGoogleConnection(null))
  }, [open])

  // El picker de tipo se oculta en modo google (siempre es "Reunión") — hay que
  // fijar el valor igual, si no la validación de tipo requerido nunca pasa.
  React.useEffect(() => {
    if (mode === "google") setActivityType("Reunión")
  }, [mode])

  // En modo Google se precarga el responsable con el usuario actual (sigue siendo editable).
  React.useEffect(() => {
    if (mode !== "google" || !currentUser) return
    setResponsible((prev) => prev ?? { id: currentUser.id, name: currentUser.name })
  }, [mode, currentUser])

  // Precarga el contacto de la oportunidad como invitado sugerido (una vez por
  // oportunidad) — el usuario puede quitarlo o agregar cualquier otro correo.
  React.useEffect(() => {
    if (mode !== "google") return
    const oppId = opportunityId ?? selectedOpportunityId
    if (!oppId) return
    opportunityService.getById(oppId)
      .then((detail) => {
        const email = detail.person?.person_detail?.find((d) => d.label?.key === "email")?.value
        if (email) setAttendees((prev) => (prev.includes(email) ? prev : [...prev, email]))
      })
      .catch(() => {})
  }, [mode, opportunityId, selectedOpportunityId])

  function addAttendee() {
    const email = attendeeInput.trim()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify.error({ title: "Correo inválido", description: `"${email}" no es un correo válido.` })
      return
    }
    setAttendees((prev) => (prev.includes(email) ? prev : [...prev, email]))
    setAttendeeInput("")
  }

  function removeAttendee(email: string) {
    setAttendees((prev) => prev.filter((e) => e !== email))
  }

  // Evento "suelto" de Google Calendar Sync: no ligado a ninguna oportunidad —
  // no se crea Actividad CRM, solo el evento en Google (ver handleSubmit).
  const isLooseGoogleEvent = mode === "google" && !linkOpportunity

  // ── Load flows for standalone mode ────────────────────────────────────────
  React.useEffect(() => {
    if (!open || !showAssignment) return
    setFlowsLoading(true)
    flowService.all()
      .then((res) => setFlows(res.map((f) => ({ value: String(f.id), label: f.name }))))
      .catch(() => {})
      .finally(() => setFlowsLoading(false))
  }, [open, showAssignment])

  React.useEffect(() => {
    if (!selectedFlowId) { setOpportunities([]); return }
    setOppsLoading(true)
    opportunityService
      .list({ flow_id: selectedFlowId, take: 200 })
      .then((res) => setOpportunities(res.data.map((o) => ({ value: String(o.id), label: o.name }))))
      .catch(() => {})
      .finally(() => setOppsLoading(false))
  }, [selectedFlowId])

  // ── Load catalogs on open ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return
    setCatalogLoading(true)
    catalogService.getLabelOptions("activity_type,priority")
      .then((labels) => {
        const actLabel  = labels.find((l) => l.key === "activity_type")
        const prioLabel = labels.find((l) => l.key === "priority")

        const actOpts  = activeOptions(actLabel  ?? { id: 0, key: "", name: "", type: "", workspace_id: null, options: [] })
        const prioOpts = activeOptions(prioLabel ?? { id: 0, key: "", name: "", type: "", workspace_id: null, options: [] })

        setActTypeOptions(actOpts)
        setPrioOptions(prioOpts)
        setActTypeLabelId(actLabel?.id ?? null)
        setPrioLabelId(prioLabel?.id ?? null)

        if (!isEdit && prioOpts.length > 0) {
          const mid = prioOpts[Math.floor(prioOpts.length / 2)]
          setPriority(mid.value)
        }
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false))
  }, [open])

  // ── Pre-fill for edit ──────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return
    if (isEdit && activity) {
      setMode("actividad")
      setTitle(activity.title ?? "")
      const existingType = activity.opportunity_activity_detail.find((d) => d.label?.key === "activity_type")?.value ?? ""
      const existingPrio = activity.opportunity_activity_detail.find((d) => d.label?.key === "priority")?.value ?? ""
      setActivityType(existingType)
      setPriority(existingPrio)
      // date_from/date_to vienen en UTC — hay que convertirlos de vuelta a la hora del
      // workspace para el input datetime-local, no recortar el string tal cual.
      const startParts = activity.date_from ? toWorkspaceDateTimeParts(activity.date_from, timezone) : null
      const endParts   = activity.date_to   ? toWorkspaceDateTimeParts(activity.date_to, timezone)   : null
      setStartDate(startParts ? `${startParts.date}T${startParts.time}` : "")
      setEndDate(endParts ? `${endParts.date}T${endParts.time}` : "")
      setResponsible(activity.user ? { id: activity.user.id, name: activity.user.name } : null)
      setErrors({})
    } else if (!isEdit) {
      resetForm()
    }
  }, [open, activity, defaultDate, timezone])

  function resetForm() {
    setMode("actividad")
    setTitle("")
    setActivityType("")
    setStartDate(defaultDate ? `${defaultDate}T09:00` : "")
    setEndDate("")
    setPriority("")
    setResponsible(null)
    setErrors({})
    setLinkOpportunity(false)
    setSelectedFlowId(null)
    setSelectedOpportunityId(null)
    setCreateMeetLink(true)
    setAttendees([])
    setAttendeeInput("")
  }

  function handleLinkOpportunityChange(checked: boolean) {
    setLinkOpportunity(checked)
    if (!checked) {
      setSelectedFlowId(null)
      setSelectedOpportunityId(null)
    }
  }

  function handleClose() {
    onOpenChange(false)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim())                                       e.title        = "El título es requerido."
    if (!isLooseGoogleEvent && !activityType)                 e.activityType = "Selecciona un tipo de actividad."
    if (!isLooseGoogleEvent && !responsible)                  e.responsible  = "Selecciona un responsable."
    if (showAssignment) {
      if (mode !== "google" && !selectedOpportunityId) e.opportunity = "Selecciona una oportunidad."
      else if (mode === "google" && linkOpportunity && !selectedOpportunityId) e.opportunity = "Selecciona una oportunidad o desactiva \"Ligar Oportunidad\"."
    }
    if (mode === "google") {
      if (!startDate) e.startDate = "La fecha de inicio es requerida para agendar en Google Calendar."
      if (!endDate)   e.endDate   = "La fecha de término es requerida para agendar en Google Calendar."
    }
    if (startDate && endDate && endDate <= startDate) {
      e.endDate = "La fecha de término debe ser posterior a la de inicio."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const t0 = Date.now()

    // Build detail payloads
    const existingActTypeDet = activity?.opportunity_activity_detail.find((d) => d.label?.key === "activity_type")
    const existingPrioDet    = activity?.opportunity_activity_detail.find((d) => d.label?.key === "priority")

    const actTypeItems = activityType && actTypeLabelId ? [{
      name:     activityType,
      label_id: actTypeLabelId,
      option:   activityType,
      value:    activityType,
      ...(existingActTypeDet && { option_id: existingActTypeDet.id }),
    }] : []

    const prioItems = priority && prioLabelId ? [{
      name:     priority,
      label_id: prioLabelId,
      option:   priority,
      value:    priority,
      ...(existingPrioDet && { option_id: existingPrioDet.id }),
    }] : []

    // En edición, si no hay contexto/selección explícita, se preserva la oportunidad
    // que la actividad ya tenía — si no, un edit "genérico" (ej. desde el calendario)
    // la desvincularía silenciosamente al no reenviarla.
    const oppId = opportunityId ?? selectedOpportunityId ?? (isEdit ? activity?.opportunity?.id : undefined) ?? null

    const payload = {
      title:         title.trim(),
      date_from:     startDate || null,
      date_to:       endDate   || null,
      responsible:   { id: responsible!.id },
      ...(oppId ? { opportunity: { id: oppId } } : {}),
      activity_type: actTypeItems,
      priority:      prioItems,
      ubication:     null,
      note:          null,
    }

    try {
      if (isEdit && activity) {
        console.log(`[activity-opp] update start id=${activity.id}`)
        await activityService.update(activity.id, payload)
        const t1 = Date.now()
        const updated = await activityService.getById(activity.id)
        console.log(`[activity-opp] update OK → ${t1 - t0}ms | getById → ${Date.now() - t1}ms`)
        notify.info({ title: "Actividad actualizada", description: `"${title.trim()}" fue actualizada.` })
        onSuccess?.(updated)
      } else if (isLooseGoogleEvent && googleConnection) {
        // Evento suelto (sin oportunidad ligada): no se crea Actividad CRM,
        // solo el evento real en Google — el pull del calendario ya lo trae solo.
        console.log(`[activity-opp] google event (suelto) start`)
        const googleEvent = await integrationService.createGoogleCalendarEvent({
          summary:       title.trim(),
          startDateTime: startDate,
          endDateTime:   endDate,
          attendees,
          workspaceIntegrationId: googleConnection.id,
          createConference: createMeetLink,
        })
        console.log(`[activity-opp] google event (suelto) OK → ${Date.now() - t0}ms`)
        notify.success({
          title: "Evento creado en Google Calendar",
          description: googleEvent.meetUrl ? "Se agendó con link de Meet." : "Se agendó correctamente.",
        })
        onSuccess?.(null)
      } else {
        console.log(`[activity-opp] create start opportunityId=${opportunityId}`)
        const created = await activityService.create(payload)
        console.log(`[activity-opp] create OK → ${Date.now() - t0}ms`)

        if (mode === "google" && googleConnection) {
          const linkedOppName = opportunityName ?? opportunities.find((o) => o.value === String(selectedOpportunityId))?.label
          const t1 = Date.now()
          console.log(`[activity-opp] google event (ligada) start`)
          try {
            const googleEvent = await integrationService.createGoogleCalendarEvent({
              summary:       title.trim(),
              description:   linkedOppName ? `Reunión relacionada a la oportunidad: ${linkedOppName}` : undefined,
              startDateTime: startDate,
              endDateTime:   endDate,
              attendees,
              activityId:    created.id,
              workspaceIntegrationId: googleConnection.id,
              createConference: createMeetLink,
            })
            console.log(`[activity-opp] google event (ligada) OK → ${Date.now() - t1}ms | total → ${Date.now() - t0}ms`)
            notify.success({
              title: "Actividad creada y sincronizada",
              description: googleEvent.meetUrl
                ? `Se agendó en Google Calendar con link de Meet.`
                : `Se agendó en Google Calendar.`,
            })
          } catch (err) {
            console.log(`[activity-opp] google event (ligada) FAILED → ${Date.now() - t1}ms`)
            notify.error({
              title: "Actividad creada, pero falló la sincronización",
              description: (err as { message?: string })?.message ?? "La actividad se guardó, pero no se pudo crear el evento en Google Calendar.",
            })
          }
        } else {
          notify.success({ title: "Actividad creada", description: `"${title.trim()}" se creó correctamente.` })
        }
        onSuccess?.(null)
      }
      onOpenChange(false)
    } catch (err) {
      notify.error({
        title: "Algo salió mal",
        description: (err as { message?: string })?.message ?? "No se pudo guardar la actividad.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            {breadcrumb && (
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span>{breadcrumb}</span>
                <ChevronRightIcon className="size-3" />
                <span>Crear Actividad</span>
              </div>
            )}
            <SheetTitle>{isEdit ? "Editar Actividad" : "Nueva Actividad Comercial"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Modifica los datos de la actividad."
                : "Planifica llamadas, reuniones y tareas asignadas al equipo de ventas."}
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <form id="create-activity-form" onSubmit={handleSubmit} className="space-y-5 p-5">

            {/* ── Mode toggle (solo si hay Google Calendar conectado) ── */}
            {!isEdit && googleConnection && (
              <div>
                <div className="grid grid-cols-2 overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setMode("actividad")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      mode === "actividad"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <ClockIcon className="size-4 shrink-0" />
                    Actividad Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("google")}
                    className={cn(
                      "flex items-center justify-center gap-2 border-l px-3 py-2.5 text-sm font-medium transition-colors",
                      mode === "google"
                        ? "bg-violet-600 text-white"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <CalendarIcon className="size-4 shrink-0" />
                    Google Calendar Sync
                  </button>
                </div>
              </div>
            )}

            {/* ── Google banner ── */}
            {mode === "google" && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 shrink-0 text-violet-600 dark:text-violet-400" />
                  <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    Autoprogramación Google
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-violet-600 dark:text-violet-400">
                  Al guardar esta actividad, el sistema generará un evento real en tu Google Calendar
                  {attendees.length > 0 && ` e invitará a ${attendees.length === 1 ? "1 persona" : `${attendees.length} personas`}`}.
                </p>
              </div>
            )}

            <Section
              title="Información de la Actividad"
              description="Qué se va a hacer y con qué oportunidad se relaciona."
              icon={TrendingUpIcon}
            >
              {/* Contexto oportunidad (solo modo contexto) */}
              {hasContext && (
                <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Contexto
                  </p>
                  <p className="mt-0.5 text-sm font-medium">{opportunityName ?? "Oportunidad"}</p>
                  {flowName && (
                    <p className="text-xs text-muted-foreground">{flowName}</p>
                  )}
                </div>
              )}

              {/* Título */}
              <div className="space-y-1.5">
                <Label htmlFor="act-title" className={FIELD_LABEL}>
                  Título de la Actividad / Tarea <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="act-title"
                  placeholder="Ej. Llamar y enviar dossier de soporte"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              {/* Tipo: no aplica a un evento suelto de Google (no crea Actividad CRM) */}
              {!isLooseGoogleEvent && (
              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Tipo de Actividad <span className="text-destructive">*</span></Label>
                {mode === "google" ? (
                  <div className="flex h-9 cursor-not-allowed items-center rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                    Reunión
                  </div>
                ) : (
                  <Select
                    value={activityType}
                    onValueChange={(v) => { setActivityType(v ?? ""); setErrors((p) => ({ ...p, activityType: "" })) }}
                    disabled={catalogLoading}
                  >
                    <SelectTrigger className="w-full" aria-label="Tipo de actividad">
                      <SelectValue placeholder={catalogLoading ? "Cargando..." : "Selecciona un tipo"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {actTypeOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
                {errors.activityType && <p className="text-xs text-destructive">{errors.activityType}</p>}
              </div>
              )}

              {/* En modo Google, ligar a una Oportunidad es opcional — el switch controla si se muestran los selects */}
              {showAssignment && mode === "google" && (
                <div className="flex items-center justify-between gap-4 rounded-lg border px-3.5 py-2.5">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Ligar Oportunidad</p>
                    <p className="text-xs text-muted-foreground">Solo si esta reunión es parte de una negociación.</p>
                  </div>
                  <Switch checked={linkOpportunity} onCheckedChange={handleLinkOpportunityChange} />
                </div>
              )}

              {/* Embudo + Oportunidad: modo standalone (sin contexto). Siempre en "Actividad Normal", opcional (vía switch) en Google. */}
              {showAssignment && (mode !== "google" || linkOpportunity) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={FIELD_LABEL}>
                      Embudo {mode !== "google" && <span className="text-destructive">*</span>}
                    </Label>
                    {flowsLoading ? (
                      <div className="h-9 animate-pulse rounded-lg bg-muted" />
                    ) : (
                      <SearchableSelect
                        options={flows}
                        value={selectedFlowId ? String(selectedFlowId) : ""}
                        onChange={(v) => { setSelectedFlowId(v ? Number(v) : null); setSelectedOpportunityId(null) }}
                        placeholder="Selecciona un embudo"
                        searchPlaceholder="Buscar embudo..."
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={FIELD_LABEL}>
                      Oportunidad {mode !== "google" && <span className="text-destructive">*</span>}
                    </Label>
                    {oppsLoading ? (
                      <div className="h-9 animate-pulse rounded-lg bg-muted" />
                    ) : (
                      <SearchableSelect
                        options={opportunities}
                        value={selectedOpportunityId ? String(selectedOpportunityId) : ""}
                        onChange={(v) => setSelectedOpportunityId(v ? Number(v) : null)}
                        placeholder={selectedFlowId ? "Selecciona una oportunidad" : "Primero selecciona un embudo"}
                        searchPlaceholder="Buscar oportunidad..."
                        disabled={!selectedFlowId}
                      />
                    )}
                    {errors.opportunity && <p className="text-xs text-destructive">{errors.opportunity}</p>}
                  </div>
                </div>
              )}
            </Section>

            <Section
              title="Programación y Gestión"
              description="Cuándo ocurre, su prioridad y quién la ejecuta."
              icon={ClockIcon}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="act-start" className={FIELD_LABEL}>
                    Desde (Fecha y Hora) {mode === "google" && <span className="text-destructive">*</span>}
                  </Label>
                  <InputGroup>
                    <InputGroupAddon><ClockIcon /></InputGroupAddon>
                    <InputGroupInput
                      id="act-start"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, startDate: "" })) }}
                    />
                  </InputGroup>
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="act-end" className={FIELD_LABEL}>
                    Hasta (Fecha y Hora) {mode === "google" && <span className="text-destructive">*</span>}
                  </Label>
                  <InputGroup>
                    <InputGroupAddon><ClockIcon /></InputGroupAddon>
                    <InputGroupInput
                      id="act-end"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setErrors((p) => ({ ...p, endDate: "" })) }}
                    />
                  </InputGroup>
                  {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
                </div>
              </div>

              {/* Gestión: no aplica a un evento suelto de Google (no crea Actividad CRM) */}
              {!isLooseGoogleEvent && (
              <>
              {/* Prioridad: no aplica a una reunión de Google Calendar Sync */}
              {mode !== "google" && (
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Prioridad</Label>
                <div className="grid overflow-hidden rounded-lg border" style={{ gridTemplateColumns: `repeat(${prioOptions.length || 3}, 1fr)` }}>
                  {(prioOptions.length > 0 ? prioOptions : [{ id: 0, value: "media" }]).map((opt, i) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium capitalize transition-colors",
                        i > 0 && "border-l",
                        priority === opt.value
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {priority === opt.value && <CheckIcon className="size-3.5 shrink-0" />}
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Responsable */}
              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>
                  Responsable <span className="text-destructive">*</span>
                </Label>
                <ResponsiblePicker value={responsible} onChange={setResponsible} />
                {errors.responsible && <p className="text-xs text-destructive">{errors.responsible}</p>}
              </div>
              </>
              )}
            </Section>

            {/* ── Google Calendar Config ── */}
            {mode === "google" && (
                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="size-4 shrink-0 text-violet-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Configuración Google Calendar
                    </p>
                  </div>
                  <div className="space-y-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-950/20">
                    <div className="space-y-1.5">
                      <p className={FIELD_LABEL}>Se agenda en</p>
                      <p className="text-sm">
                        {googleConnection?.account_email ?? googleConnection?.account_name ?? "Tu Google Calendar conectado"}
                      </p>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                          Generar enlace de Google Meet automático
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Crea e inyecta un link de Meet en el evento.
                        </p>
                      </div>
                      <Switch checked={createMeetLink} onCheckedChange={setCreateMeetLink} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Invitados</p>
                      <p className="text-xs text-muted-foreground">
                        Se precarga el contacto de la oportunidad si tiene correo. Agrega o quita libremente.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-violet-200 bg-background p-2 dark:border-violet-800">
                        {attendees.map((email) => (
                          <span
                            key={email}
                            className="flex items-center gap-1 rounded-full bg-violet-100 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeAttendee(email)}
                              className="rounded-full p-0.5 hover:bg-violet-200 dark:hover:bg-violet-800"
                              aria-label={`Quitar ${email}`}
                            >
                              <XIcon className="size-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          value={attendeeInput}
                          onChange={(e) => setAttendeeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addAttendee() }
                          }}
                          onBlur={addAttendee}
                          placeholder={attendees.length === 0 ? "correo@ejemplo.com" : "Agregar otro..."}
                          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            {breadcrumb ? "Anterior" : "Cancelar"}
          </Button>
          <Button
            type="submit"
            form="create-activity-form"
            disabled={submitting}
            className={cn(mode === "google" && "bg-violet-600 hover:bg-violet-700 text-white")}
          >
            {submitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {mode === "google"
              ? "Sincronizar con Google Calendar"
              : isEdit ? "Guardar cambios" : "Guardar actividad"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
