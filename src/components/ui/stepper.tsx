import type { LucideIcon } from "lucide-react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepperStep {
  id: number
  label: string
  icon: LucideIcon
}

interface StepperProps {
  steps: StepperStep[]
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {steps.map((step, i) => {
        const Icon = step.icon
        const active = step.id === current
        const done = step.id < current
        return (
          <li key={step.id} className="flex min-w-0 items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                active && "bg-primary text-primary-foreground",
                done && "bg-muted text-foreground",
                !active && !done && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  active && "bg-primary-foreground/20",
                  done && "bg-foreground/10",
                  !active && !done && "bg-muted"
                )}
              >
                {done ? <CheckIcon className="size-3" /> : <Icon className="size-3" />}
              </span>
              {step.label}
            </div>
            {i < steps.length - 1 && <div className="h-px w-4 shrink-0 bg-border" />}
          </li>
        )
      })}
    </ol>
  )
}
