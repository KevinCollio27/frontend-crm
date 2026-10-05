"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  Building2Icon,
  CalendarCheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  StickyNoteIcon,
  TargetIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/table-utils"
import {
  OVERDUE_BADGE_CLASS,
  PRIORITY_CONFIG,
  STAGE_CONFIG,
  mapActivity, getActivityTypeConfig } from "@/lib/activity-utils"
import { activityService } from "@/services/activity.service"
import { noteService } from "@/services/note.service"
import { notify } from "@/lib/notify"
import { useWorkspaceTimezone } from "@/hooks/useWorkspaceTimezone"
import type { ActivityRaw } from "@/types/activity"
import type { NoteRaw } from "@/types/note"
import { ActivityStatusPicker } from "./detail/ActivityStatusPicker"
import { NotasTab } from "./detail/tabs/NotasTab"
import { HistorialTab } from "./detail/tabs/HistorialTab"

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type PreviewTab = "general" | "notas" | "historial"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

function fmtDay(ymd: string) {
  if (!ymd) return "—"
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
}

function fmtAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return "recién"
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" })
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center justify-end gap-1.5 text-sm">{children}</div>
    </div>
  )
}

function SectionTitle({ icon: Icon, children, action }: { icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {children}
      </h3>
      {action}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  activityId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Solo los calendarios: ahí la vista previa es la única salida al detalle, a editar y a eliminar */
  onViewDetail?: () => void
  onEdit?: () => void
  onDelete?: () => void
  /** Avisa que cambió el estado desde la vista previa, para refrescar la lista */
  onActivityChange?: () => void
}

// Vista rápida de una actividad, pensada para el seguimiento: lo central son las notas.
// Recibe solo el id y trae la actividad completa, así se ve igual desde la tabla, el
// tablero y los calendarios (antes cada uno le pasaba datos distintos y a medias).
export function ActivityPreviewSheet({ activityId, open, onOpenChange, onViewDetail, onEdit, onDelete, onActivityChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 640, padding: 0, gap: 0 }} className="w-full!">
        {open && activityId !== null && (
          <ActivityPreviewBody
            key={activityId}
            activityId={activityId}
            onClose={() => onOpenChange(false)}
            onViewDetail={onViewDetail}
            onEdit={onEdit}
            onDelete={onDelete}
            onActivityChange={onActivityChange}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Body ─────────────────────────────────────────────────────────────────────

function ActivityPreviewBody({
  activityId,
  onClose,
  onViewDetail,
  onEdit,
  onDelete,
  onActivityChange,
}: {
  activityId: number
  onClose: () => void
  onViewDetail?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onActivityChange?: () => void
}) {
  const timezone = useWorkspaceTimezone()
  // Abre en Notas: la vista previa es para el seguimiento, el resumen va en General
  const [tab, setTab] = React.useState<PreviewTab>("notas")
  const [raw, setRaw] = React.useState<ActivityRaw | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [lastNote, setLastNote] = React.useState<NoteRaw | null>(null)
  const [noteCount, setNoteCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    activityService
      .getById(activityId)
      .then((a) => { if (!cancelled) setRaw(a) })
      .catch(() => notify.error({ title: "No se pudo cargar la actividad" }))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activityId])

  // Última nota y total (contador de la pestaña) — se vuelve a pedir al cambiar de pestaña,
  // por si se agregaron o borraron notas en Notas
  React.useEffect(() => {
    let cancelled = false
    noteService
      .list({ opportunity_activity_id: activityId, take: 1, page: 1 })
      .then((res) => {
        if (cancelled) return
        setLastNote(res.data[0] ?? null)
        setNoteCount(res.total)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [activityId, tab])

  function handleStatusChange(updates: Partial<ActivityRaw>) {
    setRaw((prev) => (prev ? { ...prev, ...updates } : prev))
    onActivityChange?.()
  }

  if (loading || !raw) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex justify-end border-b p-3">
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          {loading
            ? <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            : <p className="text-sm text-muted-foreground">No se pudo cargar la actividad.</p>}
        </div>
      </div>
    )
  }

  const activity     = mapActivity(raw, timezone)
  const typeConfig   = getActivityTypeConfig(activity.type)
  const TypeIcon     = typeConfig.icon
  const stageConf    = STAGE_CONFIG[activity.stageId] ?? STAGE_CONFIG.pendiente
  const priorityConf = PRIORITY_CONFIG[activity.priority] ?? null
  const isClosed     = activity.stageId === "completada" || activity.stageId === "cancelada"
  const overdue      = !isClosed && !!activity.endDate && activity.endDate < TODAY
  const opportunity  = raw.opportunity
  const tabs: { id: PreviewTab; label: string }[] = [
    { id: "notas",     label: noteCount ? `Notas (${noteCount})` : "Notas" },
    { id: "general",   label: "General" },
    { id: "historial", label: "Historial" },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-3 border-b p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", typeConfig.bgClass)}>
              <TypeIcon className={cn("size-5", typeConfig.iconClass)} />
            </div>
            <div className="min-w-0 space-y-0.5">
              <SheetTitle className="truncate text-base leading-snug">{activity.title || "Sin título"}</SheetTitle>
              <SheetDescription className="sr-only">Vista previa de la actividad</SheetDescription>
              <p className="truncate text-xs text-muted-foreground">
                {activity.type || "Sin tipo"} · {activity.responsible.name}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", stageConf.badge)}>
            <span className={cn("size-1.5 rounded-full", stageConf.dot)} />
            {stageConf.label}
          </span>
          {overdue && (
            <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs", OVERDUE_BADGE_CLASS)}>Atrasada</Badge>
          )}
          {priorityConf && (
            <Badge variant="outline" className={cn("gap-1 rounded-full px-2.5 py-0.5 text-xs", priorityConf.badge)}>
              <priorityConf.icon className="size-3" />
              {priorityConf.label}
            </Badge>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg border p-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "general" && (
          <>
            <section className="space-y-2.5 border-b p-4">
              <SectionTitle icon={CalendarCheckIcon}>Estado</SectionTitle>
              <ActivityStatusPicker activity={raw} onStatusChange={handleStatusChange} />
            </section>

            <section className="space-y-2 border-b p-4">
              <InfoRow label="Responsable">
                <Avatar className="size-5 shrink-0">
                  <AvatarImage src={activity.responsible.avatarUrl ?? "https://github.com/shadcn.png"} alt={activity.responsible.name} />
                  <AvatarFallback className="text-[9px] font-semibold">{getInitials(activity.responsible.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{activity.responsible.name}</span>
              </InfoRow>
              <InfoRow label="Desde">
                <span>{fmtDay(activity.startDate)}{activity.startTime ? ` · ${activity.startTime}` : ""}</span>
              </InfoRow>
              <InfoRow label="Hasta">
                <span className={cn(overdue && "font-medium text-red-600 dark:text-red-400")}>{fmtDay(activity.endDate)}</span>
              </InfoRow>
              {raw.ubication && (
                <InfoRow label="Ubicación"><span className="truncate">{raw.ubication}</span></InfoRow>
              )}
              {activity.googleEventId && (
                <InfoRow label="Calendario"><span>Sincronizada con Google Calendar</span></InfoRow>
              )}
              <InfoRow label="Creada"><span>{fmtDay(activity.createdAt)}</span></InfoRow>
            </section>

            {opportunity && (
              <section className="space-y-2 border-b p-4">
                <SectionTitle icon={TargetIcon}>Oportunidad</SectionTitle>
                <Link
                  href={`/crm/funnels/${opportunity.id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{opportunity.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[opportunity.flow?.name, opportunity.flow_stage?.name].filter(Boolean).join(" · ") || "Sin pipeline"}
                    </p>
                  </div>
                  <ArrowUpRightIcon className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </Link>
                {(opportunity.person || opportunity.organization) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {opportunity.person && (
                      <InfoRow label="Contacto">
                        <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{opportunity.person.name}</span>
                      </InfoRow>
                    )}
                    {opportunity.organization && (
                      <InfoRow label="Empresa">
                        <Building2Icon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{opportunity.organization.name}</span>
                      </InfoRow>
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="space-y-2 p-4">
              <SectionTitle
                icon={StickyNoteIcon}
                action={noteCount ? (
                  <button
                    type="button"
                    onClick={() => setTab("notas")}
                    className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
                  >
                    Ver todas ({noteCount}) <ChevronRightIcon className="size-3.5" />
                  </button>
                ) : null}
              >
                Última nota
              </SectionTitle>
              {lastNote ? (
                <button
                  type="button"
                  onClick={() => setTab("notas")}
                  className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium">{lastNote.title || "Sin título"}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{fmtAgo(lastNote.created_at)}</span>
                  </div>
                  <div
                    className="note-preview mt-1.5 line-clamp-4 text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: lastNote.content }}
                  />
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-muted/50 px-3 py-5">
                  <p className="text-xs text-muted-foreground">Esta actividad todavía no tiene notas.</p>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setTab("notas")}>
                    Agregar nota
                  </Button>
                </div>
              )}
            </section>
          </>
        )}

        {tab === "notas"     && <NotasTab activityId={activityId} />}
        {tab === "historial" && <HistorialTab activityId={activityId} />}
      </div>

      {/* Footer — en Actividades solo Cancelar; los calendarios agregan Ver detalles / Editar / Eliminar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3">
        <div className="flex items-center gap-2">
          {onViewDetail && (
            <Button type="button" variant="outline" className="h-8 text-xs" onClick={onViewDetail}>Ver detalles</Button>
          )}
          {onEdit && (
            <Button type="button" variant="outline" className="h-8 text-xs" onClick={onEdit}>Editar</Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              className="h-8 border-red-100 bg-red-50 text-xs text-red-500 hover:bg-red-100 hover:text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
              onClick={onDelete}
            >
              <Trash2Icon className="size-3.5" /> Eliminar
            </Button>
          )}
          <Button type="button" variant="outline" className="h-8 text-xs" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  )
}
