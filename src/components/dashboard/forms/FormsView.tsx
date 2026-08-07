"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BriefcaseIcon, InboxIcon, ListIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormsTable } from "./FormsTable"
import { FormAnswersBoard } from "./FormAnswersBoard"
import { VacantesBoard } from "./VacantesBoard"

type View = "lista" | "respuestas" | "vacantes"

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange("lista")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
          view === "lista"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ListIcon className="size-3.5" />
        Lista
      </button>
      <button
        type="button"
        onClick={() => onChange("respuestas")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
          view === "respuestas"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <InboxIcon className="size-3.5" />
        Respuestas
      </button>
      <button
        type="button"
        onClick={() => onChange("vacantes")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
          view === "vacantes"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <BriefcaseIcon className="size-3.5" />
        Vacantes
      </button>
    </div>
  )
}

export function FormsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [view, setView] = React.useState<View>(
    () => (searchParams.get("view") as View) ?? "lista"
  )

  function changeView(v: View) {
    setView(v)
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", v)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const toggle = <ViewToggle view={view} onChange={changeView} />

  // "Lista" es una tabla normal que crece con el contenido (necesita que la página
  // scrollee) — "Respuestas" es un layout de 2 columnas de altura fija con su propio
  // scroll interno, mismo criterio que Correo. Por eso el wrapper cambia según la
  // vista en vez de forzar un único estilo para las dos.
  if (view === "respuestas") {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <FormAnswersBoard viewToggle={toggle} />
      </div>
    )
  }

  if (view === "vacantes") {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <VacantesBoard viewToggle={toggle} />
      </div>
    )
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <FormsTable viewToggle={toggle} />
    </main>
  )
}
