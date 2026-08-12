"use client"

import * as React from "react"
import { ClockIcon, FileTextIcon, Loader2Icon, SendIcon, SparklesIcon, ZapIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { widgetNotify } from "@/lib/notify"
import { widgetAIService } from "@/services/widget-ai.service"
import { createEmptyWidgetForm, type WidgetFormState } from "./shared/form-state"
import { Step1General } from "./steps/Step1General"
import { Step2Knowledge } from "./steps/Step2Knowledge"
import { Step3Actions } from "./steps/Step3Actions"
import { Step4Availability } from "./steps/Step4Availability"
import { Step5Review } from "./steps/Step5Review"

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const STEPS: StepperStep[] = [
  { id: 1, label: "General", icon: SparklesIcon },
  { id: 2, label: "Conocimiento", icon: FileTextIcon },
  { id: 3, label: "Acciones", icon: ZapIcon },
  { id: 4, label: "Disponibilidad", icon: ClockIcon },
  { id: 5, label: "Revisar", icon: SendIcon },
]

interface CreateWidgetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widgetId?: number
  onSuccess?: () => void
}

export function CreateWidgetSheet({ open, onOpenChange, widgetId, onSuccess }: CreateWidgetSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 1400, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && (
          <WidgetWizard
            widgetId={widgetId}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function LoadingState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin" />
      <span className="text-sm">Cargando widget...</span>
      <Button type="button" variant="ghost" size="sm" onClick={onClose}>
        Cancelar
      </Button>
    </div>
  )
}

function WidgetWizard({
  widgetId,
  onClose,
  onSuccess,
}: {
  widgetId?: number
  onClose: () => void
  onSuccess?: () => void
}) {
  const isEditMode = widgetId !== undefined

  const [step, setStep] = React.useState(1)
  const [form, setForm] = React.useState(createEmptyWidgetForm())
  const [submitting, setSubmitting] = React.useState(false)
  const [loadingWidget, setLoadingWidget] = React.useState(isEditMode)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!widgetId) return
    let cancelled = false
    setLoadingWidget(true)
    Promise.all([widgetAIService.getById(widgetId), widgetAIService.getDocuments(widgetId)])
      .then(([widget, documents]) => {
        if (cancelled) return
        const mapped: WidgetFormState = {
          ...createEmptyWidgetForm(),
          name: widget.name,
          description: widget.description ?? "",
          chatTitle: widget.chat_title,
          brandColor: widget.brand_color,
          existingLogoUrl: widget.brand_logo_url ?? "",
          isActive: widget.is_active,
          welcomeMessage: widget.welcome_message,
          existingDocs: documents,
          faqs: (widget.suggested_questions ?? []).map((q) => ({
            id: crypto.randomUUID(),
            question: q.question,
            answer: q.answer,
          })),
          prompt: widget.system_prompt,
          leadCaptureEnabled: widget.lead_capture_enabled,
          leadCaptureMessage: widget.lead_capture_message ?? "",
          position: widget.position as WidgetFormState["position"],
          allowedDomains: widget.allowed_domains.join(", "),
        }
        setForm(mapped)
        setLoadingWidget(false)
      })
      .catch(() => {
        if (cancelled) return
        widgetNotify.error("No se pudo cargar el widget")
        onClose()
      })
    return () => { cancelled = true }
  }, [widgetId]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  const canNext = (step === 1 && form.name.trim().length > 0) || step > 1

  function handleNext() {
    if (!canNext) return
    setStep((s) => Math.min(STEPS.length, s + 1))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      widgetNotify.error("Falta el nombre del widget")
      setStep(1)
      return
    }
    if (!form.prompt.trim()) {
      widgetNotify.error("Falta el prompt del agente (Instrucciones)")
      setStep(2)
      return
    }

    setSubmitting(true)
    try {
      const basePayload = {
        name: form.name,
        description: form.description || undefined,
        system_prompt: form.prompt,
        welcome_message: form.welcomeMessage || undefined,
        suggested_questions: form.faqs
          .filter((f) => f.question.trim() && f.answer.trim())
          .map(({ question, answer }) => ({ question, answer })),
        lead_capture_enabled: form.leadCaptureEnabled,
        lead_capture_message: form.leadCaptureMessage || undefined,
        brand_color: form.brandColor,
        chat_title: form.chatTitle,
        position: form.position,
        allowed_domains: form.allowedDomains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      }

      const targetId = isEditMode
        ? (await widgetAIService.update(widgetId!, { ...basePayload, is_active: form.isActive })).id
        : (await widgetAIService.create(basePayload)).id

      if (form.logoFile) {
        const base64 = await fileToBase64(form.logoFile)
        await widgetAIService.uploadLogo(targetId, form.logoFile.name, base64)
      }

      if (form.docFiles.length > 0) {
        await Promise.all(
          form.docFiles.map(async ({ file }) => {
            const base64 = await fileToBase64(file)
            return widgetAIService.uploadDocument(targetId, file.name, base64, file.type)
          })
        )
      }

      if (isEditMode) {
        widgetNotify.updated(form.name)
      } else {
        widgetNotify.created(form.name)
      }
      onSuccess?.()
      onClose()
    } catch (error: any) {
      widgetNotify.error(error?.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingWidget) {
    return <LoadingState onClose={onClose} />
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>{isEditMode ? "Editar Widget de IA" : "Crear Widget de IA"}</SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Modifica la configuración del chatbot embebible."
                : "Configura un chatbot embebible que responde, captura leads y ejecuta acciones en tu CRM."}
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
        {step === 1 && <Step1General form={form} setForm={setForm} />}
        {step === 2 && <Step2Knowledge form={form} setForm={setForm} widgetId={widgetId} />}
        {step === 3 && <Step3Actions form={form} setForm={setForm} />}
        {step === 4 && <Step4Availability form={form} setForm={setForm} />}
        {step === 5 && <Step5Review form={form} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
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
              {submitting && <Loader2Icon className="size-4 animate-spin" />}
              {submitting ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear Widget"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
