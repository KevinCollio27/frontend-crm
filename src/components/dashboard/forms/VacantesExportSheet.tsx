"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  InfoIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { getSocket } from "@/lib/socket"
import { useSessionStore } from "@/store/session.store"
import { formService } from "@/services/form.service"
import { fileReportService } from "@/services/fileReport.service"
import type { FileReport } from "@/types/fileReport"
import type { VacanteSummary } from "@/types/form"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vacantes: VacanteSummary[]
  preselectedId?: number | null
}

type Step = "select" | "confirm" | "generating" | "ready" | "error"

const EXPORT_FILE_PREFIX = "vacantes_"

const BACK_TARGET: Partial<Record<Step, Step>> = {
  confirm: "select",
  error: "confirm",
}

const TITLES: Record<Step, string> = {
  select: "Exportar vacantes",
  confirm: "Exportar vacantes",
  generating: "Exportar vacantes",
  ready: "Exportar vacantes",
  error: "Exportar vacantes",
}

// ─── Sheet lateral de exportación — mismo patrón (Sheet + file_report + socket)
// que OrganizationsImportExportSheet.tsx, pero solo con el flujo de exportar y un
// paso extra de selección: una hoja por vacante elegida, en el mismo archivo.

export function VacantesExportSheet({ open, onOpenChange, vacantes, preselectedId }: Props) {
  const userId = useSessionStore((s) => s.user?.id)
  const [step, setStep] = React.useState<Step>("select")
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<number>>(new Set())

  const [exporting, setExporting] = React.useState(false)
  const [exportFileName, setExportFileName] = React.useState("")
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null)
  const [exportError, setExportError] = React.useState("")
  const [progress, setProgress] = React.useState<{ current: number; total: number } | null>(null)

  React.useEffect(() => {
    if (!open) return
    setStep("select")
    setSearch("")
    setDownloadUrl(null)
    setExportError("")
    setProgress(null)
    setSelected(new Set(preselectedId !== null && preselectedId !== undefined ? [preselectedId] : []))
  }, [open, preselectedId])

  // Si se cerró el panel mientras generaba y se reabre, retoma el estado en vez de
  // perder el hilo silenciosamente — mismo criterio que Organizaciones.
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    fileReportService.list()
      .then((reports) => {
        if (cancelled) return
        const pending = reports.find((r) => r.file_name.startsWith(EXPORT_FILE_PREFIX) && r.status === "Pendiente")
        if (!pending) return
        setExportFileName(pending.file_name)
        setStep("generating")
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  React.useEffect(() => {
    if (!userId) return
    const socket = getSocket()
    socket.emit("join-user-room", String(userId))

    function handleUpdated(fileReport: FileReport) {
      if (!fileReport?.file_name?.startsWith(EXPORT_FILE_PREFIX)) return
      setExportFileName(fileReport.file_name)

      if (fileReport.status === "Generado") {
        setProgress(null)
        fileReportService.getUrl(fileReport.id)
          .then((url) => { setDownloadUrl(url); setStep("ready") })
          .catch(() => { setExportError("El archivo se generó, pero no se pudo obtener el enlace de descarga."); setStep("error") })
      } else if (fileReport.status === "Error") {
        setProgress(null)
        setExportError(fileReport.error || "Ocurrió un error al generar el archivo.")
        setStep("error")
      }
    }

    // Progreso fino durante la generación — no viaja por file_report (ese solo tiene
    // Pendiente/Generado/Error), es un evento aparte emitido hoja por hoja.
    function handleProgress(data: { file_name: string; current: number; total: number }) {
      if (!data?.file_name?.startsWith(EXPORT_FILE_PREFIX)) return
      setProgress({ current: data.current, total: data.total })
    }

    socket.on("file-report-updated", handleUpdated)
    socket.on("vacantes-export-progress", handleProgress)
    return () => {
      socket.off("file-report-updated", handleUpdated)
      socket.off("vacantes-export-progress", handleProgress)
    }
  }, [userId])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vacantes
    return vacantes.filter((v) =>
      (v.titulo ?? "").toLowerCase().includes(q) ||
      (v.empresa ?? "").toLowerCase().includes(q)
    )
  }, [vacantes, search])

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((v) => selected.has(v.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) filtered.forEach((v) => next.delete(v.id))
      else filtered.forEach((v) => next.add(v.id))
      return next
    })
  }

  async function handleExport() {
    setExporting(true)
    setExportError("")
    setProgress(null)
    try {
      await formService.exportVacantes(Array.from(selected))
      setStep("generating")
    } catch {
      setExportError("No se pudo iniciar la exportación.")
      setStep("error")
    } finally {
      setExporting(false)
    }
  }

  const backTarget = BACK_TARGET[step]

  const DESCRIPTIONS: Record<Step, string> = {
    select: `${selected.size} de ${vacantes.length} vacante${vacantes.length !== 1 ? "s" : ""} seleccionada${selected.size !== 1 ? "s" : ""}`,
    confirm: "Cada vacante se exporta como una hoja del mismo archivo",
    generating: "Esto puede tardar unos segundos",
    ready: "Tu archivo está listo para descargar",
    error: "No se pudo completar la exportación",
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 480, padding: 0, gap: 0 }} className="flex w-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            <SheetTitle className="flex items-center gap-1">
              {backTarget && (
                <Button type="button" variant="ghost" size="icon-sm" className="-ml-2 shrink-0" onClick={() => setStep(backTarget)} aria-label="Volver">
                  <ArrowLeftIcon className="size-4" />
                </Button>
              )}
              {TITLES[step]}
            </SheetTitle>
            <SheetDescription>{DESCRIPTIONS[step]}</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={() => onOpenChange(false)} aria-label="Cerrar">
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {step === "select" && (
            <>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" placeholder="Buscar vacante..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <button
                type="button"
                onClick={toggleAll}
                disabled={filtered.length === 0}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
              >
                {allFilteredSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              </button>

              <div className="divide-y rounded-md border">
                {filtered.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">No hay vacantes.</p>
                ) : (
                  filtered.map((vacante) => (
                    <label key={vacante.id} className="flex cursor-pointer items-start gap-3 px-3.5 py-3 hover:bg-muted/30">
                      <Checkbox
                        className="mt-0.5"
                        checked={selected.has(vacante.id)}
                        onCheckedChange={() => toggleOne(vacante.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{vacante.titulo ?? "Vacante"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {vacante.empresa ?? "Sin empresa"} · {vacante.postulantes_count} postulante{vacante.postulantes_count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </>
          )}

          {step === "confirm" && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
              <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                <InfoIcon className="size-3" /> Cómo funciona
              </p>
              <p className="text-sm">
                Se generará un archivo Excel con {selected.size} hoja{selected.size !== 1 ? "s" : ""} — una por vacante,
                con los datos de la empresa, la vacante y sus postulantes.
              </p>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              {progress ? (
                <>
                  <p className="text-sm font-medium">
                    Vacante {progress.current} de {progress.total}
                  </p>
                  <Progress value={(progress.current / progress.total) * 100} className="w-48" />
                  <p className="text-xs text-muted-foreground">Generando el Excel, hoja por hoja...</p>
                </>
              ) : (
                <>
                  <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Generando archivo...</p>
                </>
              )}
            </div>
          )}

          {step === "ready" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FileSpreadsheetIcon className="size-8 text-emerald-600 dark:text-emerald-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{exportFileName}</p>
                <p className="text-xs text-muted-foreground">{selected.size} vacante{selected.size !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertTriangleIcon className="size-6 text-amber-500" />
              <p className="max-w-sm text-sm text-muted-foreground">{exportError}</p>
            </div>
          )}
        </div>

        {step === "select" && (
          <div className="border-t p-4">
            <Button type="button" className="w-full" disabled={selected.size === 0} onClick={() => setStep("confirm")}>
              Continuar {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        )}

        {step === "confirm" && (
          <div className="border-t p-4">
            <Button type="button" className="w-full" onClick={handleExport} disabled={exporting}>
              {exporting ? <LoaderCircleIcon className="size-4 animate-spin" /> : <FileSpreadsheetIcon className="size-4" />}
              Exportar
            </Button>
          </div>
        )}

        {step === "ready" && downloadUrl && (
          <div className="border-t p-4">
            <Button type="button" className="w-full" onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}>
              <DownloadIcon className="size-4" />
              Descargar
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="border-t p-4">
            <Button type="button" variant="outline" className="w-full" onClick={() => setStep("confirm")}>
              Reintentar
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
