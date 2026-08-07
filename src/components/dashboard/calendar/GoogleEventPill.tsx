import { FcGoogle } from "react-icons/fc"
import type { GoogleEvent } from "@/lib/google-event-utils"

interface GoogleEventPillProps {
  event: Pick<GoogleEvent, "title" | "startTime">
}

export function GoogleEventPill({ event }: GoogleEventPillProps) {
  return (
    <div
      title={event.title}
      className="flex w-full items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 truncate dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
    >
      <FcGoogle className="size-3 shrink-0" />
      <span className="truncate">{event.title}</span>
      {event.startTime && (
        <span className="ml-auto shrink-0 text-blue-600/70 dark:text-blue-400/70">{event.startTime}</span>
      )}
    </div>
  )
}
