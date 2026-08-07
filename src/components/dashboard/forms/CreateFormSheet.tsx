"use client"

import * as React from "react"
import { FileTextIcon, ListPlusIcon, Loader2Icon, SendIcon, UsersIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { notify } from "@/lib/notify"
import { flowService } from "@/services/flow.service"
import { formService } from "@/services/form.service"
import type { Flow } from "@/types/flow"
import type { FormRaw } from "@/types/form"
import { Step1Info } from "./steps/Step1Info"
import { Step2Base } from "./steps/Step2Base"
import { Step3Additional } from "./steps/Step3Additional"
import { Step4Review } from "./steps/Step4Review"
import {
  buildBaseConfig,
  createDefaultDesign,
  createEmptyFormState,
  type FormFormState,
} from "./shared/form-state"

const STEPS: StepperStep[] = [
  { id: 1, label: "Información",  icon: FileTextIcon },
  { id: 2, label: "Base",         icon: UsersIcon },
  { id: 3, label: "Adicionales",  icon: ListPlusIcon },
  { id: 4, label: "Resumen",      icon: SendIcon },
]

interface CreateFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editForm?: FormRaw | null
  onSuccess?: () => void
}

export function CreateFormSheet({ open, onOpenChange, editForm, onSuccess }: CreateFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 1400, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open && (
          <FormWizard
            editForm={editForm ?? null}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

// Formularios creados antes de este builder guardaban LinkedIn/Instagram como
// campos fijos separados (contact.fields.linkedin / .instagram) y "Fuente" sin
// catálogo de opciones. Si abrimos uno de esos para editar, lo migramos acá en
// vez de perder silenciosamente esos datos al guardar con el formato nuevo.
function mergeContactFields(defaults: FormFormState["contact"]["fields"], raw: Record<string, any>): FormFormState["contact"]["fields"] {
  const merged = { ...defaults, ...raw }

  if (!Array.isArray(merged.source?.options)) {
    merged.source = { ...defaults.source, ...raw?.source }
  }

  if (!raw?.social) {
    const legacyLinkedin = raw?.linkedin
    const legacyInstagram = raw?.instagram
    if (legacyLinkedin?.enabled) {
      merged.social = { enabled: true, required: !!legacyLinkedin.required, label: legacyLinkedin.label || "LinkedIn", placeholder: legacyLinkedin.placeholder || "", network: "linkedin" }
    } else if (legacyInstagram?.enabled) {
      merged.social = { enabled: true, required: !!legacyInstagram.required, label: legacyInstagram.label || "Instagram", placeholder: legacyInstagram.placeholder || "", network: "instagram" }
    }
  }

  return merged
}

function parseFormRaw(raw: FormRaw): FormFormState {
  const cfg = (raw.base_config ?? {}) as Record<string, any>
  const defaults = createEmptyFormState()
  const isClassic = !!cfg.contact?.fields

  return {
    name:        raw.name,
    slug:        raw.slug,
    description: typeof cfg.description === "string" ? cfg.description : "",
    flowId:      String(raw.flow_id),
    isActive:    raw.is_active,
    contact:      isClassic
      ? {
          fields: mergeContactFields(defaults.contact.fields, cfg.contact.fields),
          order: Array.isArray(cfg.contact.order) ? cfg.contact.order : defaults.contact.order,
        }
      : defaults.contact,
    organization: isClassic && cfg.organization
      ? {
          enabled: !!cfg.organization.enabled,
          fields: { ...defaults.organization.fields, ...cfg.organization.fields },
          order: Array.isArray(cfg.organization.order) ? cfg.organization.order : defaults.organization.order,
        }
      : defaults.organization,
    opportunity: isClassic && cfg.opportunity
      ? {
          fields: { ...defaults.opportunity.fields, ...cfg.opportunity.fields },
          order: Array.isArray(cfg.opportunity.order) ? cfg.opportunity.order : defaults.opportunity.order,
        }
      : defaults.opportunity,
    customFields: isClassic && Array.isArray(cfg.custom_fields) ? cfg.custom_fields : [],
    design: cfg.design ? { ...createDefaultDesign(), ...cfg.design } : createDefaultDesign(),
  }
}

function buildPayload(form: FormFormState) {
  return {
    name:        form.name.trim(),
    slug:        form.slug.trim(),
    flow_id:     Number(form.flowId),
    is_active:   form.isActive,
    base_config: buildBaseConfig(form),
  }
}

interface FormWizardProps {
  editForm: FormRaw | null
  onClose: () => void
  onSuccess?: () => void
}

function FormWizard({ editForm, onClose, onSuccess }: FormWizardProps) {
  const isEdit = editForm !== null
  const [step, setStep]   = React.useState(1)
  const [form, setForm]   = React.useState<FormFormState>(() =>
    isEdit ? parseFormRaw(editForm!) : createEmptyFormState()
  )
  const [flows, setFlows] = React.useState<Flow[]>([])
  const [saving, setSaving] = React.useState(false)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    flowService.all().then((loaded) => {
      setFlows(loaded)
      if (!isEdit) {
        setForm((f) => {
          if (f.flowId) return f
          const def = loaded.find((fl) => fl.is_default) ?? loaded[0]
          return def ? { ...f, flowId: String(def.id) } : f
        })
      }
    }).catch(() => {})
  }, [isEdit])

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  const canNext =
    (step === 1 && form.name.trim().length > 0 && form.slug.trim().length > 0 && form.flowId.trim().length > 0) ||
    step > 1

  async function handleSubmit() {
    if (!form.name.trim() || !form.slug.trim() || !form.flowId.trim()) {
      notify.error({ title: "Completa los campos obligatorios", description: "Revisa nombre, slug y embudo destino." })
      setStep(1)
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload(form)
      const saved = isEdit
        ? await formService.update(editForm!.id, payload)
        : await formService.create(payload)

      const slugChanged = saved.slug !== payload.slug
      if (isEdit) {
        notify.info({
          title: "Formulario actualizado",
          description: slugChanged
            ? `Los cambios se guardaron. El slug "${payload.slug}" ya estaba en uso en otro workspace, se guardó como "${saved.slug}".`
            : "Los cambios se guardaron correctamente.",
        })
      } else {
        notify.success({
          title: "Formulario creado",
          description: slugChanged
            ? `El slug "${payload.slug}" ya estaba en uso en otro workspace, se creó como "${saved.slug}".`
            : "Ya puedes embeber el formulario en tu web.",
        })
      }
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      const isSlugTaken = msg.toLowerCase().includes("slug") && msg.toLowerCase().includes("uso")
      if (isSlugTaken) {
        notify.error({
          title: "Slug ya está en uso",
          description: `El slug "${form.slug}" ya existe. Cambia el slug en el paso 1.`,
        })
        setStep(1)
      } else {
        notify.error({ title: isEdit ? "Error al actualizar" : "Error al crear", description: msg || "Error desconocido" })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>{isEdit ? "Editar Formulario" : "Crear Formulario"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Modifica la configuración de tu formulario."
                : "Diseña un formulario público para capturar leads en tu CRM."}
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
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 sm:p-6">
        {step === 1 && <Step1Info form={form} setForm={setForm} flows={flows} isEdit={isEdit} />}
        {step === 2 && <Step2Base form={form} setForm={setForm} />}
        {step === 3 && <Step3Additional form={form} setForm={setForm} />}
        {step === 4 && <Step4Review form={form} flows={flows} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
          >
            Anterior
          </Button>
          {step < STEPS.length ? (
            <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))} disabled={!canNext}>
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              {isEdit ? "Guardar Cambios" : "Crear Formulario"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
