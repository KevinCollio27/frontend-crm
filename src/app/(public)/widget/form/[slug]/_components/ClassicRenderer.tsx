"use client"

import * as React from "react"
import { isValidPhoneNumber } from "react-phone-number-input"
import { PhoneInput } from "@/components/phone-input"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  createDefaultDesign,
  DEFAULT_CONTACT_ORDER,
  DEFAULT_ORGANIZATION_ORDER,
  DEFAULT_OPPORTUNITY_ORDER,
} from "@/components/dashboard/forms/shared/form-state"
import type { ClassicBaseConfig, FormSubmitPayload, PublicCustomField } from "@/types/public-form"
import { PublicFormShell } from "@/components/public-widget/PublicFormShell"
import { FileDropZone, isUploadedFileValue, type UploadedFileValue } from "@/components/public-widget/FileDropZone"

// ─── File accept mapping (classic custom fields) ───────────────────────────────

const CLASSIC_FILE_ACCEPT_MIME: Record<string, string> = {
  pdf:    "application/pdf",
  images: "image/*",
  word:   ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  excel:  ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

function classicFileAccept(keys?: string[]): string | undefined {
  if (!keys || keys.length === 0) return undefined
  return keys.map((k) => CLASSIC_FILE_ACCEPT_MIME[k]).filter(Boolean).join(",") || undefined
}

// ─── Regex ────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE   = /^(https?:\/\/)?(www\.)?[\w-]+(\.[\w-]+)+(\/\S*)?$/

function digitsOnly(v: string): string {
  return v.replace(/[^0-9]/g, "")
}

// ─── RUT formatter ───────────────────────────────────────────────────────────

function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase()
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Values = Record<string, string | boolean | string[] | UploadedFileValue>
type Errors = Record<string, string>
type Status = "idle" | "loading" | "success" | "error"

// ─── Validation ───────────────────────────────────────────────────────────────

type OppFields = NonNullable<ClassicBaseConfig["opportunity"]>["fields"]

function validate(
  values: Values,
  contact: ClassicBaseConfig["contact"]["fields"],
  org: ClassicBaseConfig["organization"],
  opp: OppFields,
  customFields: PublicCustomField[]
): Errors {
  const e: Errors = {}

  function req(key: string, label: string) {
    if (!String(values[key] ?? "").trim()) e[key] = `${label} es requerido`
  }
  function email(key: string) {
    const v = String(values[key] ?? "").trim()
    if (v && !EMAIL_RE.test(v)) e[key] = "Correo inválido"
  }
  function url(key: string) {
    const v = String(values[key] ?? "").trim()
    if (v && !URL_RE.test(v)) e[key] = "URL inválida"
  }
  function phone(key: string) {
    const v = String(values[key] ?? "").trim()
    if (v && !isValidPhoneNumber(v)) e[key] = "Teléfono inválido"
  }

  req("contact_name", "Nombre")
  if (contact.email?.required) req("contact_email", "Correo")
  email("contact_email")
  if (contact.phone?.required)    req("contact_phone", "Teléfono")
  phone("contact_phone")
  if (contact.birthdate?.required) req("contact_birthdate", "Fecha de nacimiento")
  if (contact.internal_position?.required) req("contact_internal_position", contact.internal_position.label ?? "Cargo")
  if (contact.source?.required)    req("contact_source", contact.source.label ?? "Fuente")
  if (contact.social?.required)    req("contact_social", contact.social.label ?? "Red social")
  url("contact_social")

  if (org?.enabled) {
    if (org.fields.name?.required)     req("org_name", "Nombre de empresa")
    if (org.fields.rut?.required)      req("org_rut", "RUT")
    if (org.fields.website?.required)  req("org_website", "Sitio web")
    url("org_website")
    if (org.fields.industry?.required) req("org_industry", "Rubro")
    if (org.fields.social?.required)   req("org_social", org.fields.social.label ?? "Red social")
    url("org_social")
  }

  if (opp?.name?.required)   req("opp_name", "Nombre de consulta")
  if (opp?.notes?.required)  req("opp_notes", "Mensaje")
  if (opp?.budget?.required) req("opp_budget", "Presupuesto")

  for (const f of customFields) {
    if (f.type === "SECTION_TITLE" || f.type === "INFO") continue
    if (f.required && !String(values[`cf_${f.id}`] ?? "").trim()) {
      e[`cf_${f.id}`] = `${f.label} es requerido`
    }
    if (f.type === "URL" && values[`cf_${f.id}`]) {
      if (!URL_RE.test(String(values[`cf_${f.id}`]))) e[`cf_${f.id}`] = "URL inválida"
    }
  }

  return e
}

// ─── Payload builder ──────────────────────────────────────────────────────────

function buildPayload(
  values: Values,
  customFields: PublicCustomField[]
): FormSubmitPayload {
  const str = (k: string) => String(values[k] ?? "").trim() || null

  const custom_answers: Record<string, unknown> = {}
  for (const f of customFields) {
    const v = values[`cf_${f.id}`]
    if (v !== undefined && v !== "") custom_answers[f.id] = v
  }

  return {
    name:               String(values.contact_name ?? "").trim(),
    emails:             str("contact_email")    ? [{ value: str("contact_email")! }] : [],
    phones:             str("contact_phone")    ? [{ value: str("contact_phone")! }] : [],
    birthdate:          str("contact_birthdate"),
    internal_position:  str("contact_internal_position"),
    contact_source:     str("contact_source"),
    social_url:         str("contact_social"),
    org_name:           str("org_name"),
    org_rut:            str("org_rut"),
    org_website:        str("org_website"),
    org_industry:       str("org_industry"),
    org_social_url:     str("org_social"),
    opp_name:           str("opp_name"),
    notes:              str("opp_notes"),
    budget:             str("opp_budget") ? Number(str("opp_budget")) : null,
    custom_answers,
  }
}

// ─── Field components ─────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string
  required?: boolean
  error?: string
  htmlFor?: string
  children: React.ReactNode
}

function FieldRow({ label, required, error, htmlFor, children }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
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

// ─── Main component ───────────────────────────────────────────────────────────

interface ClassicRendererProps {
  slug:         string
  name:         string
  description?: string
  config:       ClassicBaseConfig
  customFields: PublicCustomField[]
  /** Vista previa dentro del builder — valida pero no envía nada de verdad. */
  preview?:     boolean
}

function initialValues(config: ClassicBaseConfig): Values {
  const init: Values = {}
  if (config.contact?.fields.phone?.enabled) init.contact_phone = "+56"
  return init
}

export function ClassicRenderer({ slug, name, description, config, customFields, preview = false }: ClassicRendererProps) {
  const [values,   setValues]   = React.useState<Values>(() => initialValues(config))
  const [errors,   setErrors]   = React.useState<Errors>({})
  const [status,   setStatus]   = React.useState<Status>("idle")
  const [apiError, setApiError] = React.useState("")
  const [countdown, setCountdown] = React.useState(10)

  const DESIGN = React.useMemo(() => ({ ...createDefaultDesign(), ...config.design }), [config.design])
  const radiusStyle: React.CSSProperties = { borderRadius: DESIGN.radius }

  const contact = config.contact?.fields ?? {}
  const org     = config.organization
  const opp     = config.opportunity?.fields ?? {}

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  const setRut = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: formatRut(e.target.value) }))

  const setNumeric = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: digitsOnly(e.target.value) }))

  const resetForm = React.useCallback(() => {
    setValues(initialValues(config))
    setErrors({})
    setStatus("idle")
    setApiError("")
    setCountdown(10)
  }, [config])

  React.useEffect(() => {
    if (status !== "success") return
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000)
    const reset = setTimeout(resetForm, 10_000)
    return () => { clearInterval(tick); clearTimeout(reset) }
  }, [status, resetForm])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(values, contact, org, opp, customFields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    if (preview) {
      setApiError("Esto es solo una vista previa — no se envía nada de verdad.")
      return
    }
    setApiError("")
    setStatus("loading")
    try {
      const res = await fetch(`/api/proxy/widget/form/${slug}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload(values, customFields)),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message ?? "Error al enviar")
      setStatus("success")
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo enviar el formulario.")
      setStatus("error")
    }
  }

  function renderContactField(key: string): React.ReactNode {
    switch (key) {
      case "email":
        return contact.email?.enabled && (
          <FieldRow key={key} label={contact.email.label ?? "Correo Electrónico"} required={contact.email.required} error={errors.contact_email} htmlFor="contact_email">
            <Input
              id="contact_email"
              type="email"
              placeholder={contact.email.placeholder || "correo@ejemplo.com"}
              value={String(values.contact_email ?? "")}
              onChange={set("contact_email")}
              className={cn(errors.contact_email && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "phone":
        return contact.phone?.enabled && (
          <FieldRow key={key} label={contact.phone.label ?? "Teléfono"} required={contact.phone.required} error={errors.contact_phone} htmlFor="contact_phone">
            <PhoneInput
              id="contact_phone"
              defaultCountry="CL"
              value={String(values.contact_phone ?? "")}
              onChange={(v) => setValues((prev) => ({ ...prev, contact_phone: v ?? "" }))}
              aria-invalid={!!errors.contact_phone}
            />
          </FieldRow>
        )
      case "birthdate":
        return contact.birthdate?.enabled && (
          <FieldRow key={key} label={contact.birthdate.label ?? "Fecha de Nacimiento"} required={contact.birthdate.required} error={errors.contact_birthdate} htmlFor="contact_birthdate">
            <Input
              id="contact_birthdate"
              type="date"
              value={String(values.contact_birthdate ?? "")}
              onChange={set("contact_birthdate")}
              className={cn(errors.contact_birthdate && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "internal_position":
        return contact.internal_position?.enabled && (
          <FieldRow key={key} label={contact.internal_position.label ?? "Cargo"} required={contact.internal_position.required} error={errors.contact_internal_position} htmlFor="contact_internal_position">
            <Input
              id="contact_internal_position"
              placeholder={contact.internal_position.placeholder}
              value={String(values.contact_internal_position ?? "")}
              onChange={set("contact_internal_position")}
              className={cn(errors.contact_internal_position && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "source":
        return contact.source?.enabled && contact.source.options.length > 0 && (
          <FieldRow key={key} label={contact.source.label ?? "¿Cómo nos conociste?"} required={contact.source.required} error={errors.contact_source} htmlFor="contact_source">
            <Select value={String(values.contact_source ?? "")} onValueChange={(v) => setValues((prev) => ({ ...prev, contact_source: v ?? "" }))}>
              <SelectTrigger id="contact_source" className="w-full" style={radiusStyle}>
                <SelectValue placeholder={contact.source.placeholder || "Selecciona una opción"}>{(v: string) => v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {contact.source.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        )
      case "social":
        return contact.social?.enabled && (
          <FieldRow key={key} label={contact.social.label ?? "Red social"} required={contact.social.required} error={errors.contact_social} htmlFor="contact_social">
            <Input
              id="contact_social"
              placeholder={contact.social.placeholder}
              value={String(values.contact_social ?? "")}
              onChange={set("contact_social")}
              className={cn(errors.contact_social && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      default:
        return null
    }
  }

  function renderOrgField(key: string): React.ReactNode {
    if (!org?.enabled) return null
    switch (key) {
      case "rut":
        return org.fields.rut?.enabled && (
          <FieldRow key={key} label={org.fields.rut.label ?? "RUT / Id. Fiscal"} required={org.fields.rut.required} error={errors.org_rut} htmlFor="org_rut">
            <Input
              id="org_rut"
              placeholder={org.fields.rut?.placeholder || "77.123.456-K"}
              value={String(values.org_rut ?? "")}
              onChange={setRut("org_rut")}
              className={cn(errors.org_rut && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "website":
        return org.fields.website?.enabled && (
          <FieldRow key={key} label={org.fields.website.label ?? "Sitio Web"} required={org.fields.website.required} error={errors.org_website} htmlFor="org_website">
            <Input
              id="org_website"
              placeholder={org.fields.website?.placeholder || "https://miempresa.cl"}
              value={String(values.org_website ?? "")}
              onChange={set("org_website")}
              className={cn(errors.org_website && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "industry":
        return org.fields.industry?.enabled && (
          <FieldRow key={key} label={org.fields.industry.label ?? "Rubro / Industria"} required={org.fields.industry.required} error={errors.org_industry} htmlFor="org_industry">
            <Input
              id="org_industry"
              placeholder={org.fields.industry?.placeholder || "Tecnología"}
              value={String(values.org_industry ?? "")}
              onChange={set("org_industry")}
              className={cn(errors.org_industry && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "social":
        return org.fields.social?.enabled && (
          <FieldRow key={key} label={org.fields.social.label ?? "Red social"} required={org.fields.social.required} error={errors.org_social} htmlFor="org_social">
            <Input
              id="org_social"
              placeholder={org.fields.social.placeholder}
              value={String(values.org_social ?? "")}
              onChange={set("org_social")}
              className={cn(errors.org_social && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      default:
        return null
    }
  }

  function renderOppField(key: string): React.ReactNode {
    switch (key) {
      case "name":
        return opp.name?.enabled && (
          <FieldRow key={key} label={opp.name.label ?? "Asunto"} required={opp.name.required} error={errors.opp_name} htmlFor="opp_name">
            <Input
              id="opp_name"
              placeholder={opp.name?.placeholder || "Describe brevemente tu consulta"}
              value={String(values.opp_name ?? "")}
              onChange={set("opp_name")}
              className={cn(errors.opp_name && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "notes":
        return opp.notes?.enabled && (
          <FieldRow key={key} label={opp.notes.label ?? "Mensaje"} required={opp.notes.required} error={errors.opp_notes} htmlFor="opp_notes">
            <Textarea
              id="opp_notes"
              rows={4}
              placeholder={opp.notes?.placeholder || "Cuéntanos más detalles..."}
              value={String(values.opp_notes ?? "")}
              onChange={set("opp_notes")}
              className={cn("resize-y", errors.opp_notes && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      case "budget":
        return opp.budget?.enabled && (
          <FieldRow key={key} label={opp.budget.label ?? "Presupuesto"} required={opp.budget.required} error={errors.opp_budget} htmlFor="opp_budget">
            <Input
              id="opp_budget"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={String(values.opp_budget ?? "")}
              onChange={setNumeric("opp_budget")}
              className={cn(errors.opp_budget && "border-destructive")}
              style={radiusStyle}
            />
          </FieldRow>
        )
      default:
        return null
    }
  }

  const contactOrder = config.contact?.order?.length ? config.contact.order : DEFAULT_CONTACT_ORDER
  const orgOrder      = org?.order?.length ? org.order : DEFAULT_ORGANIZATION_ORDER
  const oppOrder       = config.opportunity?.order?.length ? config.opportunity.order : DEFAULT_OPPORTUNITY_ORDER

  return (
    <PublicFormShell
      design={DESIGN}
      title={DESIGN.coverTitle || name}
      subtitle={DESIGN.coverSubtitle || description || "Completa el formulario y nos pondremos en contacto contigo."}
      status={status}
      countdown={countdown}
      errorMessage={apiError}
      onReset={resetForm}
      onSubmit={handleSubmit}
      embedded={preview}
    >
      {/* Contact */}
      <FieldRow label={contact.name?.label ?? "Nombre Completo"} required error={errors.contact_name} htmlFor="contact_name">
        <Input
          id="contact_name"
          placeholder={contact.name?.placeholder || "Ingresa tu nombre completo"}
          value={String(values.contact_name ?? "")}
          onChange={set("contact_name")}
          className={cn(errors.contact_name && "border-destructive")}
          style={radiusStyle}
        />
      </FieldRow>

      {contactOrder.map(renderContactField)}

      {/* Organization */}
      {org?.enabled && (
        <>
          <SectionDivider label="Datos de empresa" />
          {org.fields.name?.enabled && (
            <FieldRow label={org.fields.name.label ?? "Nombre de Empresa"} required={org.fields.name.required} error={errors.org_name} htmlFor="org_name">
              <Input
                id="org_name"
                placeholder={org.fields.name?.placeholder || "Mi Empresa SpA"}
                value={String(values.org_name ?? "")}
                onChange={set("org_name")}
                className={cn(errors.org_name && "border-destructive")}
                style={radiusStyle}
              />
            </FieldRow>
          )}
          {orgOrder.map(renderOrgField)}
        </>
      )}

      {/* Opportunity */}
      {(opp.name?.enabled || opp.notes?.enabled || opp.budget?.enabled) && (
        <>
          <SectionDivider label="Tu consulta" />
          {oppOrder.map(renderOppField)}
        </>
      )}

      {/* Custom fields */}
      {customFields.length > 0 && (
        <>
          {customFields[0]?.type !== "SECTION_TITLE" && <SectionDivider label="Información adicional" />}
          {customFields.map((f) =>
            f.type === "SECTION_TITLE" ? (
              <SectionDivider key={f.id} label={f.label || "Sección"} />
            ) : f.type === "INFO" ? (
              <p key={f.id} className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">{f.label}</p>
            ) : (
              <CustomFieldInput key={f.id} field={f} slug={slug} value={values[`cf_${f.id}`]} error={errors[`cf_${f.id}`]} radius={DESIGN.radius}
                onChange={(v) => setValues((prev) => ({ ...prev, [`cf_${f.id}`]: v }))}
              />
            )
          )}
        </>
      )}
    </PublicFormShell>
  )
}

// ─── Custom field input ───────────────────────────────────────────────────────

interface CustomFieldInputProps {
  field:    PublicCustomField
  slug:     string
  value:    string | boolean | string[] | UploadedFileValue | undefined
  error?:   string
  radius:   number
  onChange: (v: string | boolean | string[] | UploadedFileValue) => void
}

function CustomFieldInput({ field, slug, value, error, radius, onChange }: CustomFieldInputProps) {
  const strVal = String(value ?? "")
  const radiusStyle: React.CSSProperties = { borderRadius: radius }
  const htmlFor = `cf_${field.id}`

  if (field.type === "BOOLEAN") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <Checkbox
            id={htmlFor}
            checked={!!value}
            onCheckedChange={(v) => onChange(v === true)}
            className={cn("mt-0.5 shrink-0", error && "border-destructive")}
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            {field.placeholder || field.label}
          </span>
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <FieldRow label={field.label} required={field.required} error={error} htmlFor={htmlFor}>
      {field.type === "TEXTAREA" ? (
        <Textarea
          id={htmlFor}
          rows={3}
          placeholder={field.placeholder}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={cn("resize-y", error && "border-destructive")}
          style={radiusStyle}
        />
      ) : field.type === "SELECT" && field.options.length > 0 ? (
        field.multiple ? (
          <div className="flex flex-col gap-2">
            {field.options.map((opt) => {
              const selected = Array.isArray(value) ? (value as string[]).includes(opt) : false
              return (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(v) => {
                      const arr = Array.isArray(value) ? [...(value as string[])] : []
                      onChange(v ? [...arr, opt] : arr.filter((x) => x !== opt))
                    }}
                  />
                  {opt}
                </label>
              )
            })}
          </div>
        ) : (
          <Select value={strVal} onValueChange={(v) => onChange(v ?? "")}>
            <SelectTrigger id={htmlFor} className="w-full" style={radiusStyle}>
              <SelectValue placeholder="Selecciona una opción">{(v: string) => v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      ) : field.type === "DATE" ? (
        <Input id={htmlFor} type="date" value={strVal} onChange={(e) => onChange(e.target.value)} style={radiusStyle} />
      ) : field.type === "NUMBER" ? (
        <Input id={htmlFor} type="text" inputMode="numeric" placeholder={field.placeholder} value={strVal} onChange={(e) => onChange(digitsOnly(e.target.value))} style={radiusStyle} />
      ) : field.type === "ADDRESS" ? (
        <AddressAutocomplete value={strVal} onChange={onChange} placeholder={field.placeholder} />
      ) : field.type === "FILE" ? (
        <FileDropZone
          id={htmlFor}
          slug={slug}
          value={isUploadedFileValue(value) ? value : null}
          accept={classicFileAccept(field.accept)}
          error={!!error}
          radiusStyle={radiusStyle}
          onChange={(v) => onChange(v ?? "")}
        />
      ) : (
        <Input
          id={htmlFor}
          type={field.type === "URL" ? "url" : "text"}
          placeholder={field.placeholder}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          style={radiusStyle}
        />
      )}
    </FieldRow>
  )
}
