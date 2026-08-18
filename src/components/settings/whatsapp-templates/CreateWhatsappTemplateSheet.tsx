"use client"

import * as React from "react"
import { EyeIcon, InfoIcon, MessageSquareTextIcon, PlusIcon, TrashIcon, XIcon } from "lucide-react"
import { notify } from "@/lib/notify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { Textarea } from "@/components/ui/textarea"
import { whatsappService } from "@/services/whatsapp.service"
import type { TemplateButtonPayload, WhatsappTemplateRaw } from "@/types/whatsapp"
import { WhatsAppTemplatePreview } from "./WhatsAppTemplatePreview"

const STEPS: StepperStep[] = [
  { id: 1, label: "Información", icon: InfoIcon },
  { id: 2, label: "Contenido",    icon: MessageSquareTextIcon },
  { id: 3, label: "Vista previa", icon: EyeIcon },
]

const CATEGORIES = ["UTILITY", "MARKETING", "AUTHENTICATION"] as const
const HEADER_MODES = [
  { value: "none",  label: "Ninguno" },
  { value: "text",  label: "Texto" },
  { value: "image", label: "Imagen" },
] as const

const VARIABLE_OPTIONS = [
  { label: "Nombre", sample: "Juan Pérez" },
  { label: "Empresa", sample: "Acme S.A." },
  { label: "Fecha", sample: "23 abr 2026" },
  { label: "Número", sample: "COT-001" },
] as const

const MAX_BUTTONS = 2

interface TemplateButtonDraft {
  key: string
  text: string
  url: string
}

let buttonKeySeq = 0
const newButtonKey = () => `btn-${++buttonKeySeq}`

export interface TemplatePrefill {
  language: string
  category: string
  headerMode: "none" | "text" | "image"
  headerText?: string
  headerImageUrl?: string
  bodyText: string
  footerText?: string
  buttons: { text: string; url: string }[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (result: WhatsappTemplateRaw) => void
  prefill?: TemplatePrefill
}

export function CreateWhatsappTemplateSheet({ open, onOpenChange, onSuccess, prefill }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 1400, padding: 0, gap: 0 }} className="w-full!">
        {open && <TemplateWizard onClose={() => onOpenChange(false)} onSuccess={onSuccess} prefill={prefill} />}
      </SheetContent>
    </Sheet>
  )
}

function TemplateWizard({
  onClose,
  onSuccess,
  prefill,
}: {
  onClose: () => void
  onSuccess?: (result: WhatsappTemplateRaw) => void
  prefill?: TemplatePrefill
}) {
  const bodyRef = React.useRef<HTMLTextAreaElement>(null)
  const [step, setStep] = React.useState(1)
  const [submitting, setSubmitting] = React.useState(false)
  const [varMap, setVarMap] = React.useState<Record<number, string>>({})
  const [name, setName] = React.useState("")
  const [language, setLanguage] = React.useState(prefill?.language ?? "es")
  const [category, setCategory] = React.useState<string>(prefill?.category ?? "UTILITY")
  const [headerMode, setHeaderMode] = React.useState<"none" | "text" | "image">(prefill?.headerMode ?? "none")
  const [headerText, setHeaderText] = React.useState(prefill?.headerText ?? "")
  const [headerImageUrl, setHeaderImageUrl] = React.useState(prefill?.headerImageUrl ?? "")
  const [bodyText, setBodyText] = React.useState(prefill?.bodyText ?? "")
  const [footerText, setFooterText] = React.useState(prefill?.footerText ?? "")
  const [buttons, setButtons] = React.useState<TemplateButtonDraft[]>(
    () => prefill?.buttons.map((b) => ({ key: newButtonKey(), text: b.text, url: b.url })) ?? [],
  )

  const canNext = name.trim().length > 0 && language.trim().length > 0
  const canSubmit = bodyText.trim().length > 0
    && (headerMode !== "image" || headerImageUrl.trim().length > 0)
    && buttons.every((b) => b.text.trim() && b.url.trim())

  function insertVariable(label: string) {
    const textarea = bodyRef.current
    const existing = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)].map((m) => parseInt(m[1]!))
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1
    const variable = `{{${nextNum}}}`

    const start = textarea?.selectionStart ?? bodyText.length
    const end = textarea?.selectionEnd ?? bodyText.length
    const newText = bodyText.slice(0, start) + variable + bodyText.slice(end)

    setBodyText(newText)
    setVarMap((prev) => ({ ...prev, [nextNum]: label }))

    setTimeout(() => {
      textarea?.focus()
      textarea?.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const bodyPreview = bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const label = varMap[parseInt(n)]
    const opt = VARIABLE_OPTIONS.find((o) => o.label === label)
    return opt ? opt.sample : `[var ${n}]`
  })

  function addButton() {
    if (buttons.length >= MAX_BUTTONS) return
    setButtons((prev) => [...prev, { key: newButtonKey(), text: "", url: "" }])
  }

  function updateButton(key: string, field: "text" | "url", value: string) {
    setButtons((prev) => prev.map((b) => (b.key === key ? { ...b, [field]: value } : b)))
  }

  function removeButton(key: string) {
    setButtons((prev) => prev.filter((b) => b.key !== key))
  }

  async function handleSubmit() {
    if (!canSubmit) return

    const body = bodyText.trim()
    if (/^\{\{\d+\}\}/.test(body)) {
      notify.error({ title: "Variable al inicio", description: "El mensaje no puede comenzar con una variable. Agrega texto antes." })
      return
    }
    if (/\{\{\d+\}\}$/.test(body)) {
      notify.error({ title: "Variable al final", description: "El mensaje no puede terminar con una variable. Agrega texto después." })
      return
    }

    const buttonPayloads: TemplateButtonPayload[] = buttons.map((b) => ({
      type: "URL",
      text: b.text.trim(),
      url: b.url.trim(),
    }))

    setSubmitting(true)
    try {
      const result = await whatsappService.createTemplate({
        name: name.trim(),
        language,
        category,
        bodyText: body,
        headerText: headerMode === "text" ? headerText.trim() || undefined : undefined,
        headerImageUrl: headerMode === "image" ? headerImageUrl.trim() || undefined : undefined,
        footerText: footerText.trim() || undefined,
        buttons: buttonPayloads.length > 0 ? buttonPayloads : undefined,
      })
      notify.success({ title: "Template creado", description: `Estado inicial: ${result.status || "PENDING"}.` })
      onSuccess?.(result)
      onClose()
    } catch (error) {
      notify.error({
        title: "No se pudo crear el template",
        description: (error as { message?: string; extraMessage?: string })?.extraMessage
          ?? (error as { message?: string })?.message
          ?? "Intenta de nuevo.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>{prefill ? "Duplicar template" : "Crear template de WhatsApp"}</SheetTitle>
            <SheetDescription>
              {prefill ? "Ajusta el contenido y ponle un nombre nuevo — " : ""}Debe ser aprobado por Meta antes de poder usarse.
            </SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        {step === 1 && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section title="Información general" description="Nombre único y el idioma en que se envía.">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="mi_template" autoFocus />
                  <p className="text-xs text-muted-foreground">Minúsculas, números y guiones bajos.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Idioma *</Label>
                  <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="es" />
                </div>
              </div>
            </Section>

            <Section title="Categoría" description="Define qué política de Meta aplica a este template.">
              <Select value={category} onValueChange={(v) => setCategory(v ?? "UTILITY")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section title="Encabezado" description="Opcional — texto simple o una imagen. No pueden combinarse.">
              <div className="flex gap-1 rounded-lg border p-0.5 w-fit">
                {HEADER_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setHeaderMode(m.value)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      headerMode === m.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {headerMode === "text" && (
                <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Encabezado" disabled={submitting} />
              )}

              {headerMode === "image" && (
                <>
                  <ImageUpload
                    value={headerImageUrl}
                    onChange={setHeaderImageUrl}
                    uploadFn={whatsappService.uploadTemplateImage}
                    accept="image/jpeg,image/png"
                    allowedMimeTypes={["image/jpeg", "image/png"]}
                  />
                  <p className="text-xs text-muted-foreground">Meta solo admite JPG o PNG para la imagen del header.</p>
                </>
              )}
            </Section>

            <Section title="Contenido" description="Las variables no pueden ir al inicio ni al final del mensaje.">
              <div className="space-y-1.5">
                <Label>Cuerpo *</Label>
                <Textarea
                  ref={bodyRef}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Ej: Hola {{1}}, tu cotización {{2}} está lista."
                  rows={5}
                  disabled={submitting}
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_OPTIONS.map(({ label }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={submitting}
                      onClick={() => insertVariable(label)}
                      className="text-xs px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      + {label}
                    </button>
                  ))}
                </div>

                {bodyText && Object.keys(varMap).length > 0 && (
                  <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Vista previa</p>
                    <p className="text-sm whitespace-pre-line">{bodyPreview}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Object.entries(varMap).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([n, label]) => (
                        <Badge key={n} variant="secondary" className="text-xs">
                          {`{{${n}}}`} = {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Pie de página (opcional)</Label>
                <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Texto de pie" disabled={submitting} />
              </div>
            </Section>

            <Section
              title="Botones de acción"
              description={`Hasta ${MAX_BUTTONS} botones que abren un link. Meta acepta una variable dinámica al final de la URL.`}
              actions={
                <Button type="button" variant="outline" size="sm" onClick={addButton} disabled={buttons.length >= MAX_BUTTONS || submitting}>
                  <PlusIcon className="size-4" />
                  Agregar botón
                </Button>
              }
            >
              {buttons.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin botones — el template se envía solo con el mensaje.</p>
              ) : (
                <div className="space-y-3">
                  {buttons.map((b) => (
                    <div key={b.key} className="flex items-start gap-2 rounded-lg border p-3">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nombre del botón</Label>
                          <Input
                            placeholder="Agendar Reunión"
                            value={b.text}
                            onChange={(e) => updateButton(b.key, "text", e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">URL</Label>
                          <Input
                            placeholder="https://..."
                            value={b.url}
                            onChange={(e) => updateButton(b.key, "url", e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="mt-5 text-destructive hover:text-destructive"
                        onClick={() => removeButton(b.key)}
                        disabled={submitting}
                        aria-label="Quitar botón"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-md">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Así se verá el mensaje que reciben tus contactos.
            </p>
            <WhatsAppTemplatePreview
              headerMode={headerMode}
              headerText={headerText}
              headerImageUrl={headerImageUrl}
              bodyText={bodyPreview || "Escribe el cuerpo del mensaje en el paso anterior."}
              footerText={footerText}
              buttons={buttons}
            />
          </div>
        )}
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
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !canNext : !canSubmit}
            >
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "Enviando..." : "Enviar para aprobación"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
