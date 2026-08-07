import { FcGoogle } from "react-icons/fc"
import { cn } from "@/lib/utils"
import { ACTIVITY_TYPE_CONFIG, DEFAULT_TYPE_CONFIG, type Activity } from "@/lib/activity-utils"

export type PillPosition = "single" | "start" | "middle" | "end"

interface EventPillProps {
  activity: Activity
  position?: PillPosition
}

export function EventPill({ activity, position = "single" }: EventPillProps) {
  const { icon: Icon, iconClass, bgClass } = ACTIVITY_TYPE_CONFIG[activity.type] ?? DEFAULT_TYPE_CONFIG
  const isSpan = position !== "single"
  const showIcon = position === "single" || position === "start"
  const synced = !!activity.googleEventId

  return (
    <div
      title={
        (isSpan ? `${activity.title} (${position === "start" ? "inicia" : position === "end" ? "termina" : "continúa"})` : activity.title)
        + (synced ? " · sincronizado con Google Calendar" : "")
      }
      className={cn(
        "flex w-full items-center gap-1 px-1.5 py-0.5 text-xs font-medium truncate",
        isSpan
          ? cn(bgClass, position === "start" ? "rounded-l" : "rounded-l-none", position === "end" ? "rounded-r" : "rounded-r-none")
          : "rounded border bg-muted/40",
      )}
    >
      {showIcon && <Icon className={cn("size-3 shrink-0", iconClass)} />}
      <span className={cn("truncate", isSpan && iconClass)}>{activity.title}</span>
      {position === "single" && synced && <FcGoogle className="size-2.5 shrink-0" />}
      {position === "single" && activity.startTime && (
        <span className="ml-auto shrink-0 text-muted-foreground">{activity.startTime}</span>
      )}
    </div>
  )
}
