import { BriefcaseIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Cargo es texto libre (cientos de valores distintos, sin vocabulario fijo
// como Fuente) — un solo color identifica la categoría y un único ícono fijo
// (no uno por valor, como en Fuente) refuerza que es "un cargo". Teal para
// diferenciarlo del indigo de Fuente en la misma fila.
const POSITION_BADGE_CLASS =
  "gap-1 border-teal-200 bg-teal-50 text-teal-700 font-normal dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-300"

interface PositionBadgeProps {
  position: string
  className?: string
}

export function PositionBadge({ position, className }: PositionBadgeProps) {
  return (
    <Badge variant="outline" className={cn(POSITION_BADGE_CLASS, className)}>
      <BriefcaseIcon />
      {position}
    </Badge>
  )
}
