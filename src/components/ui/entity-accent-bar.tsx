import { getAccentClass } from "@/lib/table-utils"
import { cn } from "@/lib/utils"

interface EntityAccentBarProps {
  seed: number
  className?: string
}

export function EntityAccentBar({ seed, className }: EntityAccentBarProps) {
  return <span className={cn("w-1 shrink-0 rounded-full", getAccentClass(seed), className)} />
}
