import { FlagIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Etapa (flow_stage) es texto libre configurable por workspace — la base no
// tiene columna de color y hay nombres tipo "Uno"/"Dos"/"Negociacion" (sin
// tilde) junto a "Negociación", así que no es un vocabulario cerrado como
// Fuente. Un solo color identifica la categoría, sin perseguir un color por
// valor. Violeta porque ya es el color de identidad de Oportunidades (el
// ícono de TrendingUp en el Preview y el Detalle ya usa ese tono).
const STAGE_BADGE_CLASS =
  "gap-1 border-violet-200 bg-violet-50 text-violet-700 font-normal dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300"

interface StageBadgeProps {
  stage: string
  className?: string
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  return (
    <Badge variant="outline" className={cn(STAGE_BADGE_CLASS, "max-w-40", className)} title={stage}>
      <FlagIcon className="shrink-0" />
      <span className="min-w-0 truncate">{stage}</span>
    </Badge>
  )
}
