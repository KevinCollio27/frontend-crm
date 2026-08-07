"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PlusIcon } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ACTIVITY_TYPE_CONFIG, DEFAULT_TYPE_CONFIG, type Activity } from "@/lib/activity-utils"
import type { GoogleEvent } from "@/lib/google-event-utils"

interface Props {
  date: Date | null
  activities: Activity[]
  googleEvents: GoogleEvent[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectActivity: (activity: Activity) => void
  onSelectGoogleEvent: (event: GoogleEvent) => void
  onCreateActivity: () => void
}

type DayItem =
  | { kind: "activity"; key: string; time: string; activity: Activity }
  | { kind: "google"; key: string; time: string; event: GoogleEvent }

export function DayActivitiesSheet({
  date,
  activities,
  googleEvents,
  open,
  onOpenChange,
  onSelectActivity,
  onSelectGoogleEvent,
  onCreateActivity,
}: Props) {
  if (!date) return null

  const label = format(date, "EEEE d 'de' MMMM", { locale: es })
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1)

  const items: DayItem[] = [
    ...activities.map((a) => ({ kind: "activity" as const, key: `a-${a.id}`, time: a.startTime ?? "", activity: a })),
    ...googleEvents.map((e) => ({ kind: "google" as const, key: `g-${e.id}`, time: e.startTime ?? "", event: e })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        <div className="shrink-0 border-b px-5 py-4">
          <SheetTitle className="text-lg font-bold">{capitalized}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {activities.length} {activities.length === 1 ? "actividad" : "actividades"}
            {googleEvents.length > 0 && ` · ${googleEvents.length} de Google Calendar`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay actividades este día.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => {
                if (item.kind === "google") {
                  const event = item.event
                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelectGoogleEvent(event)}
                      className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 cursor-pointer dark:border-blue-900 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                        <FcGoogle className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{event.title}</span>
                        <span className="truncate text-xs text-blue-600/70 dark:text-blue-400/70">
                          Google Calendar
                        </span>
                      </div>
                      {event.startTime && (
                        <span className="shrink-0 text-xs text-muted-foreground">{event.startTime}</span>
                      )}
                    </button>
                  )
                }

                const activity = item.activity
                const { icon: Icon, iconClass, bgClass } = ACTIVITY_TYPE_CONFIG[activity.type] ?? DEFAULT_TYPE_CONFIG
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectActivity(activity)}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", bgClass)}>
                      <Icon className={cn("size-4", iconClass)} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        <span className="truncate">{activity.title}</span>
                        {activity.googleEventId && <FcGoogle className="size-3 shrink-0" />}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {activity.responsible.name}
                      </span>
                    </div>
                    {activity.startTime && (
                      <span className="shrink-0 text-xs text-muted-foreground">{activity.startTime}</span>
                    )}
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="text-[10px] font-medium">
                        {activity.responsible.initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <SheetFooter className="shrink-0 border-t px-4 py-3">
          <Button className="w-full gap-1.5" onClick={onCreateActivity}>
            <PlusIcon className="size-4" /> Crear Actividad
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
