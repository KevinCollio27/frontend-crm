export type EventType = 'reunion' | 'llamada' | 'video' | 'tarea' | 'oportunidad' | 'otro'

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  time?: string
  type: EventType
}
