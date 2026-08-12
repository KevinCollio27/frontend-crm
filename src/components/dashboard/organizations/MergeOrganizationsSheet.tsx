"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2Icon, CircleIcon, GitMergeIcon, Loader2Icon, PlusIcon, SearchIcon, StarIcon, UsersIcon, XCircleIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { orgConfirm } from "@/lib/confirm"
import { orgNotify } from "@/lib/notify"
import { organizationService } from "@/services/organization.service"
import type { OrganizationDuplicateCandidate, OrganizationDuplicateGroup, OrganizationRaw } from "@/types/organization"
import {
  computeDetailPlan,
  computeFieldPlan,
  computeImpact,
  suggestSurvivor,
} from "./merge-utils"

const STEPS: StepperStep[] = [
  { id: 1, label: "Elegir base", icon: UsersIcon },
  { id: 2, label: "Comparar y confirmar", icon: GitMergeIcon },
]

interface Props {
  open: boolean
  group: OrganizationDuplicateGroup
  onOpenChange: (open: boolean) => void
  onMerged: () => void
}

export function MergeOrganizationsSheet({ open, group, onOpenChange, onMerged }: Props) {
  const [step, setStep] = React.useState(1)
  const [candidates, setCandidates] = React.useState<OrganizationDuplicateCandidate[]>(group.organizations)
  const [extraIds, setExtraIds] = React.useState<Set<number>>(new Set())
  const [survivorId, setSurvivorId] = React.useState<number | null>(
    group.organizations.length > 0 ? suggestSurvivor(group.organizations) : null
  )
  const [fieldChoices, setFieldChoices] = React.useState<Record<string, string>>({})
  const [detailChoices, setDetailChoices] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)

  const suggestedId = React.useMemo(() => (candidates.length > 0 ? suggestSurvivor(candidates) : null), [candidates])

  // Si el survivor actual desaparece de la lista (o todavía no hay ninguno elegido
  // porque se partió de una fusión manual vacía), sigue al sugerido automáticamente.
  React.useEffect(() => {
    if (suggestedId === null) return
    if (survivorId === null || !candidates.some((o) => o.id === survivorId)) {
      setSurvivorId(suggestedId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, suggestedId])

  const survivor = candidates.find((o) => o.id === survivorId)
  const losers = candidates.filter((o) => o.id !== survivorId)
  const canProceed = candidates.length >= 2 && survivor !== undefined

  const fieldPlan = React.useMemo(() => (survivor ? computeFieldPlan(survivor, losers) : []), [survivor, losers])
  const detailPlan = React.useMemo(() => (survivor ? computeDetailPlan(survivor, losers) : []), [survivor, losers])
  const impact = React.useMemo(() => computeImpact(losers), [losers])

  function handleAddCandidate(org: OrganizationDuplicateCandidate) {
    setCandidates((prev) => [...prev, org])
    setExtraIds((prev) => new Set(prev).add(org.id))
  }

  function handleRemoveCandidate(id: number) {
    setCandidates((prev) => prev.filter((o) => o.id !== id))
    setExtraIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    // El efecto de arriba reasigna el survivor al sugerido si el que se quitó era el elegido.
  }

  async function handleConfirm() {
    if (!survivor) return
    const confirmed = await orgConfirm.merge(candidates.length, survivor.name)
    if (!confirmed) return

    setSubmitting(true)
    try {
      const fieldOverrides: Record<string, string | null> = {}
      for (const row of fieldPlan) {
        if (row.status === "conflict") fieldOverrides[row.field] = fieldChoices[row.field] ?? row.value
      }
      const detailResolutions = detailPlan
        .filter((r) => r.status === "conflict")
        .map((r) => ({ label_id: r.label_id, option_id: r.option_id, value: detailChoices[r.key] ?? r.value }))

      await organizationService.merge({
        survivorId: survivor.id,
        loserIds: losers.map((l) => l.id),
        fieldOverrides,
        detailResolutions,
      })
      orgNotify.merged(candidates.length, survivor.name)
      onMerged()
    } catch {
      orgNotify.error()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 720, padding: 0, gap: 0 }} className="w-full! flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="space-y-2">
            <SheetTitle className="flex items-center gap-2">
              <GitMergeIcon className="size-4 text-muted-foreground" />
              {group.organizations.length > 0 ? <>Fusionar: &quot;{group.organizations[0].name}&quot;</> : "Fusión manual"}
            </SheetTitle>
            <SheetDescription>
              {candidates.length} organizaciones en esta fusión
              {extraIds.size > 0 && group.organizations.length > 0 && ` (${group.organizations.length} detectadas + ${extraIds.size} agregadas)`}
            </SheetDescription>
            <Stepper steps={STEPS} current={step} />
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={() => onOpenChange(false)} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 && (
            <Step1ChooseSurvivor
              candidates={candidates}
              extraIds={extraIds}
              survivorId={survivorId}
              suggestedId={suggestedId}
              onSelect={setSurvivorId}
              onAdd={handleAddCandidate}
              onRemove={handleRemoveCandidate}
            />
          )}
          {step === 2 && (
            <Step2Compare
              fieldPlan={fieldPlan}
              detailPlan={detailPlan}
              impact={impact}
              fieldChoices={fieldChoices}
              detailChoices={detailChoices}
              onFieldChoice={(field, value) => setFieldChoices((s) => ({ ...s, [field]: value }))}
              onDetailChoice={(key, value) => setDetailChoices((s) => ({ ...s, [key]: value }))}
            />
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t p-4">
          <Button type="button" variant="ghost" onClick={() => (step === 1 ? onOpenChange(false) : setStep(1))} disabled={submitting}>
            {step === 1 ? "Cancelar" : "< Atrás"}
          </Button>
          {step === 1 ? (
            <Button type="button" onClick={() => setStep(2)} disabled={!canProceed}>
              {candidates.length < 2 ? `Agrega ${2 - candidates.length} más` : "Siguiente"}
            </Button>
          ) : (
            <Button type="button" onClick={handleConfirm} disabled={submitting}>
              {submitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Confirmar fusión
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Paso 1 ───────────────────────────────────────────────────────────────────

function Step1ChooseSurvivor({
  candidates,
  extraIds,
  survivorId,
  suggestedId,
  onSelect,
  onAdd,
  onRemove,
}: {
  candidates: OrganizationDuplicateCandidate[]
  extraIds: Set<number>
  survivorId: number | null
  suggestedId: number | null
  onSelect: (id: number) => void
  onAdd: (org: OrganizationDuplicateCandidate) => void
  onRemove: (id: number) => void
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {candidates.length > 0
            ? "Elige cuál organización queda como registro base. Los datos de las demás se usarán para completarla."
            : "Busca y agrega al menos 2 organizaciones para empezar la fusión."}
        </p>
        {candidates.map((org) => {
          const selected = org.id === survivorId
          const isExtra = extraIds.has(org.id)
          return (
            <div
              key={org.id}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <button type="button" onClick={() => onSelect(org.id)} className="flex flex-1 items-center gap-3 min-w-0 text-left">
                {selected ? <CheckCircle2Icon className="size-4 shrink-0 text-primary" /> : <CircleIcon className="size-4 shrink-0 text-muted-foreground" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{org.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    #{org.id} · creado {format(new Date(org.created_at), "d MMM, HH:mm", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {org.counts.opportunities} vacantes · {org.counts.notes} notas · {org.counts.contacts} contactos
                  </p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                {org.id === suggestedId && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    <StarIcon className="size-3" /> Sugerido
                  </span>
                )}
                {isExtra && (
                  <button
                    type="button"
                    onClick={() => onRemove(org.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Quitar de la fusión"
                  >
                    <XCircleIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AddOrganizationSearch excludeIds={candidates.map((o) => o.id)} onAdd={onAdd} />
    </div>
  )
}

function AddOrganizationSearch({
  excludeIds,
  onAdd,
}: {
  excludeIds: number[]
  onAdd: (org: OrganizationDuplicateCandidate) => void
}) {
  const [search, setSearch] = React.useState("")
  const [results, setResults] = React.useState<OrganizationRaw[]>([])
  const [searching, setSearching] = React.useState(false)
  const [addingId, setAddingId] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    let cancelled = false
    setSearching(true)
    const t = setTimeout(() => {
      organizationService
        .list({ filter: search, take: 8 })
        .then((res) => { if (!cancelled) setResults(res.data.filter((o) => !excludeIds.includes(o.id))) })
        .catch(() => { if (!cancelled) setResults([]) })
        .finally(() => { if (!cancelled) setSearching(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handlePick(org: OrganizationRaw) {
    setAddingId(org.id)
    try {
      const candidate = await organizationService.getMergeCandidate(org.id)
      onAdd(candidate)
      // Deja el buscador y el resto de los resultados como están — así se pueden
      // agregar varias coincidencias de la misma búsqueda sin tener que re-tipear.
      setResults((prev) => prev.filter((o) => o.id !== org.id))
    } catch {
      orgNotify.error()
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-xs font-medium text-muted-foreground">¿Falta una organización? Búscala y agrégala a esta fusión.</p>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 pl-8 text-sm"
          placeholder="Buscar por nombre o RUT…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {search.trim() && (
        <div className="rounded-md border">
          {searching ? (
            <div className="flex items-center justify-center py-4">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Sin resultados para &quot;{search}&quot;</p>
          ) : (
            <div className="divide-y">
              {results.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handlePick(org)}
                  disabled={addingId === org.id}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                >
                  <span className="truncate">{org.name}{org.document_number ? ` · ${org.document_number}` : ""}</span>
                  {addingId === org.id ? <Loader2Icon className="size-3.5 shrink-0 animate-spin" /> : <PlusIcon className="size-3.5 shrink-0 text-muted-foreground" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Paso 2 ───────────────────────────────────────────────────────────────────

function ChoiceRow({
  options,
  selected,
  onChoose,
}: {
  options: { value: string; orgId: number }[]
  selected: string
  onChoose: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      {options.map((opt, i) => (
        <button
          key={`${opt.orgId}-${i}`}
          type="button"
          onClick={() => onChoose(opt.value)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors",
            selected === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
          )}
        >
          {selected === opt.value ? <CheckCircle2Icon className="size-3.5 shrink-0 text-primary" /> : <CircleIcon className="size-3.5 shrink-0 text-muted-foreground" />}
          <span className="truncate">{opt.value}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">#{opt.orgId}</span>
        </button>
      ))}
    </div>
  )
}

function Step2Compare({
  fieldPlan,
  detailPlan,
  impact,
  fieldChoices,
  detailChoices,
  onFieldChoice,
  onDetailChoice,
}: {
  fieldPlan: ReturnType<typeof computeFieldPlan>
  detailPlan: ReturnType<typeof computeDetailPlan>
  impact: ReturnType<typeof computeImpact>
  fieldChoices: Record<string, string>
  detailChoices: Record<string, string>
  onFieldChoice: (field: string, value: string) => void
  onDetailChoice: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Campo</th>
              <th className="px-3 py-2 text-left font-medium">Valor final</th>
              <th className="px-3 py-2 text-left font-medium">Origen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fieldPlan.map((row) => (
              <tr key={row.field} className="align-top">
                <td className="px-3 py-2.5 font-medium">{row.label}</td>
                <td className="px-3 py-2.5">
                  {row.status === "empty" ? (
                    <span className="text-muted-foreground">(vacío en todas)</span>
                  ) : row.status === "conflict" ? (
                    <ChoiceRow options={row.options!} selected={fieldChoices[row.field] ?? row.value!} onChoose={(v) => onFieldChoice(row.field, v)} />
                  ) : (
                    row.value
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {row.status === "conflict" ? "elegir arriba" : row.source ?? "—"}
                  {row.status === "auto" && row.source !== "Base" && " (única con dato)"}
                </td>
              </tr>
            ))}
            {detailPlan.map((row) => (
              <tr key={row.key} className="align-top">
                <td className="px-3 py-2.5 font-medium">{row.labelName}</td>
                <td className="px-3 py-2.5">
                  {row.status === "conflict" ? (
                    <ChoiceRow options={row.options!} selected={detailChoices[row.key] ?? row.value} onChoose={(v) => onDetailChoice(row.key, v)} />
                  ) : (
                    row.value
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {row.status === "conflict" ? "elegir arriba" : `${row.source} (único con dato)`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="mb-2 font-medium">Al confirmar se reasignan a la organización final:</p>
        <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
          <li>• {impact.opportunities} vacantes (oportunidades)</li>
          <li>• {impact.notes} notas</li>
          <li>• {impact.contacts} contactos</li>
          <li>• {impact.challenges} desafíos</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Las organizaciones no elegidas quedan archivadas — nunca se borran. Queda respaldo completo por si algo sale mal.
        </p>
      </div>
    </div>
  )
}
