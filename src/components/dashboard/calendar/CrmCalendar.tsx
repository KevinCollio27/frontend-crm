'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonthView } from './MonthView'
import { DayActivitiesSheet } from './DayActivitiesSheet'
import { GoogleEventPreviewSheet } from './GoogleEventPreviewSheet'
import { ActivityPreviewSheet } from '@/components/dashboard/activities/ActivityPreviewSheet'
import { CreateActivitySheet } from '@/components/dashboard/activities/CreateActivitySheet'
import { activityService } from '@/services/activity.service'
import { integrationService } from '@/services/integration.service'
import { mapActivity, type Activity } from '@/lib/activity-utils'
import { mapGoogleEvent, type GoogleEvent } from '@/lib/google-event-utils'
import { activityConfirm } from '@/lib/confirm'
import { notify } from '@/lib/notify'
import { useSessionStore } from '@/store/session.store'
import { useWorkspaceTimezone } from '@/hooks/useWorkspaceTimezone'
import type { ActivityRaw } from '@/types/activity'

export function CrmCalendar() {
  const router = useRouter()
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const timezone = useWorkspaceTimezone()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [activities, setActivities] = useState<Activity[]>([])
  const [rawActivities, setRawActivities] = useState<ActivityRaw[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const [googleConnectionId, setGoogleConnectionId] = useState<number | null>(null)
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([])

  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [daySheetOpen, setDaySheetOpen] = useState(false)

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<GoogleEvent | null>(null)
  const [googlePreviewOpen, setGooglePreviewOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editActivity, setEditActivity] = useState<ActivityRaw | null>(null)

  // Se resuelve una sola vez: si el workspace tiene Google Calendar conectado y activo,
  // sus eventos se piden junto con las actividades en cada cambio de mes.
  useEffect(() => {
    integrationService.getWorkspaceIntegrations()
      .then((connections) => {
        const conn = connections.find((c) => c.provider_key === 'google-calendar' && c.is_active)
        setGoogleConnectionId(conn?.id ?? null)
      })
      .catch(() => setGoogleConnectionId(null))
  }, [])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    const from = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const to = format(endOfMonth(currentDate), 'yyyy-MM-dd')

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

  // Un evento de Google ya enlazado a una Actividad CRM (via activity_calendar_events)
  // no se muestra aparte — la Actividad ya lo representa (con su propio indicador de sync).
  const linkedGoogleEventIds = new Set(activities.map((a) => a.googleEventId).filter((id): id is string => !!id))
  const visibleGoogleEvents = googleEvents.filter((e) => !linkedGoogleEventIds.has(e.id))

  const goToPrev  = () => setCurrentDate((d) => subMonths(d, 1))
  const goToNext  = () => setCurrentDate((d) => addMonths(d, 1))
  const goToToday = () => setCurrentDate(new Date())

  const monthLabel = format(currentDate, "MMMM 'DE' yyyy", { locale: es }).toUpperCase()

  const selectedDayActivities = selectedDay
    ? (() => {
        const dayKey = format(selectedDay, 'yyyy-MM-dd')
        return activities.filter((a) => dayKey >= a.startDate && dayKey <= (a.endDate || a.startDate))
      })()
    : []

  const selectedDayGoogleEvents = selectedDay
    ? (() => {
        const dayKey = format(selectedDay, 'yyyy-MM-dd')
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

  // El day-sheet queda abierto detrás: al cerrar el preview o el create,
  // el usuario vuelve al listado del día sin perder contexto (mismo patrón que CreateContactSheet → CreateOrganizationSheet).
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
    <div className="flex flex-col flex-1 rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Button variant="outline" size="icon" onClick={goToPrev}>
          <ChevronLeft className="size-4" />
        </Button>

        <h2 className="text-sm font-bold tracking-wide">{monthLabel}</h2>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <MonthView
          currentDate={currentDate}
          activities={activities}
          googleEvents={visibleGoogleEvents}
          onDayClick={handleDayClick}
        />
      </div>

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
        defaultDate={selectedDay ? format(selectedDay, 'yyyy-MM-dd') : undefined}
        breadcrumb={selectedDayLabel}
        onSuccess={() => { setEditActivity(null); setRefreshKey((k) => k + 1) }}
      />
    </div>
  )
}
