"use client"

import * as React from "react"
import { ArrowLeftIcon, BriefcaseIcon, DownloadIcon, InboxIcon, Loader2Icon, SearchIcon, UsersIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getInitials } from "@/lib/table-utils"
import { formService } from "@/services/form.service"
import { useIsMobile } from "@/hooks/use-mobile"
import { FormAnswerDetail } from "./FormAnswerDetail"
import { VacantesExportSheet } from "./VacantesExportSheet"
import { answerDisplayName, formatAnswerDate, formColor, truncateText } from "./FormAnswersBoard"
import type { FormAnswerRaw, VacanteSummary } from "@/types/form"

// ─── Col 1: listado de vacantes ────────────────────────────────────────────────

export function VacantesBoard({ viewToggle }: { viewToggle?: React.ReactNode } = {}) {
  const [vacantes, setVacantes] = React.useState<VacanteSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [selectedVacanteId, setSelectedVacanteId] = React.useState<number | null>(null)

  // Col 2 — postulantes de la vacante seleccionada
  const [postulantes, setPostulantes] = React.useState<FormAnswerRaw[]>([])
  const [loadingPostulantes, setLoadingPostulantes] = React.useState(false)
  const [selectedAnswerId, setSelectedAnswerId] = React.useState<number | null>(null)

  const [exportOpen, setExportOpen] = React.useState(false)

  const isMobile = useIsMobile()
  // 3 columnas no caben en un celular — en mobile se navega de a un nivel por
  // vez: Vacantes → Postulantes → Detalle, con botón "Volver" en cada paso.
  const [mobileStep, setMobileStep] = React.useState<"vacantes" | "postulantes" | "detalle">("vacantes")

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    formService.listVacantes()
      .then((data) => {
        if (cancelled) return
        setVacantes(data)
        setSelectedVacanteId(data[0]?.id ?? null)
      })
      .catch(() => { if (!cancelled) setVacantes([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => {
    if (selectedVacanteId === null) {
      setPostulantes([])
      setSelectedAnswerId(null)
      return
    }
    let cancelled = false
    setLoadingPostulantes(true)
    formService.listPostulantesByVacante(selectedVacanteId)
      .then((data) => {
        if (cancelled) return
        setPostulantes(data)
        setSelectedAnswerId(data[0]?.id ?? null)
      })
      .catch(() => { if (!cancelled) { setPostulantes([]); setSelectedAnswerId(null) } })
      .finally(() => { if (!cancelled) setLoadingPostulantes(false) })
    return () => { cancelled = true }
  }, [selectedVacanteId])

  function handleToggled(answerId: number, isActive: boolean) {
    setPostulantes((prev) => prev.map((a) => (a.id === answerId ? { ...a, is_active: isActive } : a)))
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vacantes
    return vacantes.filter((v) =>
      (v.titulo ?? "").toLowerCase().includes(q) ||
      (v.empresa ?? "").toLowerCase().includes(q)
    )
  }, [vacantes, search])

  const selectedAnswer = postulantes.find((a) => a.id === selectedAnswerId) ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Row 1 — view toggle, mismo alto que Lista para que cambiar de tab no
          dé el salto visual de pasar de una fila a otra de distinta altura. */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        {viewToggle}
      </div>

      {/* Row 2 — filters. Solo tiene sentido con la lista de vacantes visible —
          en mobile se oculta en los pasos de Postulantes/Detalle. */}
      {(!isMobile || mobileStep === "vacantes") && (
      <div className="flex shrink-0 flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="relative w-full shrink-0 md:w-44">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar vacante..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="w-full shrink-0 text-xs text-muted-foreground md:w-auto">
            {loading ? "…" : `${vacantes.length} vacante${vacantes.length === 1 ? "" : "s"}`}
          </span>
          <Button type="button" variant="outline" size="sm" className="h-8 w-full shrink-0 md:w-auto" onClick={() => setExportOpen(true)} disabled={vacantes.length === 0}>
            <DownloadIcon className="size-3.5" />
            Exportar
          </Button>
        </div>
      </div>
      )}

      {exportOpen && (
        <VacantesExportSheet
          open
          onOpenChange={setExportOpen}
          vacantes={vacantes}
          preselectedId={selectedVacanteId}
        />
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Col 1 — en mobile, pantalla completa y solo en el paso "vacantes" */}
        <div className={cn(
          "w-full shrink-0 flex-col overflow-hidden border-r md:flex md:w-72",
          mobileStep === "vacantes" ? "flex" : "hidden md:flex"
        )}>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <BriefcaseIcon className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No hay vacantes publicadas.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 px-2 pb-2">
                {filtered.map((vacante) => (
                  <button
                    key={vacante.id}
                    type="button"
                    onClick={() => { setSelectedVacanteId(vacante.id); if (isMobile) setMobileStep("postulantes") }}
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selectedVacanteId === vacante.id ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{vacante.titulo ?? "Vacante"}</p>
                      {!vacante.is_active && (
                        <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0 text-[0.65rem] font-normal">
                          Inactiva
                        </Badge>
                      )}
                    </div>
                    {vacante.empresa && (
                      <p className="truncate text-xs text-muted-foreground">{vacante.empresa}</p>
                    )}
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <UsersIcon className="size-3" />
                      {vacante.postulantes_count} postulante{vacante.postulantes_count === 1 ? "" : "s"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col 2 — postulantes de la vacante seleccionada. En mobile, pantalla
            completa y solo en el paso "postulantes". */}
        <div className={cn(
          "w-full shrink-0 flex-col overflow-hidden border-r md:flex md:w-96",
          mobileStep === "postulantes" ? "flex" : "hidden md:flex"
        )}>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileStep("vacantes")}
              className="flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
            >
              <ArrowLeftIcon className="size-3.5" />
              Volver a vacantes
            </button>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingPostulantes ? (
              <div className="flex justify-center py-10">
                <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : postulantes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <InboxIcon className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {selectedVacanteId === null ? "Selecciona una vacante." : "Esta vacante todavía no tiene postulantes."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 px-2 pb-2">
                {postulantes.map((answer) => {
                  const name = answerDisplayName(answer)
                  const isActive = selectedAnswerId === answer.id
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => { setSelectedAnswerId(answer.id); if (isMobile) setMobileStep("detalle") }}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <Avatar size="default" className="mt-0.5 shrink-0">
                        <AvatarImage src="https://github.com/shadcn.png" alt={name} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatAnswerDate(answer.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {answer.form && (
                            <Badge
                              className={cn("shrink-0 rounded-full border-0 px-2 py-0 text-[0.65rem] font-medium", formColor(answer.form.id))}
                              title={answer.form.name}
                            >
                              {truncateText(answer.form.name, 28)}
                            </Badge>
                          )}
                          {!answer.is_active && (
                            <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0 text-[0.65rem] font-normal">
                              Oculta
                            </Badge>
                          )}
                        </div>
                        {answer.person?.email && (
                          <p className="truncate text-xs text-muted-foreground">{answer.person.email}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Col 3 — vista previa. En mobile, pantalla completa y solo en el paso "detalle". */}
        <div className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden md:flex",
          mobileStep === "detalle" ? "flex" : "hidden md:flex"
        )}>
          {selectedAnswer ? (
            <FormAnswerDetail
              answer={selectedAnswer}
              onToggled={handleToggled}
              onBack={isMobile ? () => setMobileStep("postulantes") : undefined}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecciona un postulante para ver el detalle
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
