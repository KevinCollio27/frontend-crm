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
import type { Activity } from '@/lib/activity-utils'
import type { GoogleEvent } from '@/lib/google-event-utils'
import { EventPill, type PillPosition } from './EventPill'
import { GoogleEventPill } from './GoogleEventPill'

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

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
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeksCount = days.length / 7

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 grid grid-cols-7 border-b bg-background">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2.5 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 border-l border-t"
        style={{ gridTemplateRows: `repeat(${weeksCount}, minmax(112px, 1fr))` }}
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
