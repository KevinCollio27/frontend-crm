"use client"

import * as React from "react"
import { LoaderCircleIcon, LockIcon, SearchIcon, XIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getInitials } from "@/lib/table-utils"
import { notify } from "@/lib/notify"
import { catalogService, activeOptions } from "@/services/catalog.service"
import { contactService, type PersonPayload } from "@/services/contact.service"
import { integrationService } from "@/services/integration.service"
import type { GoogleContactRaw } from "@/types/google-contacts"

interface ImportGoogleContactsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId: number
  onSuccess: () => void
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

// El selector de código de país (+56) del formulario de contacto es independiente del
// campo de número — si Google trae el número con el código ya incluido (canonicalForm en
// formato E.164, ej. "+56959364703"), hay que sacárselo o queda duplicado ("+56" + "56...").
function stripCountryCode(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("56") && digits.length === 11) return digits.slice(2)
  return digits
}

export function ImportGoogleContactsSheet({ open, onOpenChange, integrationId, onSuccess }: ImportGoogleContactsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 560, padding: 0, gap: 0 }} className="w-full">
        {open && (
          <ImportBody integrationId={integrationId} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message ?? fallback
}

// Cuentas con muchos contactos (3000+) traban el modal si se renderizan todas las filas
// de una — se pagina el render igual que "Cargar más" en MoveContactsSheet, pero acá es
// solo del lado del cliente porque los 3000 ya vienen enteros en una sola respuesta de Google.
const RENDER_PAGE_SIZE = 50

// Disparar 3000 POST en paralelo satura el backend de golpe — se importa en tandas chicas,
// lo que además da pie a una barra de progreso real en vez de un salto de 0% a 100%.
const IMPORT_BATCH_SIZE = 10

function ImportBody({
  integrationId,
  onClose,
  onSuccess,
}: {
  integrationId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = React.useState(true)
  const [contacts, setContacts] = React.useState<GoogleContactRaw[]>([])
  const [existingEmails, setExistingEmails] = React.useState<Set<string>>(new Set())
  const [existingPhones, setExistingPhones] = React.useState<Set<string>>(new Set())

  const [emailLabelId, setEmailLabelId] = React.useState<number | null>(null)
  const [phoneLabelId, setPhoneLabelId] = React.useState<number | null>(null)
  const [emailOption, setEmailOption] = React.useState<{ id: number | null; value: string } | null>(null)
  const [phoneOption, setPhoneOption] = React.useState<{ id: number | null; value: string } | null>(null)

  const [search, setSearch] = React.useState("")
  const [visibleCount, setVisibleCount] = React.useState(RENDER_PAGE_SIZE)
  const [selected, setSelected] = React.useState<Set<number>>(new Set())
  const [importing, setImporting] = React.useState(false)
  const [importProgress, setImportProgress] = React.useState<{ current: number; total: number } | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      integrationService.getGoogleContactsList(integrationId),
      catalogService.getLabelOptions(["email", "phone"]),
    ])
      .then(async ([googleContacts, labels]) => {
        if (cancelled) return

        const emailLabel = labels.find((l) => l.key === "email")
        const phoneLabel = labels.find((l) => l.key === "phone")
        setEmailLabelId(emailLabel?.id ?? null)
        setPhoneLabelId(phoneLabel?.id ?? null)
        const emailOpts = emailLabel ? activeOptions(emailLabel) : []
        const phoneOpts = phoneLabel ? activeOptions(phoneLabel) : []
        setEmailOption(emailOpts[0] ? { id: emailOpts[0].id, value: emailOpts[0].value } : null)
        setPhoneOption(phoneOpts[0] ? { id: phoneOpts[0].id, value: phoneOpts[0].value } : null)

        setContacts(googleContacts)

        const emails = googleContacts.filter((c) => c.email).map((c) => c.email as string)
        const phones = googleContacts.filter((c) => c.phone).map((c) => stripCountryCode(c.phone as string))
        try {
          const dup = await contactService.checkDuplicates(emails, phones)
          if (cancelled) return
          setExistingEmails(new Set(dup.existingEmails.map(normalize)))
          setExistingPhones(new Set(dup.existingPhones.map(stripCountryCode)))
        } catch {
          // Si falla el chequeo de duplicados, no bloqueamos el import — solo no se marca nada.
        }
      })
      .catch((error) => {
        if (!cancelled) notify.error({ title: "No se pudo cargar tus contactos de Google", description: errorMessage(error, "Intenta de nuevo.") })
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [integrationId])

  function isDuplicate(contact: GoogleContactRaw): boolean {
    if (contact.email && existingEmails.has(normalize(contact.email))) return true
    if (contact.phone && existingPhones.has(stripCountryCode(contact.phone))) return true
    return false
  }

  const filteredIndices = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return contacts
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !q || c.name.toLowerCase().includes(q))
      .map(({ i }) => i)
  }, [contacts, search])

  const selectableFiltered = React.useMemo(
    () => filteredIndices.filter((i) => !isDuplicate(contacts[i])),
    [filteredIndices, contacts, existingEmails, existingPhones]
  )
  const allSelected = selectableFiltered.length > 0 && selectableFiltered.every((i) => selected.has(i))

  // Búsqueda/seleccionar-todos siguen operando sobre filteredIndices completo — solo el
  // render de filas se corta, para no montar miles de <TableRow> de una.
  const visibleIndices = filteredIndices.slice(0, visibleCount)
  const hasMoreToShow = visibleCount < filteredIndices.length

  React.useEffect(() => {
    setVisibleCount(RENDER_PAGE_SIZE)
  }, [search])

  function toggleOne(index: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) selectableFiltered.forEach((i) => next.delete(i))
      else selectableFiltered.forEach((i) => next.add(i))
      return next
    })
  }

  async function handleImport() {
    if (selected.size === 0) return
    setImporting(true)

    const toImport = Array.from(selected).map((i) => contacts[i])
    const total = toImport.length
    setImportProgress({ current: 0, total })
    let completed = 0

    function importOne(contact: GoogleContactRaw) {
      const payload: PersonPayload = {
        name: contact.name,
        organization_id: null,
        pais_origen: "CL",
        contact_source: "google_contacts",
        internal_position: null,
        birth_date: null,
        linkedin_url: null,
        instagram_url: null,
        twitter_url: null,
        facebook_url: null,
        email: contact.email && emailLabelId
          ? [{ id: emailOption?.id ?? null, label_id: emailLabelId, option: emailOption?.value ?? "", value: contact.email }]
          : [],
        phone: contact.phone && phoneLabelId
          ? [{ id: phoneOption?.id ?? null, label_id: phoneLabelId, option: phoneOption?.value ?? "", value: stripCountryCode(contact.phone) }]
          : [],
        charge: [],
        tag: [],
      }
      return contactService.create(payload).finally(() => {
        completed += 1
        setImportProgress({ current: completed, total })
      })
    }

    const results: PromiseSettledResult<unknown>[] = []
    for (let i = 0; i < toImport.length; i += IMPORT_BATCH_SIZE) {
      const batch = toImport.slice(i, i + IMPORT_BATCH_SIZE)
      const batchResults = await Promise.allSettled(batch.map(importOne))
      results.push(...batchResults)
    }

    setImporting(false)
    setImportProgress(null)
    const okCount = results.filter((r) => r.status === "fulfilled").length
    const failCount = results.length - okCount

    if (okCount > 0) {
      notify.success({
        title: "Contactos importados",
        description: `${okCount} contacto${okCount !== 1 ? "s" : ""} importado${okCount !== 1 ? "s" : ""} correctamente${failCount ? ` (${failCount} falló)` : ""}.`,
      })
      onSuccess()
    }
    if (okCount === 0) {
      notify.error({ title: "No se pudo importar", description: "Intenta de nuevo." })
    }
    if (failCount === 0) onClose()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>Importar contactos</SheetTitle>
          <SheetDescription>Google Contacts — selecciona los contactos que quieres traer al CRM.</SheetDescription>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} disabled={importing} aria-label="Cerrar">
          <XIcon />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircleIcon className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="p-5 pb-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="mx-5 mb-5 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Seleccionar todos"
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        disabled={selectableFiltered.length === 0}
                      />
                    </TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIndices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                        No se encontraron contactos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleIndices.map((i) => {
                      const contact = contacts[i]
                      const duplicate = isDuplicate(contact)
                      return (
                        <TableRow key={i} className={duplicate ? "opacity-60" : undefined}>
                          <TableCell>
                            <Checkbox
                              aria-label={`Seleccionar a ${contact.name}`}
                              checked={selected.has(i)}
                              onCheckedChange={() => toggleOne(i)}
                              disabled={duplicate}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7 shrink-0">
                                <AvatarImage src="https://github.com/shadcn.png" alt={contact.name} />
                                <AvatarFallback className="text-[9px] font-semibold">
                                  {getInitials(contact.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{contact.name}</p>
                                {duplicate ? (
                                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <LockIcon className="size-3" /> Ya existe en el CRM
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">{contact.email || "Sin correo"}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{contact.phone || "—"}</span>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              {hasMoreToShow && (
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setVisibleCount((c) => c + RENDER_PAGE_SIZE)}
                  >
                    Cargar más ({filteredIndices.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t p-4">
        {importProgress ? (
          <div className="flex flex-1 items-center gap-2">
            <Progress value={(importProgress.current / importProgress.total) * 100} className="flex-1" />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {importProgress.current} de {importProgress.total}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
        )}
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={importing}>
            Cancelar
          </Button>
          <Button type="button" disabled={selected.size === 0 || importing} onClick={handleImport}>
            {importing && <LoaderCircleIcon className="size-4 animate-spin" />}
            Importar {selected.size > 0 ? selected.size : ""}
          </Button>
        </div>
      </div>
    </>
  )
}
