import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
} from 'date-fns'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from './types'
import { EventPill } from './EventPill'

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onDayClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function MonthView({ currentDate, events, onDayClick, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2.5 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-t flex-1">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(e.date, day))
          const isCurrentMonth = isSameMonth(day, currentDate)
          const today = isToday(day)

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={cn(
                'min-h-28 border-r border-b p-1.5 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-muted/30',
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
                {dayEvents.slice(0, 3).map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-xs text-muted-foreground px-1.5">
                    +{dayEvents.length - 3} más
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
