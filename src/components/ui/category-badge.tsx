import { FolderIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Categoría de documento es texto libre en la práctica (la base tiene
// "Contrato / Acuerdo", "otro", "legal", "Propuesta Comercial", mayúsculas
// mezcladas...) — mismo criterio que Cargo en Contactos: un solo color
// identifica la categoría, sin perseguir un color por valor. Cian para
// diferenciarlo del indigo de Fuente y el teal de Cargo.
const CATEGORY_BADGE_CLASS =
  "gap-1 border-cyan-200 bg-cyan-50 text-cyan-700 font-normal dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-300"

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge variant="outline" className={cn(CATEGORY_BADGE_CLASS, "max-w-40", className)} title={category}>
      <FolderIcon className="shrink-0" />
      <span className="min-w-0 truncate">{category}</span>
    </Badge>
  )
}
