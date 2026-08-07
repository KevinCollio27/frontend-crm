"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  InfoIcon,
  LoaderCircleIcon,
  LockIcon,
  SearchIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSocket } from "@/lib/socket"
import { notify } from "@/lib/notify"
import { useSessionStore } from "@/store/session.store"
import { contactService, type ImportPreviewError, type ImportPreviewRow, type PersonPayload } from "@/services/contact.service"
import { fileReportService } from "@/services/fileReport.service"
import { organizationService, type OrganizationOption } from "@/services/organization.service"
import type { FileReport } from "@/types/fileReport"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalContacts: number
  onImported?: () => void
}

type Step =
  | "choose"
  | "export-confirm"
  | "export-generating"
  | "export-ready"
  | "export-error"
  | "import-upload"
  | "import-review"
  | "import-result"

const EXPORT_FILE_PREFIX = "person_"

const BACK_TARGET: Partial<Record<Step, Step>> = {
  "export-confirm": "choose",
  "export-error": "export-confirm",
  "import-upload": "choose",
  "import-review": "import-upload",
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message ?? fallback
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

interface ImportFailure {
  row: number
  name: string
  reason: string
}

// Recalcula qué filas necesitan revisión — se llama tanto en el memo (cada
// edición en vivo) como una vez al terminar de subir el archivo, así que vive
// afuera del componente para no duplicar el criterio en dos lugares.
function computeRowFlags(
  rows: ImportPreviewRow[],
  existingEmails: Set<string>,
  existingPhones: Set<string>
): Map<number, string> {
  const seenEmails = new Set<string>()
  const seenPhones = new Set<string>()
  const flags = new Map<number, string>()

  for (const row of rows) {
    const emailNorm = row.email ? normalize(row.email) : null
    const phoneNorm = row.phone ? row.phone.trim() : null
    let reason: string | null = null

    if (row.organization_not_found) reason = `"${row.organization_name}" no encontrada`
    else if (emailNorm && existingEmails.has(emailNorm)) reason = "Correo ya existe"
    else if (phoneNorm && existingPhones.has(phoneNorm)) reason = "Teléfono ya existe"
    else if (emailNorm && seenEmails.has(emailNorm)) reason = "Correo repetido en el archivo"
    else if (phoneNorm && seenPhones.has(phoneNorm)) reason = "Teléfono repetido en el archivo"

    if (reason) flags.set(row.row, reason)
    if (emailNorm) seenEmails.add(emailNorm)
    if (phoneNorm) seenPhones.add(phoneNorm)
  }

  return flags
}

export function ContactsImportExportSheet({ open, onOpenChange, totalContacts, onImported }: Props) {
  const userId = useSessionStore((s) => s.user?.id)
  const [step, setStep] = React.useState<Step>("choose")

  // ─── Exportar ───────────────────────────────────────────────────────────
  const [exporting, setExporting] = React.useState(false)
  const [exportFileName, setExportFileName] = React.useState("")
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null)
  const [exportError, setExportError] = React.useState("")

  React.useEffect(() => {
    let cancelled = false
    fileReportService.list()
      .then((reports) => {
        if (cancelled) return
        const pending = reports.find((r) => r.file_name.startsWith(EXPORT_FILE_PREFIX) && r.status === "Pendiente")
        if (!pending) return
        setExportFileName(pending.file_name)
        setStep("export-generating")
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => {
    if (!userId) return
    const socket = getSocket()
    socket.emit("join-user-room", String(userId))

    function handleUpdated(fileReport: FileReport) {
      if (!fileReport?.file_name?.startsWith(EXPORT_FILE_PREFIX)) return
      setExportFileName(fileReport.file_name)

      if (fileReport.status === "Generado") {
        fileReportService.getUrl(fileReport.id)
          .then((url) => { setDownloadUrl(url); setStep("export-ready") })
          .catch(() => { setExportError("El archivo se generó, pero no se pudo obtener el enlace de descarga."); setStep("export-error") })
      } else if (fileReport.status === "Error") {
        setExportError(fileReport.error || "Ocurrió un error al generar el archivo.")
        setStep("export-error")
      }
    }

    socket.on("file-report-updated", handleUpdated)
    return () => { socket.off("file-report-updated", handleUpdated) }
  }, [userId])

  async function handleExport() {
    setExporting(true)
    setExportError("")
    try {
      await contactService.exportContacts()
      setStep("export-generating")
    } catch {
      setExportError("No se pudo iniciar la exportación.")
      setStep("export-error")
    } finally {
      setExporting(false)
    }
  }

  // ─── Importar ───────────────────────────────────────────────────────────
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState("")
  const [downloadingTemplate, setDownloadingTemplate] = React.useState(false)

  const [previewRows, setPreviewRows] = React.useState<ImportPreviewRow[]>([])
  const [previewErrors, setPreviewErrors] = React.useState<ImportPreviewError[]>([])
  const [existingEmailSet, setExistingEmailSet] = React.useState<Set<string>>(new Set())
  const [existingPhoneSet, setExistingPhoneSet] = React.useState<Set<string>>(new Set())
  const [orgOptions, setOrgOptions] = React.useState<OrganizationOption[]>([])
  const [selected, setSelected] = React.useState<Set<number>>(new Set())
  const [search, setSearch] = React.useState("")
  const [importing, setImporting] = React.useState(false)
  const [importSucceeded, setImportSucceeded] = React.useState(0)
  const [importFailed, setImportFailed] = React.useState<ImportFailure[]>([])

  // Se recalcula con cada edición en línea — así una fila se destraba sola
  // apenas se corrige el dato que la hacía duplicada o sin organización.
  const rowFlags = React.useMemo(
    () => computeRowFlags(previewRows, existingEmailSet, existingPhoneSet),
    [previewRows, existingEmailSet, existingPhoneSet]
  )

  // Cuando una fila se destraba (o se vuelve a trabar) por una edición, sigue
  // el mismo criterio con el que arrancó: seleccionada si no tiene aviso.
  // Fuera de esas transiciones, respeta lo que el usuario haya tildado a mano.
  const prevFlagsRef = React.useRef<Map<number, string>>(new Map())
  React.useEffect(() => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const row of previewRows) {
        const hadFlag = prevFlagsRef.current.has(row.row)
        const hasFlag = rowFlags.has(row.row)
        if (hasFlag && !hadFlag) next.delete(row.row)
        else if (!hasFlag && hadFlag) next.add(row.row)
      }
      return next
    })
    prevFlagsRef.current = rowFlags
  }, [rowFlags, previewRows])

  function updateRow(row: number, patch: Partial<ImportPreviewRow>) {
    setPreviewRows((prev) => prev.map((r) => (r.row === row ? { ...r, ...patch } : r)))
  }

  function updateRowOrganization(row: number, orgId: string) {
    if (!orgId) {
      updateRow(row, { organization_id: null, organization_name: null, organization_not_found: false })
      return
    }
    const org = orgOptions.find((o) => String(o.id) === orgId)
    if (!org) return
    updateRow(row, { organization_id: org.id, organization_name: org.name, organization_not_found: false })
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true)
    try {
      const url = await contactService.getImportTemplate()
      const a = document.createElement("a")
      a.href = url
      a.download = "plantilla_contactos.xlsx"
      a.click()
    } catch {
      notify.error({ title: "No se pudo descargar la plantilla", description: "Intenta de nuevo." })
    } finally {
      setDownloadingTemplate(false)
    }
  }

  async function handleUploadContinue() {
    if (!file) return
    setUploading(true)
    setUploadError("")
    try {
      const base64 = await fileToBase64(file)
      const [preview, orgs] = await Promise.all([
        contactService.previewImport(base64),
        organizationService.allNoPaginate().catch(() => []),
      ])

      const emails = preview.rows.filter((r) => r.email).map((r) => r.email as string)
      const phones = preview.rows.filter((r) => r.phone).map((r) => r.phone as string)
      const dup = emails.length || phones.length
        ? await contactService.checkDuplicates(emails, phones).catch(() => ({ existingEmails: [], existingPhones: [] }))
        : { existingEmails: [], existingPhones: [] }

      const emailSet = new Set(dup.existingEmails.map(normalize))
      const phoneSet = new Set(dup.existingPhones.map((p) => p.trim()))
      const flags = computeRowFlags(preview.rows, emailSet, phoneSet)

      setPreviewRows(preview.rows)
      setPreviewErrors(preview.errors)
      setExistingEmailSet(emailSet)
      setExistingPhoneSet(phoneSet)
      setOrgOptions(orgs)
      prevFlagsRef.current = flags
      setSelected(new Set(preview.rows.filter((r) => !flags.has(r.row)).map((r) => r.row)))
      setSearch("")
      setStep("import-review")
    } catch {
      setUploadError("No se pudo leer el archivo. Verifica que sea la plantilla oficial (.xlsx).")
    } finally {
      setUploading(false)
    }
  }

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? previewRows.filter((r) => r.name.toLowerCase().includes(q)) : previewRows
  }, [previewRows, search])

  const selectableRows = React.useMemo(() => previewRows.filter((r) => !rowFlags.has(r.row)), [previewRows, rowFlags])
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.row))

  function toggleOne(row: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(row)) next.delete(row)
      else next.add(row)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) selectableRows.forEach((r) => next.delete(r.row))
      else selectableRows.forEach((r) => next.add(r.row))
      return next
    })
  }

  async function handleConfirmImport() {
    setImporting(true)
    const toImport = previewRows.filter((r) => selected.has(r.row))

    const results = await Promise.allSettled(
      toImport.map((row) => {
        const payload: PersonPayload = {
          name: row.name,
          organization_id: row.organization_id,
          pais_origen: "CL",
          contact_source: "Importación masiva",
          internal_position: null,
          birth_date: null,
          linkedin_url: null,
          instagram_url: null,
          twitter_url: null,
          facebook_url: null,
          email: row.email && row.email_label_id
            ? [{ id: null, label_id: row.email_label_id, option: row.email_option ?? "", value: row.email }]
            : [],
          phone: row.phone && row.phone_label_id
            ? [{ id: null, label_id: row.phone_label_id, option: row.phone_option ?? "", value: row.phone }]
            : [],
          charge: [],
          tag: [],
        }
        return contactService.create(payload)
      })
    )

    const failed: ImportFailure[] = []
    let succeeded = 0
    results.forEach((r, i) => {
      if (r.status === "fulfilled") succeeded++
      else failed.push({ row: toImport[i].row, name: toImport[i].name, reason: errorMessage(r.reason, "Error al crear el contacto") })
    })

    setImporting(false)
    setImportSucceeded(succeeded)
    setImportFailed(failed)
    setStep("import-result")
    if (succeeded > 0) onImported?.()
  }

  const backTarget = BACK_TARGET[step]

  const TITLES: Record<Step, string> = {
    "choose": "Importar / Exportar contactos",
    "export-confirm": "Exportar contactos",
    "export-generating": "Exportar contactos",
    "export-ready": "Exportar contactos",
    "export-error": "Exportar contactos",
    "import-upload": "Importar contactos",
    "import-review": "Revisar antes de importar",
    "import-result": "Importación completa",
  }

  const DESCRIPTIONS: Record<Step, string> = {
    "choose": "Gestiona los contactos de tu espacio de trabajo",
    "export-confirm": "Se genera un archivo Excel con todos tus contactos",
    "export-generating": "Esto puede tardar unos segundos",
    "export-ready": "Tu archivo está listo para descargar",
    "export-error": "No se pudo completar la exportación",
    "import-upload": "Carga masiva desde una plantilla Excel",
    "import-review": `${previewRows.length} fila${previewRows.length !== 1 ? "s" : ""} leída${previewRows.length !== 1 ? "s" : ""}${previewErrors.length ? ` · ${previewErrors.length} con errores` : ""}`,
    "import-result": `${importSucceeded} contacto${importSucceeded !== 1 ? "s" : ""} importado${importSucceeded !== 1 ? "s" : ""}`,
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: step === "import-review" ? 880 : 480, padding: 0, gap: 0 }}
        className="flex w-full flex-col"
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            <SheetTitle className="flex items-center gap-1">
              {backTarget && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="-ml-2 shrink-0"
                  onClick={() => setStep(backTarget)}
                  aria-label="Volver"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
              )}
              {TITLES[step]}
            </SheetTitle>
            <SheetDescription>{DESCRIPTIONS[step]}</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {step === "choose" && (
            <>
              <button
                type="button"
                onClick={() => setStep("import-upload")}
                className="flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/30"
              >
                <UploadIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">Importar</p>
                  <p className="text-xs text-muted-foreground">
                    Importa contactos a tu espacio de trabajo desde una plantilla.
                  </p>
                </div>
                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => setStep("export-confirm")}
                className="flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/30"
              >
                <DownloadIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">Exportar</p>
                  <p className="text-xs text-muted-foreground">
                    Exporta los contactos de tu espacio de trabajo en Excel.
                  </p>
                </div>
                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </button>
            </>
          )}

          {step === "export-confirm" && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
              <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                <InfoIcon className="size-3" /> Cómo funciona
              </p>
              <p className="text-sm">
                Se exportarán los {totalContacts.toLocaleString("es-CL")} contactos de tu espacio de trabajo con su
                información completa (organización, correo, teléfono, etiquetas, fuente y usuario asignado) en un
                archivo Excel.
              </p>
            </div>
          )}

          {step === "export-generating" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generando archivo...</p>
            </div>
          )}

          {step === "export-ready" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FileSpreadsheetIcon className="size-8 text-emerald-600 dark:text-emerald-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{exportFileName}</p>
                <p className="text-xs text-muted-foreground">{totalContacts.toLocaleString("es-CL")} contactos</p>
              </div>
            </div>
          )}

          {step === "export-error" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertTriangleIcon className="size-6 text-amber-500" />
              <p className="max-w-sm text-sm text-muted-foreground">{exportError}</p>
            </div>
          )}

          {step === "import-upload" && (
            <>
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
                <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                  <InfoIcon className="size-3" /> Cómo funciona
                </p>
                <p className="text-sm">
                  Usa nuestra plantilla oficial para cargar contactos masivamente. Descárgala, complétala y súbela
                  aquí mismo. Antes de importar podrás revisar los datos y descartar duplicados.
                </p>
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={handleDownloadTemplate} disabled={downloadingTemplate}>
                {downloadingTemplate
                  ? <LoaderCircleIcon className="size-4 animate-spin" />
                  : <FileSpreadsheetIcon className="size-4" />}
                Descargar plantilla
              </Button>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors hover:bg-muted/30">
                <UploadIcon className="size-5 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {file ? file.name : "Arrastra tu archivo aquí o haz click para elegir"}
                </p>
                <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUploadError("") }}
                />
              </label>

              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            </>
          )}

          {step === "import-review" && (
            <>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-180">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          aria-label="Seleccionar todos"
                          checked={allSelected}
                          onCheckedChange={toggleAll}
                          disabled={selectableRows.length === 0}
                        />
                      </TableHead>
                      <TableHead className="min-w-70">Contacto</TableHead>
                      <TableHead className="min-w-60">Organización</TableHead>
                      <TableHead className="min-w-37.5">Teléfono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 && previewErrors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                          No se encontraron filas para importar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((row) => {
                        const flag = rowFlags.get(row.row)
                        return (
                          <TableRow key={row.row}>
                            <TableCell>
                              <Checkbox
                                aria-label={`Seleccionar a ${row.name}`}
                                checked={selected.has(row.row)}
                                onCheckedChange={() => toggleOne(row.row)}
                                disabled={!!flag}
                              />
                            </TableCell>
                            <TableCell className="w-70 space-y-1 align-top whitespace-normal">
                              <Input
                                className="h-7 text-sm"
                                value={row.name}
                                onChange={(e) => updateRow(row.row, { name: e.target.value })}
                              />
                              <Input
                                className="h-7 text-sm"
                                placeholder="Sin correo"
                                value={row.email ?? ""}
                                onChange={(e) => updateRow(row.row, { email: e.target.value || null })}
                              />
                              {flag && (
                                <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                                  <LockIcon className="size-3" /> {flag}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="w-60 align-top whitespace-normal">
                              <SearchableSelect
                                className="w-full"
                                options={orgOptions.map((o) => ({ value: String(o.id), label: o.name }))}
                                value={row.organization_id ? String(row.organization_id) : ""}
                                onChange={(v) => updateRowOrganization(row.row, v)}
                                placeholder={row.organization_not_found ? `"${row.organization_name}" no encontrada` : "Sin organización"}
                                searchPlaceholder="Buscar organización..."
                                hasError={row.organization_not_found}
                              />
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              <Input
                                className="h-7 w-32 text-sm"
                                placeholder="—"
                                value={row.phone ?? ""}
                                onChange={(e) => updateRow(row.row, { phone: e.target.value || null })}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                    {previewErrors.map((err) => (
                      <TableRow key={`error-${err.row}`} className="opacity-60">
                        <TableCell />
                        <TableCell colSpan={3}>
                          <p className="text-xs text-destructive">
                            Fila {err.row}{err.name ? ` — ${err.name}` : ""}: {err.reason}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {step === "import-result" && (
            <>
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <FileSpreadsheetIcon className="size-8 text-emerald-600 dark:text-emerald-500" />
                <p className="text-sm font-medium">
                  {importSucceeded} contacto{importSucceeded !== 1 ? "s" : ""} importado{importSucceeded !== 1 ? "s" : ""}
                </p>
                {(importFailed.length + previewErrors.length) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {importFailed.length + previewErrors.length} fila{(importFailed.length + previewErrors.length) !== 1 ? "s" : ""} con errores
                  </p>
                )}
              </div>
              {(importFailed.length > 0 || previewErrors.length > 0) && (
                <div className="space-y-1 rounded-lg border p-3">
                  {previewErrors.map((e) => (
                    <p key={`pe-${e.row}`} className="text-xs text-muted-foreground">Fila {e.row} — {e.reason}</p>
                  ))}
                  {importFailed.map((e) => (
                    <p key={`fe-${e.row}`} className="text-xs text-muted-foreground">Fila {e.row} — {e.reason}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {step === "export-confirm" && (
          <div className="border-t p-4">
            <Button type="button" className="w-full" onClick={handleExport} disabled={exporting}>
              {exporting
                ? <LoaderCircleIcon className="size-4 animate-spin" />
                : <FileSpreadsheetIcon className="size-4" />}
              Exportar contactos
            </Button>
          </div>
        )}

        {step === "export-ready" && downloadUrl && (
          <div className="border-t p-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}
            >
              <DownloadIcon className="size-4" />
              Descargar
            </Button>
          </div>
        )}

        {step === "export-error" && (
          <div className="border-t p-4">
            <Button type="button" variant="outline" className="w-full" onClick={() => setStep("export-confirm")}>
              Reintentar
            </Button>
          </div>
        )}

        {step === "import-upload" && (
          <div className="border-t p-4">
            <Button type="button" className="w-full" onClick={handleUploadContinue} disabled={!file || uploading}>
              {uploading && <LoaderCircleIcon className="size-4 animate-spin" />}
              {uploading ? "Analizando archivo..." : "Continuar"}
            </Button>
          </div>
        )}

        {step === "import-review" && (
          <div className="flex items-center justify-between gap-2 border-t p-4">
            <span className="text-xs text-muted-foreground">
              {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("import-upload")}>Cancelar</Button>
              <Button type="button" disabled={selected.size === 0 || importing} onClick={handleConfirmImport}>
                {importing && <LoaderCircleIcon className="size-4 animate-spin" />}
                Importar {selected.size > 0 ? selected.size : ""}
              </Button>
            </div>
          </div>
        )}

        {step === "import-result" && (
          <div className="border-t p-4">
            <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
