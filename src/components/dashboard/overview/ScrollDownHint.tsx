"use client"

import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Botón flotante que baja el scroll de a un paso (no salta directo al final) — visible
// solo mientras queda contenido debajo; se desvanece solo al llegar al fondo, esa
// desaparición ya funciona como la señal de "no hay más" (sin necesitar un contador aparte).
export function ScrollDownHint({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "absolute bottom-1.5 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-opacity hover:text-foreground",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <ChevronDownIcon className="size-4" />
    </button>
  )
}
