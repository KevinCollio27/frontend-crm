"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowRightLeftIcon,
  CheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { useSessionStore } from "@/store/session.store"
import { organizationService } from "@/services/organization.service"
import type { MoveWorkspaceOrganizationContacts } from "@/types/organization"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSelectedIds?: number[]
  onMoved?: () => void
}

type Step = "select" | "review"

interface OrgRow {
  id: number
  name: string
  contactCount: number
}

const PAGE_SIZE = 20

export function MoveOrganizationsSheet({ open, onOpenChange, initialSelectedIds, onMoved }: Props) {
  const user = useSessionStore((s) => s.user)
  const currentWorkspaceId = useSessionStore((s) => s.workspaceId)

  const [step, setStep] = React.useState<Step>("select")

  // ─── Paso 1: elegir organizaciones ───────────────────────────────────────
  const [rows, setRows] = React.useState<OrgRow[]>([])
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
        const res = await organizationService.list({ page, take: PAGE_SIZE, filter: search || undefined })
        if (cancelled) return
        const mapped: OrgRow[] = res.data.map((o) => ({ id: o.id, name: o.name, contactCount: o.person?.length ?? 0 }))
        setRows((prev) => (page === 1 ? mapped : [...prev, ...mapped]))
        setHasMore(page < res.totalPages)
      } catch (err) {
        if (cancelled) return
        console.error("[MoveOrganizationsSheet] error al listar organizaciones:", err)
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

  function toggleRow(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Paso 2: destino y revisión ──────────────────────────────────────────
  const [targetWorkspaceId, setTargetWorkspaceId] = React.useState<string>("")
  const [preview, setPreview] = React.useState<MoveWorkspaceOrganizationContacts[] | null>(null)
  const [loadingPreview, setLoadingPreview] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

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
    organizationService
      .previewMoveWorkspace(Array.from(selectedIds), Number(targetWorkspaceId))
      .then((res) => { if (!cancelled) setPreview(res.organizations) })
      .catch((err) => {
        if (cancelled) return
        console.error("[MoveOrganizationsSheet] error al previsualizar el movimiento:", err)
        setPreview([])
      })
      .finally(() => { if (!cancelled) setLoadingPreview(false) })
    return () => { cancelled = true }
  }, [step, targetWorkspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const targetName = workspaceOptions.find((w) => w.value === targetWorkspaceId)?.label
  const totalContacts = (preview ?? []).reduce((sum, o) => sum + o.contacts.length, 0)
  const movableContacts = (preview ?? []).reduce((sum, o) => sum + o.contacts.filter((c) => !c.blocked).length, 0)

  function handleClose() {
    onOpenChange(false)
  }

  async function handleConfirmMove() {
    if (!preview || preview.length === 0) return
    const confirmed = await orgConfirm.moveWorkspace(preview.length, targetName)
    if (!confirmed) return

    setSubmitting(true)
    try {
      const result = await organizationService.moveWorkspace({
        organizationIds: preview.map((o) => o.id),
        targetWorkspaceId: Number(targetWorkspaceId),
      })
      notify.success({
        title: "Organizaciones movidas",
        description: `${result.organizationsMoved} organización${result.organizationsMoved !== 1 ? "es" : ""} y ${result.contactsMoved} contacto${result.contactsMoved !== 1 ? "s" : ""} se movieron a "${targetName}".`,
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
    select: "Elige las organizaciones que quieres transferir",
    review: `${selectedIds.size} organización${selectedIds.size !== 1 ? "es" : ""} seleccionada${selectedIds.size !== 1 ? "s" : ""}`,
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
                  La organización se mueve siempre completa, junto con todos sus contactos, notas e
                  intereses. Un contacto con oportunidades sin avance se reubica solo; uno con cotización,
                  actividad o avance real queda en el espacio de origen, solo desvinculado de la organización.
                </p>
              </div>

              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar organización..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              <div className="overflow-hidden rounded-md border">
                {rows.length === 0 && !loadingRows ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    {rowsError ? "No se pudieron cargar las organizaciones. Intenta de nuevo." : "No se encontraron organizaciones."}
                  </div>
                ) : (
                  rows.map((row) => (
                    <label
                      key={row.id}
                      className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/30"
                    >
                      <Checkbox
                        aria-label={`Seleccionar ${row.name}`}
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => toggleRow(row.id)}
                      />
                      <EntityAccentBar seed={row.id} />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate text-sm font-medium">{row.name}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <UsersIcon className="size-3.5" />
                        {row.contactCount}
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
                  No eres admin ni owner en ningún otro espacio de trabajo — solo puedes mover organizaciones
                  a espacios donde tengas ese rol.
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

              {targetWorkspaceId && !loadingPreview && preview && preview.map((org) => {
                const blocked = org.contacts.filter((c) => c.blocked)
                return (
                  <div key={org.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        <CheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                        {org.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {org.contacts.length === 0
                          ? "sin contactos"
                          : blocked.length > 0
                            ? `${org.contacts.length - blocked.length} de ${org.contacts.length} contactos se mueven`
                            : `${org.contacts.length} contacto${org.contacts.length !== 1 ? "s" : ""} se mueven`}
                      </span>
                    </div>

                    {org.contacts.map((c) => (
                      <div key={c.id} className={`space-y-1 rounded-md p-2 ${c.blocked ? "bg-destructive/5" : "bg-muted/30"}`}>
                        <p className="text-xs font-medium">{c.name}</p>
                        {c.opportunities.length === 0 && !c.blocked && (
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
                              : `Oportunidad "${op.name}" — ${op.blockReason ?? "no se puede mover automáticamente"} — este contacto se queda en origen, sin organización`}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {step === "select" && (
          <div className="flex items-center justify-between gap-2 border-t p-4">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
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
              {preview && totalContacts > 0 ? `${movableContacts} de ${totalContacts} contactos se moverán` : ""}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("select")}>Atrás</Button>
              <Button
                type="button"
                disabled={!targetWorkspaceId || loadingPreview || !preview || preview.length === 0 || submitting}
                onClick={handleConfirmMove}
              >
                {submitting && <LoaderCircleIcon className="size-4 animate-spin" />}
                <ArrowRightLeftIcon className="size-4" />
                Mover {preview && preview.length > 0 ? preview.length : ""} organización{(preview?.length ?? 0) !== 1 ? "es" : ""}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
