"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { ActivityPreviewSheet } from "@/components/dashboard/activities/ActivityPreviewSheet"
import { CreateActivitySheet } from "@/components/dashboard/activities/CreateActivitySheet"
import { DayActivitiesSheet } from "@/components/dashboard/calendar/DayActivitiesSheet"
import { GoogleEventPreviewSheet } from "@/components/dashboard/calendar/GoogleEventPreviewSheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { activityConfirm } from "@/lib/confirm"
import { mapActivity, type Activity } from "@/lib/activity-utils"
import { mapGoogleEvent, type GoogleEvent } from "@/lib/google-event-utils"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { activityService } from "@/services/activity.service"
import { integrationService } from "@/services/integration.service"
import { useSessionStore } from "@/store/session.store"
import { useWorkspaceTimezone } from "@/hooks/useWorkspaceTimezone"
import type { ActivityRaw } from "@/types/activity"

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]

// Mismo mecanismo que CrmCalendar.tsx (actividades CRM + eventos de Google, mismos 4
// sheets) pero en una grilla compacta pensada para el Dashboard — un vistazo de "¿qué
// tengo hoy?", no el calendario completo. A diferencia de las referencias 1-6 (mockups
// hardcodeados a propósito), esta sí sigue el tema claro/oscuro real de la app.
export function MiniCalendarCard() {
  const router = useRouter()
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const timezone = useWorkspaceTimezone()

  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [rawActivities, setRawActivities] = React.useState<ActivityRaw[]>([])
  const [refreshKey, setRefreshKey] = React.useState(0)

  const [googleConnectionId, setGoogleConnectionId] = React.useState<number | null>(null)
  const [googleEvents, setGoogleEvents] = React.useState<GoogleEvent[]>([])

  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null)
  const [daySheetOpen, setDaySheetOpen] = React.useState(false)

  const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const [selectedGoogleEvent, setSelectedGoogleEvent] = React.useState<GoogleEvent | null>(null)
  const [googlePreviewOpen, setGooglePreviewOpen] = React.useState(false)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editActivity, setEditActivity] = React.useState<ActivityRaw | null>(null)

  React.useEffect(() => {
    integrationService.getWorkspaceIntegrations()
      .then((connections) => {
        const conn = connections.find((c) => c.provider_key === "google-calendar" && c.is_active)
        setGoogleConnectionId(conn?.id ?? null)
      })
      .catch(() => setGoogleConnectionId(null))
  }, [])

  React.useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    const from = format(startOfMonth(currentDate), "yyyy-MM-dd")
    const to = format(endOfMonth(currentDate), "yyyy-MM-dd")

    activityService.listByMonth(from, to, workspaceId)
      .then((raw) => {
        if (cancelled) return
        setRawActivities(raw)
        setActivities(raw.map((a) => mapActivity(a, timezone)))
      })
      .catch(() => { if (!cancelled) { setActivities([]); setRawActivities([]) } })

    if (googleConnectionId) {
      integrationService.getGoogleCalendarEvents(googleConnectionId, {
        timeMin: `${from}T00:00:00Z`,
        timeMax: `${to}T23:59:59Z`,
      })
        .then((raw) => { if (!cancelled) setGoogleEvents(raw.map(mapGoogleEvent)) })
        .catch(() => { if (!cancelled) setGoogleEvents([]) })
    } else {
      setGoogleEvents([])
    }

    return () => { cancelled = true }
  }, [currentDate.getFullYear(), currentDate.getMonth(), workspaceId, refreshKey, googleConnectionId, timezone])

  const linkedGoogleEventIds = new Set(activities.map((a) => a.googleEventId).filter((id): id is string => !!id))
  const visibleGoogleEvents = googleEvents.filter((e) => !linkedGoogleEventIds.has(e.id))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const selectedDayActivities = selectedDay
    ? (() => {
        const dayKey = format(selectedDay, "yyyy-MM-dd")
        return activities.filter((a) => dayKey >= a.startDate && dayKey <= (a.endDate || a.startDate))
      })()
    : []

  const selectedDayGoogleEvents = selectedDay
    ? (() => {
        const dayKey = format(selectedDay, "yyyy-MM-dd")
        return visibleGoogleEvents.filter((e) => dayKey >= e.startDate && dayKey <= (e.endDate || e.startDate))
      })()
    : []

  const selectedDayLabel = selectedDay
    ? (() => {
        const label = format(selectedDay, "EEEE d 'de' MMMM", { locale: es })
        return label.charAt(0).toUpperCase() + label.slice(1)
      })()
    : undefined

  function handleDayClick(day: Date) {
    setSelectedDay(day)
    setDaySheetOpen(true)
  }

  function handleSelectActivity(activity: Activity) {
    setSelectedActivity(activity)
    setPreviewOpen(true)
  }

  function handleSelectGoogleEvent(event: GoogleEvent) {
    setSelectedGoogleEvent(event)
    setGooglePreviewOpen(true)
  }

  function handleCreateActivity() {
    setCreateOpen(true)
  }

  function handleEditActivity() {
    if (!selectedActivity) return
    const raw = rawActivities.find((r) => r.id === selectedActivity.id) ?? null
    if (!raw) return
    setPreviewOpen(false)
    setEditActivity(raw)
  }

  async function handleDeleteActivity() {
    if (!selectedActivity) return
    const activity = selectedActivity
    const confirmed = await activityConfirm.delete(activity.title)
    if (!confirmed) return

    setPreviewOpen(false)
    setActivities((prev) => prev.filter((a) => a.id !== activity.id))
    setRawActivities((prev) => prev.filter((a) => a.id !== activity.id))

    try {
      await activityService.delete(activity.id)
      notify.success({ title: "Actividad eliminada", description: `"${activity.title}" fue eliminada.` })
    } catch {
      setRefreshKey((k) => k + 1)
      notify.error({ title: "Algo salió mal", description: "No se pudo eliminar la actividad." })
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CalendarDaysIcon className="size-8 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Calendario</p>
              <p className="text-base font-semibold capitalize">{format(currentDate, "MMMM yyyy", { locale: es })}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setCurrentDate((d) => subMonths(d, 1))}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setCurrentDate((d) => addMonths(d, 1))}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">{d}</div>
          ))}
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd")
            const dayItemsCount =
              activities.filter((a) => dayKey >= a.startDate && dayKey <= (a.endDate || a.startDate)).length +
              visibleGoogleEvents.filter((e) => dayKey >= e.startDate && dayKey <= (e.endDate || e.startDate)).length
            const isCurrentMonth = isSameMonth(day, currentDate)
            const today = isToday(day)

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => handleDayClick(day)}
                className="flex cursor-pointer flex-col items-center gap-0.5 rounded-md py-1 transition-colors hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs",
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                    today && "bg-foreground font-medium text-background"
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className={cn("size-1 rounded-full", dayItemsCount > 0 ? "bg-emerald-500 dark:bg-emerald-400" : "bg-transparent")} />
              </button>
            )
          })}
        </div>
      </CardContent>

      <DayActivitiesSheet
        date={selectedDay}
        activities={selectedDayActivities}
        googleEvents={selectedDayGoogleEvents}
        open={daySheetOpen}
        onOpenChange={setDaySheetOpen}
        onSelectActivity={handleSelectActivity}
        onSelectGoogleEvent={handleSelectGoogleEvent}
        onCreateActivity={handleCreateActivity}
      />

      <ActivityPreviewSheet
        activity={selectedActivity}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onViewDetail={() => {
          if (selectedActivity) router.push(`/crm/activities/${selectedActivity.id}?from=calendar`)
        }}
        onEdit={handleEditActivity}
        onDelete={handleDeleteActivity}
      />

      <GoogleEventPreviewSheet
        event={selectedGoogleEvent}
        open={googlePreviewOpen}
        onOpenChange={setGooglePreviewOpen}
        integrationId={googleConnectionId}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />

      <CreateActivitySheet
        open={createOpen || !!editActivity}
        onOpenChange={(o) => {
          if (!o) { setCreateOpen(false); setEditActivity(null) }
        }}
        activity={editActivity}
        defaultDate={selectedDay ? format(selectedDay, "yyyy-MM-dd") : undefined}
        breadcrumb={selectedDayLabel}
        onSuccess={() => { setEditActivity(null); setRefreshKey((k) => k + 1) }}
      />
    </Card>
  )
}
