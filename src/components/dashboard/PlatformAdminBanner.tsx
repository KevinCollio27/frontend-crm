"use client"

import { ShieldAlertIcon } from "lucide-react"
import { useSessionStore } from "@/store/session.store"
import { Button } from "@/components/ui/button"

export function PlatformAdminBanner() {
  const viewing = useSessionStore((s) => s.platformAdminViewing)
  const exit = useSessionStore((s) => s.exitPlatformAdminView)

  if (!viewing) return null

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 bg-amber-500 px-4 py-1.5 text-xs font-medium text-black">
      <span className="flex items-center gap-1.5">
        <ShieldAlertIcon className="size-3.5" />
        Modo admin de plataforma — viendo &ldquo;{viewing.name}&rdquo;, no es tu workspace.
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs text-black hover:bg-black/10 hover:text-black"
        onClick={() => {
          exit()
          window.location.replace("/")
        }}
      >
        Salir
      </Button>
    </div>
  )
}
