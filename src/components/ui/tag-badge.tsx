import { TagIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Etiqueta es vocabulario definido por el workspace (Conductor, Cliente, ...) —
// mismo criterio que Fuente y Cargo: un solo color identifica la categoría y el
// ícono es fijo, no uno por valor. Naranja para diferenciarlo del indigo de
// Fuente y el teal de Cargo en la misma fila, con variante dark: propia.
const TAG_BADGE_CLASS =
  "gap-1 border-orange-200 bg-orange-50 text-orange-700 font-normal dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300"

export function TagBadge({ name, className }: { name: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(TAG_BADGE_CLASS, "max-w-36", className)} title={name}>
      <TagIcon className="shrink-0" />
      <span className="min-w-0 truncate">{name}</span>
    </Badge>
  )
}

// Muestra las primeras `max` etiquetas y el resto como "+N" (el detalle va en el title).
export function TagBadgeList({ tags, max = 2 }: { tags: string[]; max?: number }) {
  const visible = tags.slice(0, max)
  const hidden = tags.slice(max)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((t) => (
        <TagBadge key={t} name={t} />
      ))}
      {hidden.length > 0 && (
        <Badge variant="outline" className="font-normal text-muted-foreground" title={hidden.join(", ")}>
          +{hidden.length}
        </Badge>
      )}
    </div>
  )
}
