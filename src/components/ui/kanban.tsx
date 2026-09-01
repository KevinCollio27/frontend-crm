import * as React from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface KanbanBoardProps {
  children: React.ReactNode
  className?: string
}

interface KanbanColumnProps {
  title: string
  count: number
  subtitle?: string
  subtitleClassName?: string
  onAdd?: () => void
  className?: string
  children: React.ReactNode
}

export function KanbanBoard({ children, className }: KanbanBoardProps) {
  return (
    <div className={cn("flex flex-1 min-h-0 min-w-0 gap-3 overflow-x-auto p-4", className)}>
      {children}
    </div>
  )
}

export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
function KanbanColumn({
  title,
  count,
  subtitle,
  subtitleClassName,
  onAdd,
  className,
  children,
}: KanbanColumnProps, ref) {
  return (
    // bg-muted/50 se ve bien en oscuro (buen contraste contra el fondo), pero en claro
    // --muted ya es casi idéntico al fondo blanco — diluido al 50% la columna
    // desaparecía. En claro se usa sin diluir para que la columna siga siendo visible.
    <div ref={ref} className={cn("flex w-72 shrink-0 flex-col rounded-xl bg-muted dark:bg-muted/50", className)}>
      <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <span className="rounded bg-background px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={onAdd}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {subtitle && (
        <p className={cn("shrink-0 px-3 pb-2 text-xs text-muted-foreground", subtitleClassName)}>{subtitle}</p>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2 scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  )
})
KanbanColumn.displayName = "KanbanColumn"
