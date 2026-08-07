"use client"

import * as React from "react"
import { isValidPhoneNumber } from "react-phone-number-input"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { PhoneInput } from "@/components/phone-input"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createDefaultDesign } from "@/components/dashboard/forms/shared/form-state"
import { PublicFormShell } from "@/components/public-widget/PublicFormShell"
import { findSimpleLabel, publicWidgetService } from "@/services/publicWidget.service"
import type { WidgetFlow } from "@/types/public-widget"

// ─── Regex ────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Field helpers (mismo patrón que ClassicRenderer) ─────────────────────────

function FieldRow({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-border" />
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
        {label}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Values = {
  name: string
  email: string
  phone: string
  organization: string
  rut: string
  website: string
  industry: string
  notes: string
}

type Errors = Partial<Record<keyof Values, string>>
type Status = "idle" | "loading" | "success" | "error"

const EMPTY_VALUES: Values = {
  name: "",
  email: "",
  phone: "+56",
  organization: "",
  rut: "",
  website: "",
  industry: "",
  notes: "",
}

const DESIGN = createDefaultDesign()

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ContactWidgetForm({ token, flowId }: { token: string; flowId: number }) {
  const [values, setValues] = React.useState<Values>(EMPTY_VALUES)
  const [errors, setErrors] = React.useState<Errors>({})
  const [status, setStatus] = React.useState<Status>("idle")
  const [apiError, setApiError] = React.useState("")
  const [countdown, setCountdown] = React.useState(10)
  const [showAdditionalInfo, setShowAdditionalInfo] = React.useState(false)
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null)
  const turnstileRef = React.useRef<TurnstileInstance>(null)

  const [flows, setFlows] = React.useState<WidgetFlow[]>([])
  const [emailLabelId, setEmailLabelId] = React.useState<number | null>(null)
  const [emailOption, setEmailOption] = React.useState("")
  const [phoneLabelId, setPhoneLabelId] = React.useState<number | null>(null)
  const [phoneOption, setPhoneOption] = React.useState("")
  const [loadError, setLoadError] = React.useState(false)

  React.useEffect(() => {
    Promise.all([publicWidgetService.getFlows(token), publicWidgetService.getPersonLabels(token)])
      .then(([widgetFlows, labels]) => {
        setFlows(widgetFlows)
        const email = findSimpleLabel(labels, "email")
        const phone = findSimpleLabel(labels, "phone")
        if (email) { setEmailLabelId(email.labelId); setEmailOption(email.defaultOption) }
        if (phone) { setPhoneLabelId(phone.labelId); setPhoneOption(phone.defaultOption) }
      })
      .catch(() => setLoadError(true))
  }, [token])

  const resetForm = React.useCallback(() => {
    setValues(EMPTY_VALUES)
    setErrors({})
    setStatus("idle")
    setApiError("")
    setCountdown(10)
    setShowAdditionalInfo(false)
    setTurnstileToken(null)
    turnstileRef.current?.reset()
  }, [])

  React.useEffect(() => {
    if (status !== "success") return
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000)
    const reset = setTimeout(resetForm, 10_000)
    return () => { clearInterval(tick); clearTimeout(reset) }
  }, [status, resetForm])

  function set(key: keyof Values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  function validate(): Errors {
    const e: Errors = {}
    if (!values.name.trim()) e.name = "El nombre es obligatorio"
    if (!values.email.trim()) e.email = "El correo es obligatorio"
    else if (!EMAIL_RE.test(values.email.trim())) e.email = "Correo inválido"
    if (!values.phone.trim() || !isValidPhoneNumber(values.phone)) e.phone = "Teléfono inválido"
    if (!values.organization.trim()) e.organization = "El nombre de la empresa es obligatorio"
    if (!values.rut.trim()) e.rut = "El RUT/ID Fiscal es obligatorio"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setApiError("Completa la verificación de seguridad antes de enviar.")
      setStatus("error")
      return
    }
    setErrors({})
    setApiError("")
    setStatus("loading")

    try {
      const flow = flows.find((f) => f.id === flowId)
      if (!flow) throw new Error("El embudo de este formulario ya no existe.")
      const stage = [...flow.flow_stage].sort((a, b) => a.order_number - b.order_number)[0]
      if (!stage) throw new Error("El embudo de este formulario no tiene etapas configuradas.")

      const organization = await publicWidgetService.createOrganization(token, {
        name: values.organization.trim(),
        document_number: values.rut.trim(),
        web_page: values.website.trim() || null,
        industry: values.industry.trim() || null,
        turnstileToken: turnstileToken ?? undefined,
      })

      const person = await publicWidgetService.createPerson(token, {
        name: values.name.trim(),
        organization_id: organization.id,
        email: emailLabelId
          ? [{ id: null, label_id: emailLabelId, option: emailOption, value: values.email.trim() }]
          : [],
        phone: phoneLabelId
          ? [{ id: null, label_id: phoneLabelId, option: phoneOption, value: values.phone.trim() }]
          : [],
      })

      await publicWidgetService.createOpportunity(token, {
        flow_id: flow.id,
        flow_stage_id: stage.id,
        person_id: person.id,
        organization_id: organization.id,
        name: `${values.name.trim()} - ${values.organization.trim()}`,
        notes: values.notes.trim() || undefined,
      })

      setStatus("success")
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo enviar el formulario.")
      setStatus("error")
    }
  }

  if (loadError) {
    return (
      <PublicFormShell design={DESIGN} title="Formulario no disponible" status="error" countdown={0} onReset={() => {}} onSubmit={(e) => e.preventDefault()}>
        <p className="text-sm text-muted-foreground">
          No pudimos cargar este formulario. Verifica el enlace o contacta a quien te lo compartió.
        </p>
      </PublicFormShell>
    )
  }

  return (
    <PublicFormShell
      design={DESIGN}
      title="Completar Formulario"
      subtitle="Completa el formulario y nos pondremos en contacto contigo."
      status={status}
      countdown={countdown}
      errorMessage={apiError}
      onReset={resetForm}
      onSubmit={handleSubmit}
    >
      <FieldRow label="Nombre Completo" required error={errors.name} htmlFor="name">
        <Input
          id="name"
          placeholder="Ej: Juan Pérez"
          autoComplete="off"
          value={values.name}
          onChange={set("name")}
          className={cn(errors.name && "border-destructive")}
        />
      </FieldRow>

      <FieldRow label="Correo Electrónico" required error={errors.email} htmlFor="email">
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          autoComplete="off"
          value={values.email}
          onChange={set("email")}
          className={cn(errors.email && "border-destructive")}
        />
      </FieldRow>

      <FieldRow label="Teléfono" required error={errors.phone} htmlFor="phone">
        <PhoneInput
          id="phone"
          defaultCountry="CL"
          value={values.phone}
          onChange={(v) => setValues((prev) => ({ ...prev, phone: v ?? "" }))}
          aria-invalid={!!errors.phone}
        />
      </FieldRow>

      <SectionDivider label="Datos de empresa" />

      <FieldRow label="Nombre Empresa" required error={errors.organization} htmlFor="organization">
        <Input
          id="organization"
          placeholder="Ej: Transportes S.A."
          autoComplete="off"
          value={values.organization}
          onChange={set("organization")}
          className={cn(errors.organization && "border-destructive")}
        />
      </FieldRow>

      <FieldRow label="RUT / ID Fiscal" required error={errors.rut} htmlFor="rut">
        <Input
          id="rut"
          placeholder="Ej: 76.123.456-K, 3-101-123456..."
          autoComplete="off"
          value={values.rut}
          onChange={set("rut")}
          className={cn(errors.rut && "border-destructive")}
        />
      </FieldRow>

      <div className="flex items-center gap-3">
        <Switch id="additional-info" checked={showAdditionalInfo} onCheckedChange={setShowAdditionalInfo} />
        <Label htmlFor="additional-info" className="cursor-pointer font-normal text-muted-foreground">
          Añadir información adicional
        </Label>
      </div>

      {showAdditionalInfo && (
        <>
          <FieldRow label="Sitio Web (Opcional)" htmlFor="website">
            <Input
              id="website"
              placeholder="Ej: www.tuempresa.com"
              autoComplete="off"
              value={values.website}
              onChange={set("website")}
            />
          </FieldRow>

          <FieldRow label="Rubro (Opcional)" htmlFor="industry">
            <Input
              id="industry"
              placeholder="Ej: Logística, Minería, Retail"
              autoComplete="off"
              value={values.industry}
              onChange={set("industry")}
            />
          </FieldRow>

          <FieldRow label="Mensaje (Opcional)" htmlFor="notes">
            <Textarea
              id="notes"
              placeholder="Describe brevemente tu solicitud o requerimiento..."
              rows={4}
              value={values.notes}
              onChange={set("notes")}
            />
          </FieldRow>
        </>
      )}

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            options={{ theme: "light", language: "es" }}
          />
        </div>
      )}
    </PublicFormShell>
  )
}
