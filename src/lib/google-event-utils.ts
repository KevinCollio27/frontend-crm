import type { GoogleAttendeeRaw, GoogleCalendarEventRaw } from "@/types/integration"

export type { GoogleAttendeeRaw, GoogleAttendeeStatus } from "@/types/integration"

export interface GoogleEvent {
  id: string
  title: string
  description?: string
  location?: string
  attendees: GoogleAttendeeRaw[]
  htmlLink: string
  meetLink?: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
}

function splitDateTime(value: string) {
  const isAllDay = !value.includes("T")
  return {
    date: value.slice(0, 10),
    time: isAllDay ? undefined : value.slice(11, 16),
  }
}

export function mapGoogleEvent(raw: GoogleCalendarEventRaw): GoogleEvent {
  const start = splitDateTime(raw.start)
  const end = splitDateTime(raw.end)
  return {
    id: raw.id,
    title: raw.title || "(Sin título)",
    description: raw.description,
    location: raw.location,
    attendees: raw.attendees ?? [],
    htmlLink: raw.htmlLink,
    meetLink: raw.meetLink,
    startDate: start.date,
    endDate: end.date,
    startTime: start.time,
    endTime: end.time,
  }
}
