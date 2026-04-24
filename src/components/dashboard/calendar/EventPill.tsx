import { Video, Users, CheckSquare, TrendingUp, Phone, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventType } from './types'

const CONFIG: Record<EventType, { icon: React.ComponentType<{ className?: string }>, className: string }> = {
  reunion:     { icon: Users,        className: 'bg-orange-50 text-orange-600 border-orange-100' },
  llamada:     { icon: Phone,        className: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  video:       { icon: Video,        className: 'bg-blue-50 text-blue-600 border-blue-100' },
  tarea:       { icon: CheckSquare,  className: 'bg-green-50 text-green-600 border-green-100' },
  oportunidad: { icon: TrendingUp,   className: 'bg-purple-50 text-purple-600 border-purple-100' },
  otro:        { icon: CalendarIcon, className: 'bg-muted text-muted-foreground border-border' },
}

interface EventPillProps {
  event: CalendarEvent
  onClick?: () => void
}

export function EventPill({ event, onClick }: EventPillProps) {
  const { icon: Icon, className } = CONFIG[event.type]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        'flex w-full items-center gap-1 rounded border px-1.5 py-0.5 text-left text-xs font-medium truncate cursor-pointer',
        className,
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{event.title}</span>
    </button>
  )
}
