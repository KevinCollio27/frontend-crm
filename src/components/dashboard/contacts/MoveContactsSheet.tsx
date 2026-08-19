"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightLeftIcon,
  CheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { contactConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { getInitials } from "@/lib/table-utils"
import { useSessionStore } from "@/store/session.store"
import { contactService } from "@/services/contact.service"
import type {
  MoveWorkspaceContactPreview,
  OrganizationMoveChoice,
} from "@/types/contact"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSelectedIds?: number[]
  onMoved?: () => void
}

type Step = "select" | "review"

interface ContactRow {
  id: number
  name: string
  email: string
}

const PAGE_SIZE = 20

export function MoveContactsSheet({ open, onOpenChange, initialSelectedIds, onMoved }: Props) {
  const user = useSessionStore((s) => s.user)
  const currentWorkspaceId = useSessionStore((s) => s.workspaceId)

  const [step, setStep] = React.useState<Step>("select")

  // ─── Paso 1: elegir contactos ────────────────────────────────────────────
  const [rows, setRows] = React.useState<ContactRow[]>([])
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingRows, setLoadingRows] = React.useState(false)
  const [rowsError, setRowsError] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set(initialSelectedIds ?? []))

  React.useEffect(() => {
    if (!open) return
    setStep("select")
    setSelectedIds(new Set(initialSelectedIds ?? []))
    setSearch("")
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingRows(true)
    setRowsError(false)
    const t = setTimeout(async () => {
      try {
        const res = await contactService.list({ page, take: PAGE_SIZE, filter: search || undefined })
        if (cancelled) return
        const mapped: ContactRow[] = res.data.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.person_detail?.find((d) => d.label?.key === "email")?.value ?? "",
        }))
        setRows((prev) => (page === 1 ? mapped : [...prev, ...mapped]))
        setHasMore(page < res.totalPages)
      } catch (err) {
        if (cancelled) return
        console.error("[MoveContactsSheet] error al listar contactos:", err)
        setRows(page === 1 ? [] : rows)
        setRowsError(true)
      } finally {
        if (!cancelled) setLoadingRows(false)
      }
    }, page === 1 ? 300 : 0)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, search])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function toggleRow(row: ContactRow) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(row.id)) next.delete(row.id)
      else next.add(row.id)
      return next
    })
  }

  // ─── Paso 2: destino y revisión ──────────────────────────────────────────
  const [targetWorkspaceId, setTargetWorkspaceId] = React.useState<string>("")
  const [preview, setPreview] = React.useState<MoveWorkspaceContactPreview[] | null>(null)
  const [loadingPreview, setLoadingPreview] = React.useState(false)
  const [orgChoices, setOrgChoices] = React.useState<Record<number, OrganizationMoveChoice>>({})
  const [submitting, setSubmitting] = React.useState(false)

  // Solo espacios donde el usuario es admin/owner — mover contactos entre workspaces
  // es una operación sensible, no algo que un miembro invitado sin rol pueda decidir.
  const workspaceOptions = (user?.user_workspace ?? [])
    .filter((w) => w.workspace_id !== currentWorkspaceId && (w.is_admin || w.is_owner))
    .map((w) => ({
      value: String(w.workspace_id),
      label: w.workspace?.name ?? `Workspace ${w.workspace_id}`,
      logo: w.workspace?.logo ?? null,
    }))

  React.useEffect(() => {
    if (step !== "review" || !targetWorkspaceId) return
    let cancelled = false
    setLoadingPreview(true)
    setPreview(null)
    contactService
      .previewMoveWorkspace(Array.from(selectedIds), Number(targetWorkspaceId))
      .then((res) => {
        if (cancelled) return
        setPreview(res.contacts)
        const defaults: Record<number, OrganizationMoveChoice> = {}
        res.contacts.forEach((c) => {
          if (c.organization && c.organization.otherContactsInSource > 0) {
            defaults[c.organization.id] = "detach"
          }
        })
        setOrgChoices(defaults)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("[MoveContactsSheet] error al previsualizar el movimiento:", err)
        setPreview([])
      })
      .finally(() => { if (!cancelled) setLoadingPreview(false) })
    return () => { cancelled = true }
  }, [step, targetWorkspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sharedOrgs = React.useMemo(() => {
    if (!preview) return []
    const map = new Map<number, { name: string; otherContactsInSource: number }>()
    preview.forEach((c) => {
      if (c.organization && c.organization.otherContactsInSource > 0) {
        map.set(c.organization.id, { name: c.organization.name, otherContactsInSource: c.organization.otherContactsInSource })
      }
    })
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }))
  }, [preview])

  const movableContacts = (preview ?? []).filter((c) => !c.blocked)
  const blockedContacts = (preview ?? []).filter((c) => c.blocked)
  const targetName = workspaceOptions.find((w) => w.value === targetWorkspaceId)?.label

  function handleClose() {
    onOpenChange(false)
  }

  async function handleConfirmMove() {
    if (movableContacts.length === 0) return
    const confirmed = await contactConfirm.moveWorkspace(movableContacts.length, targetName)
    if (!confirmed) return

    setSubmitting(true)
    try {
      const result = await contactService.moveWorkspace({
        personIds: movableContacts.map((c) => c.id),
        targetWorkspaceId: Number(targetWorkspaceId),
        organizationChoices: orgChoices,
      })
      notify.success({
        title: "Contactos movidos",
        description: `${result.moved} contacto${result.moved !== 1 ? "s" : ""} se movió a "${targetName}".`,
      })
      onMoved?.()
      handleClose()
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo completar el movimiento." })
    } finally {
      setSubmitting(false)
    }
  }

  const TITLES: Record<Step, string> = {
    select: "Mover a otro espacio de trabajo",
    review: "Destino y revisión",
  }
  const DESCRIPTIONS: Record<Step, string> = {
    select: "Elige los contactos que quieres transferir",
    review: `${selectedIds.size} contacto${selectedIds.size !== 1 ? "s" : ""} seleccionado${selectedIds.size !== 1 ? "s" : ""}`,
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 640, padding: 0, gap: 0 }} className="flex w-full! flex-col">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            <SheetTitle className="flex items-center gap-1">
              {step === "review" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="-ml-2 shrink-0"
                  onClick={() => setStep("select")}
                  aria-label="Volver"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
              )}
              {TITLES[step]}
            </SheetTitle>
            <SheetDescription>{DESCRIPTIONS[step]}</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={handleClose} aria-label="Cerrar">
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {step === "select" && (
            <>
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
                <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                  <InfoIcon className="size-3" /> Cómo funciona
                </p>
                <p className="text-sm">
                  Se mueven junto con el contacto su organización (si no tiene otros contactos), notas e
                  intereses. Las oportunidades sin avance se reubican solas en el espacio destino; las que
                  tengan cotización o actividad registrada quedan bloqueadas hasta resolverlas manualmente.
                </p>
              </div>

              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar contacto..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              <div className="overflow-hidden rounded-md border">
                {rows.length === 0 && !loadingRows ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    {rowsError ? "No se pudieron cargar los contactos. Intenta de nuevo." : "No se encontraron contactos."}
                  </div>
                ) : (
                  rows.map((row) => (
                    <label
                      key={row.id}
                      className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/30"
                    >
                      <Checkbox
                        aria-label={`Seleccionar a ${row.name}`}
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => toggleRow(row)}
                      />
                      <Avatar size="sm">
                        <AvatarImage src="https://github.com/shadcn.png" alt={row.name} />
                        <AvatarFallback className="text-xs">{getInitials(row.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm font-medium">{row.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{row.email || "—"}</div>
                      </div>
                    </label>
                  ))
                )}
                {loadingRows && (
                  <div className="flex justify-center py-4">
                    <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {hasMore && !loadingRows && (
                <Button type="button" variant="outline" className="w-full" onClick={() => setPage((p) => p + 1)}>
                  Cargar más
                </Button>
              )}
            </>
          )}

          {step === "review" && (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Espacio destino</p>
                <SearchableSelect
                  options={workspaceOptions}
                  value={targetWorkspaceId}
                  onChange={setTargetWorkspaceId}
                  placeholder="Selecciona un espacio de trabajo"
                  searchPlaceholder="Buscar workspace..."
                  disabled={workspaceOptions.length === 0}
                />
              </div>

              {workspaceOptions.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No eres admin ni owner en ningún otro espacio de trabajo — solo puedes mover contactos a
                  espacios donde tengas ese rol.
                </p>
              )}

              {workspaceOptions.length > 0 && !targetWorkspaceId && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Elige un espacio destino para revisar el movimiento.
                </p>
              )}

              {targetWorkspaceId && loadingPreview && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Revisando dependencias...</p>
                </div>
              )}

              {targetWorkspaceId && !loadingPreview && preview && (
                <>
                  {sharedOrgs.map((org) => (
                    <div key={org.id} className="space-y-2 rounded-lg border p-3">
                      <p className="flex items-center gap-1.5 text-sm">
                        <AlertTriangleIcon className="size-3.5 shrink-0 text-amber-500" />
                        Organización <span className="font-medium">&quot;{org.name}&quot;</span> tiene{" "}
                        {org.otherContactsInSource} contacto{org.otherContactsInSource !== 1 ? "s" : ""} más en
                        este espacio. ¿Qué quieres hacer?
                      </p>
                      <div className="flex flex-col gap-1.5 pl-5">
                        {(["detach", "moveFull"] as OrganizationMoveChoice[]).map((choice) => (
                          <label key={choice} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`org-${org.id}`}
                              checked={orgChoices[org.id] === choice}
                              onChange={() => setOrgChoices((prev) => ({ ...prev, [org.id]: choice }))}
                            />
                            {choice === "detach"
                              ? "Mover solo los contactos seleccionados (quedan sin organización)"
                              : `Mover la organización completa (${org.otherContactsInSource + 1} contactos)`}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {preview.map((c) => (
                    <div key={c.id} className={`space-y-1.5 rounded-lg border p-3 ${c.blocked ? "border-destructive/40" : ""}`}>
                      <p className="text-sm font-medium">{c.name}</p>

                      {c.organization && (
                        <p className="flex items-center gap-1.5 text-xs">
                          {c.organization.otherContactsInSource === 0 ? (
                            <>
                              <CheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                              Organización &quot;{c.organization.name}&quot; se mueve junto con el contacto
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              Organización &quot;{c.organization.name}&quot; — según la elección de arriba
                            </span>
                          )}
                        </p>
                      )}
                      {!c.organization && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                          Sin organización asociada
                        </p>
                      )}

                      {(c.notesCount > 0 || c.interestsCount > 0) && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                          {c.notesCount} nota{c.notesCount !== 1 ? "s" : ""}, {c.interestsCount} interés
                          {c.interestsCount !== 1 ? "es" : ""} — se mueven junto al contacto
                        </p>
                      )}

                      {c.opportunities.length === 0 && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                          Sin oportunidades abiertas
                        </p>
                      )}
                      {c.opportunities.map((op) => (
                        <p
                          key={op.id}
                          className={`flex items-start gap-1.5 text-xs ${op.autoMovable ? "text-muted-foreground" : "text-destructive"}`}
                        >
                          {op.autoMovable ? (
                            <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                          ) : (
                            <XIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                          )}
                          {op.autoMovable
                            ? `Oportunidad "${op.name}" se reubica en el flujo predeterminado del destino`
                            : `Oportunidad "${op.name}" — ${op.blockReason ?? "no se puede mover automáticamente"}`}
                        </p>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {step === "select" && (
          <div className="flex items-center justify-between gap-2 border-t p-4">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="button" disabled={selectedIds.size === 0} onClick={() => setStep("review")}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="flex items-center justify-between gap-2 border-t p-4">
            <span className="text-xs text-muted-foreground">
              {preview
                ? blockedContacts.length > 0
                  ? `${movableContacts.length} de ${preview.length} se moverán`
                  : `${movableContacts.length} listo${movableContacts.length !== 1 ? "s" : ""} para mover`
                : ""}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("select")}>Atrás</Button>
              <Button
                type="button"
                disabled={!targetWorkspaceId || loadingPreview || movableContacts.length === 0 || submitting}
                onClick={handleConfirmMove}
              >
                {submitting && <LoaderCircleIcon className="size-4 animate-spin" />}
                <ArrowRightLeftIcon className="size-4" />
                Mover {movableContacts.length > 0 ? movableContacts.length : ""} contacto{movableContacts.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
