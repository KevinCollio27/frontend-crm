import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Activity } from '@/lib/activity-utils'
import type { GoogleEvent } from '@/lib/google-event-utils'
import { EventPill, type PillPosition } from './EventPill'
import { GoogleEventPill } from './GoogleEventPill'

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

// Mismos matices que ACTIVITY_TYPE_CONFIG (activity-utils.ts), pero en versión
// "punto sólido" para la grilla compacta de mobile — bgClass ahí es un fondo pálido
// (bg-violet-50) pensado para pills, no sirve como punto visible a este tamaño.
const DOT_COLOR: Record<string, string> = {
  'Reunión':       'bg-violet-500',
  'Llamada':       'bg-blue-500',
  'Correo':        'bg-amber-500',
  'Seguimiento':   'bg-cyan-500',
  'Revisión':      'bg-orange-500',
  'Planificación': 'bg-emerald-500',
  'Video Llamada': 'bg-pink-500',
  'Visita':        'bg-red-500',
}
const DEFAULT_DOT_COLOR = 'bg-muted-foreground/40'
const MAX_DOTS = 4

function getPillPosition(activity: Activity, dayKey: string): PillPosition {
  const isRange = !!activity.endDate && activity.endDate !== activity.startDate
  if (!isRange) return 'single'
  if (dayKey === activity.startDate) return 'start'
  if (dayKey === activity.endDate) return 'end'
  return 'middle'
}

interface MonthViewProps {
  currentDate: Date
  activities: Activity[]
  googleEvents?: GoogleEvent[]
  onDayClick?: (date: Date) => void
}

export function MonthView({ currentDate, activities, googleEvents = [], onDayClick }: MonthViewProps) {
  const isMobile = useIsMobile()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeksCount = days.length / 7
  // En mobile no se listan los eventos dentro de la celda (sección "Grilla compacta con
  // puntos" de RESPONSIVIDAD.md) — la celda baja de altura porque ya no necesita espacio
  // para pills, solo para el número del día + una fila de puntos.
  const rowMinHeight = isMobile ? 64 : 112

  return (
    <div className="flex flex-col">
      {/* z-[1]: alcanza para taparle el paso a las celdas de días que scrollean debajo,
          pero sin empatar con el z-10 del Sidebar (SidebarInset no arma su propio stacking
          context, así que un z-10 acá competía directo contra el Sidebar y, en empate, ganaba
          el contenido por venir después en el DOM — tapaba el panel del workspace switcher). */}
      <div className="sticky top-0 z-1 grid grid-cols-7 border-b bg-background">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2.5 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 border-l border-t"
        style={{ gridTemplateRows: `repeat(${weeksCount}, minmax(${rowMinHeight}px, 1fr))` }}
      >
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayActivities = activities.filter((a) => dayKey >= a.startDate && dayKey <= (a.endDate || a.startDate))
          const dayGoogleEvents = googleEvents.filter((e) => dayKey >= e.startDate && dayKey <= (e.endDate || e.startDate))
          const dayItemsCount = dayActivities.length + dayGoogleEvents.length
          const isCurrentMonth = isSameMonth(day, currentDate)
          const today = isToday(day)

          return (
            <div
              key={dayKey}
              onClick={() => onDayClick?.(day)}
              className={cn(
                'min-h-0 min-w-0 border-r border-b p-1.5 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-muted/30',
                today && 'ring-1 ring-inset ring-foreground',
              )}
            >
              <span
                className={cn(
                  'text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shrink-0',
                  isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40',
                  today && 'bg-foreground text-background',
                )}
              >
                {format(day, 'd')}
              </span>

              {isMobile ? (
                dayItemsCount > 0 && (
                  <div className="flex flex-wrap items-center gap-1 px-0.5">
                    {dayActivities.slice(0, MAX_DOTS).map((activity) => (
                      <span
                        key={activity.id}
                        title={activity.title}
                        className={cn('size-1.5 shrink-0 rounded-full', DOT_COLOR[activity.type] ?? DEFAULT_DOT_COLOR)}
                      />
                    ))}
                    {dayGoogleEvents.slice(0, Math.max(0, MAX_DOTS - dayActivities.length)).map((event) => (
                      <span key={event.id} title={event.title} className="size-1.5 shrink-0 rounded-full bg-blue-400" />
                    ))}
                    {dayItemsCount > MAX_DOTS && (
                      <span className="text-[10px] leading-none text-muted-foreground">+{dayItemsCount - MAX_DOTS}</span>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayActivities.slice(0, 3).map((activity) => (
                    <EventPill key={activity.id} activity={activity} position={getPillPosition(activity, dayKey)} />
                  ))}
                  {dayGoogleEvents.slice(0, Math.max(0, 3 - dayActivities.length)).map((event) => (
                    <GoogleEventPill key={event.id} event={event} />
                  ))}
                  {dayItemsCount > 3 && (
                    <span className="text-xs text-muted-foreground px-1.5">
                      +{dayItemsCount - 3} más
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
