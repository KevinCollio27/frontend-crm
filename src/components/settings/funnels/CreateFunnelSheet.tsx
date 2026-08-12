"use client"

import * as React from "react"
import { LoaderCircleIcon, ListIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { flowNotify } from "@/lib/notify"
import { flowService } from "@/services/flow.service"
import { createEmptyFunnelForm, isNewId, type FunnelFormState } from "./shared/form-state"
import { Step1Info } from "./steps/Step1Info"
import { Step2Stages } from "./steps/Step2Stages"

const STEPS: StepperStep[] = [
  { id: 1, label: "Información", icon: SlidersHorizontalIcon },
  { id: 2, label: "Etapas", icon: ListIcon },
]

interface CreateFunnelSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funnel?: FunnelFormState
  onSuccess?: () => void
}

export function CreateFunnelSheet({ open, onOpenChange, funnel, onSuccess }: CreateFunnelSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && <FunnelWizard funnel={funnel} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </SheetContent>
    </Sheet>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message ?? fallback
}

// Timing por llamada individual — para evaluar qué paso pesa más.
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now()
  console.log(`[flow] ${label} start`)
  try {
    const result = await fn()
    console.log(`[flow] ${label} OK → ${Date.now() - t0}ms`)
    return result
  } catch (error) {
    console.log(`[flow] ${label} FAILED → ${Date.now() - t0}ms`)
    throw error
  }
}

// delete de etapa nunca "rechaza" por HTTP (siempre 200) — si viene bloqueada por uso, la
// convertimos acá en una excepción normal para que el try/catch del submit la maneje igual
// que cualquier otra falla.
async function deleteStageOrThrow(id: number, name: string) {
  const result = await timed(`delete stage "${name}"`, () => flowService.deleteStage(id))
  if (!result.success) throw new Error(result.message ?? `No se pudo eliminar la etapa "${name}".`)
}

function FunnelWizard({
  funnel,
  onClose,
  onSuccess,
}: {
  funnel?: FunnelFormState
  onClose: () => void
  onSuccess?: () => void
}) {
  const isEditing = !!funnel
  const [step, setStep] = React.useState(1)
  const [form, setForm] = React.useState(funnel ?? createEmptyFunnelForm())
  const [submitting, setSubmitting] = React.useState(false)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  const canNext = step === 1 ? form.name.trim().length > 0 : true

  function handleNext() {
    if (!canNext) return
    setStep((s) => Math.min(STEPS.length, s + 1))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      flowNotify.error("Falta el nombre del embudo.")
      setStep(1)
      return
    }
    const namedStages = form.stages.filter((s) => s.name.trim())
    if (namedStages.length === 0) {
      flowNotify.error("Agrega al menos una etapa.")
      setStep(2)
      return
    }

    setSubmitting(true)
    const t0 = Date.now()
    console.log(`[flow] submit (${isEditing ? "update" : "create"}) start`)
    try {
      if (isEditing && funnel?.id) {
        const flowId = funnel.id

        // Etapas que existían y ya no están → eliminar (independientes entre sí)
        const currentStageIds = new Set(namedStages.filter((s) => !isNewId(s.id)).map((s) => s.id))
        const deleteStageTasks = funnel.stages
          .filter((original) => !isNewId(original.id) && !currentStageIds.has(original.id))
          .map((original) => deleteStageOrThrow(Number(original.id), original.name))

        // Etapas actuales: nuevas → crear, existentes → actualizar — cada una independiente de las demás
        const stageTasks = namedStages.map((stage, i) =>
          isNewId(stage.id)
            ? timed(`create stage "${stage.name}"`, () => flowService.createStage({ name: stage.name.trim(), orderNumber: i + 1, flowId }))
            : timed(`update stage "${stage.name}"`, () => flowService.updateStage(Number(stage.id), { name: stage.name.trim(), orderNumber: i + 1, flowId }))
        )

        await Promise.all([
          timed("update flow", () => flowService.update(flowId, { name: form.name.trim(), isDefault: form.isDefault })),
          ...deleteStageTasks,
          ...stageTasks,
        ])

        console.log(`[flow] submit (update) OK → ${Date.now() - t0}ms total`)
        flowNotify.updated(form.name.trim())
      } else {
        const created = await timed("create flow", () => flowService.create({ name: form.name.trim(), isDefault: form.isDefault }))

        await Promise.all(
          namedStages.map((stage, i) =>
            timed(`create stage "${stage.name}"`, () =>
              flowService.createStage({ name: stage.name.trim(), orderNumber: i + 1, flowId: created.id })
            )
          )
        )

        console.log(`[flow] submit (create) OK → ${Date.now() - t0}ms total`)
        flowNotify.created(created.name)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      flowNotify.error(
        errorMessage(error, isEditing ? "No se pudieron guardar todos los cambios." : "El embudo se creó pero no se pudieron guardar todas las etapas.")
      )
      onSuccess?.() // refresca la tabla igual — algo puede haber quedado guardado
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>{isEditing ? "Editar Embudo" : "Crear Embudo"}</SheetTitle>
            <SheetDescription>
              {isEditing ? "Actualiza la información y etapas del embudo." : "Crea un nuevo embudo de ventas."}
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-5">
        {step === 1 && <Step1Info form={form} setForm={setForm} />}
        {step === 2 && <Step2Stages form={form} setForm={setForm} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t p-4">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
          >
            Anterior
          </Button>
          {step < STEPS.length ? (
            <Button type="button" onClick={handleNext} disabled={!canNext}>
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Guardar" : "Crear Embudo"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
