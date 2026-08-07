"use client"

import * as React from "react"
import { CheckCircle2Icon, InfoIcon, TriangleAlertIcon, UploadCloudIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { isValidPhoneNumber } from "react-phone-number-input"
import { PhoneInput } from "@/components/phone-input"
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
import type { BlocksBaseConfig, FormSubmitPayload } from "@/types/public-form"
import type { FileAccept, FormBlock } from "@/components/dashboard/forms/shared/blocks"
import { PublicFormShell } from "@/components/public-widget/PublicFormShell"

// ─── Value helpers ────────────────────────────────────────────────────────────

type Values = Record<string, string | string[]>

function valueKey(block: FormBlock): string {
  if (block.type === "base_field") return `${block.data.entity}.${block.data.key}`
  if (block.type === "field") return `field_${block.id}`
  return ""
}

function otherValueKey(key: string): string {
  return `${key}__other`
}

function isPhoneBlock(block: FormBlock): boolean {
  return (block.type === "base_field" && block.data.key === "phones")
    || (block.type === "field" && block.data.fieldType === "phone")
}

function initialValues(blocks: FormBlock[]): Values {
  const init: Values = {}
  for (const block of blocks) {
    if (isPhoneBlock(block)) init[valueKey(block)] = "+56"
  }
  return init
}

function resolveOtherValue(val: string | string[], values: Values, key: string): string | string[] {
  const otherVal = String(values[otherValueKey(key)] ?? "").trim()
  if (!otherVal) return val
  return Array.isArray(val) ? val.map((v) => (v === "Otro" ? otherVal : v)) : val === "Otro" ? otherVal : val
}

// ─── Payload builder ──────────────────────────────────────────────────────────

function buildPayload(blocks: FormBlock[], values: Values): FormSubmitPayload {
  const custom_answers: Record<string, unknown> = {}
  const payload: FormSubmitPayload = { name: "", emails: [], phones: [], custom_answers }

  for (const block of blocks) {
    const key = valueKey(block)
    if (!key) continue
    const raw = values[key] ?? ""
    const val = block.type === "field" && block.data.allowOther ? resolveOtherValue(raw, values, key) : raw
    const str = Array.isArray(val) ? val.join(", ") : val

    if (block.type === "base_field") {
      const { entity, key: fk } = block.data
      if (entity === "contacto") {
        if (fk === "name") payload.name = str
        else if (fk === "emails") payload.emails = str ? [{ value: str }] : []
        else if (fk === "phones") payload.phones = str ? [{ value: str }] : []
        else if (fk === "source") payload.contact_source = str || null
        else if (fk === "birthDate") payload.birthdate = str || null
        else custom_answers[`${entity}_${fk}`] = val
      } else if (entity === "organizacion") {
        if (fk === "name") payload.org_name = str || null
        else if (fk === "taxId") payload.org_rut = str || null
        else if (fk === "website") payload.org_website = str || null
        else if (fk === "industry") payload.org_industry = str || null
        else custom_answers[`${entity}_${fk}`] = val
      } else if (entity === "oportunidad") {
        if (fk === "name") payload.opp_name = str || null
        else if (fk === "description") payload.notes = str || null
        else if (fk === "amount") payload.budget = str ? Number(str) : null
        else custom_answers[`${entity}_${fk}`] = val
      }
    } else if (block.type === "field") {
      custom_answers[block.id] = val
    }
  }

  return payload
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(blocks: FormBlock[], values: Values): Record<string, string> {
  const errs: Record<string, string> = {}
  for (const block of blocks) {
    if (block.type !== "base_field" && block.type !== "field") continue
    const key = valueKey(block)
    const val = values[key]

    if (block.data.required) {
      const isEmpty = Array.isArray(val)
        ? val.length === 0 || val.every((v) => !v.trim())
        : !val?.toString().trim()
      if (isEmpty) errs[key] = "Este campo es obligatorio"
    }

    if (isPhoneBlock(block) && !errs[key] && typeof val === "string" && val.trim() && !isValidPhoneNumber(val)) {
      errs[key] = "Teléfono inválido"
    }

    if (block.type === "field" && block.data.allowOther) {
      const chosenOther = Array.isArray(val) ? val.includes("Otro") : val === "Otro"
      if (chosenOther && !String(values[otherValueKey(key)] ?? "").trim()) {
        errs[otherValueKey(key)] = 'Especifica el valor de "Otro"'
      }
    }
  }
  return errs
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  required,
  helper,
  error,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  helper?: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {helper && !error && <p className="text-xs text-muted-foreground">{helper}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── Input type map ───────────────────────────────────────────────────────────

type HtmlInputType = "text" | "email" | "tel" | "url" | "date" | "number"

function baseFieldHtmlType(key: string): HtmlInputType {
  if (key === "emails") return "email"
  if (key === "phones") return "tel"
  if (key === "website") return "url"
  if (key === "birthDate" || key === "closeDate") return "date"
  if (key === "amount") return "number"
  return "text"
}

function dynFieldHtmlType(fieldType: string): HtmlInputType {
  if (fieldType === "email") return "email"
  if (fieldType === "phone") return "tel"
  if (fieldType === "url") return "url"
  if (fieldType === "date") return "date"
  if (fieldType === "number") return "number"
  return "text"
}

function digitsOnly(v: string): string {
  return v.replace(/[^0-9]/g, "")
}

// ─── "Otro" specify input ───────────────────────────────────────────────────────

function OtherInput({
  value,
  error,
  radiusStyle,
  onChange,
}: {
  value: string
  error?: string
  radiusStyle: React.CSSProperties
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        placeholder='Especifica el valor de "Otro"'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(error && "border-destructive")}
        style={radiusStyle}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── File drop zone ───────────────────────────────────────────────────────────

const FILE_ACCEPT_MIME: Record<FileAccept, string | undefined> = {
  image: "image/*",
  document: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
  video: "video/*",
  any: undefined,
}

function FileDropZone({
  id,
  fileName,
  accept,
  error,
  radiusStyle,
  onChange,
}: {
  id: string
  fileName: string
  accept?: string
  error?: boolean
  radiusStyle: React.CSSProperties
  onChange: (f: File | null) => void
}) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) onChange(f)
      }}
      style={radiusStyle}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-2 border-dashed p-3 transition-colors select-none",
        dragging ? "border-ring bg-muted/50"
        : fileName ? "border-ring/40 bg-muted/20"
        : "border-input hover:border-muted-foreground/40 hover:bg-muted/20",
        error && "border-destructive"
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <UploadCloudIcon className="size-4.5 text-muted-foreground/60" />
      </div>
      <div className="min-w-0 flex-1">
        {fileName ? (
          <p className="truncate text-sm font-medium">{fileName} · haz clic para cambiar</p>
        ) : (
          <>
            <p className="text-sm font-medium">Arrastra un archivo o haz clic</p>
            <p className="text-xs text-muted-foreground">o suéltalo aquí</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          onChange(f ?? null)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// ─── Block input ──────────────────────────────────────────────────────────────

function BlockInput({
  block,
  value,
  onChange,
  error,
  radius,
  accent,
  otherValue,
  otherError,
  onOtherChange,
}: {
  block: FormBlock
  value: string | string[]
  onChange: (v: string | string[]) => void
  error?: string
  radius: number
  accent: string
  otherValue: string
  otherError?: string
  onOtherChange: (v: string) => void
}) {
  const radiusStyle: React.CSSProperties = { borderRadius: radius }

  if (block.type === "base_field") {
    const { key, label, placeholder, required } = block.data

    if (key === "phones") {
      return (
        <FieldWrapper label={label} required={required} error={error} htmlFor={block.id}>
          <PhoneInput
            id={block.id}
            defaultCountry="CL"
            value={(value as string) ?? ""}
            onChange={(v) => onChange(v ?? "")}
            aria-invalid={!!error}
          />
        </FieldWrapper>
      )
    }

    const htmlType = baseFieldHtmlType(key)
    const isNumeric = htmlType === "number"
    return (
      <FieldWrapper label={label} required={required} error={error} htmlFor={block.id}>
        <Input
          id={block.id}
          type={isNumeric ? "text" : htmlType}
          inputMode={isNumeric ? "numeric" : undefined}
          placeholder={placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(isNumeric ? digitsOnly(e.target.value) : e.target.value)}
          className={cn(error && "border-destructive")}
          style={radiusStyle}
        />
      </FieldWrapper>
    )
  }

  if (block.type === "field") {
    const { fieldType, label, placeholder, helper, required, options, allowOther } = block.data
    const str = (value as string) ?? ""
    const arr = Array.isArray(value) ? value : []
    const opts = allowOther && !options.includes("Otro") ? [...options, "Otro"] : options

    if (fieldType === "checkbox") {
      const checked = str === "true"
      return (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <Checkbox
              id={block.id}
              checked={checked}
              onCheckedChange={(v) => onChange(v === true ? "true" : "false")}
              className={cn("mt-0.5 shrink-0", error && "border-destructive")}
              style={checked ? { backgroundColor: accent, borderColor: accent } : undefined}
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </span>
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )
    }

    if (fieldType === "longText") {
      return (
        <FieldWrapper label={label} required={required} helper={helper} error={error} htmlFor={block.id}>
          <Textarea
            id={block.id}
            rows={4}
            placeholder={placeholder}
            value={str}
            onChange={(e) => onChange(e.target.value)}
            className={cn("resize-y", error && "border-destructive")}
            style={radiusStyle}
          />
        </FieldWrapper>
      )
    }

    if (fieldType === "select") {
      const showOther = allowOther && str === "Otro"
      return (
        <FieldWrapper label={label} required={required} helper={helper} error={error}>
          <Select value={str} onValueChange={(v) => onChange(v ?? "")}>
            <SelectTrigger className="w-full" style={radiusStyle}>
              <SelectValue placeholder={placeholder || "Selecciona una opción"}>
                {(v: string) => v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {opts.map((o, i) => (
                <SelectItem key={i} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showOther && (
            <OtherInput value={otherValue} error={otherError} radiusStyle={radiusStyle} onChange={onOtherChange} />
          )}
        </FieldWrapper>
      )
    }

    if (fieldType === "radio") {
      const showOther = allowOther && str === "Otro"
      return (
        <FieldWrapper label={label} required={required} helper={helper} error={error}>
          <div className="flex flex-col gap-2">
            {opts.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={block.id}
                  value={o}
                  checked={str === o}
                  onChange={() => onChange(o)}
                  style={{ accentColor: accent }}
                />
                {o}
              </label>
            ))}
          </div>
          {showOther && (
            <OtherInput value={otherValue} error={otherError} radiusStyle={radiusStyle} onChange={onOtherChange} />
          )}
        </FieldWrapper>
      )
    }

    if (fieldType === "multiselect") {
      const showOther = allowOther && arr.includes("Otro")
      return (
        <FieldWrapper label={label} required={required} helper={helper} error={error}>
          <div className="flex flex-col gap-2">
            {opts.map((o, i) => {
              const checked = arr.includes(o)
              return (
                <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => onChange(v ? [...arr, o] : arr.filter((x) => x !== o))}
                    style={checked ? { backgroundColor: accent, borderColor: accent } : undefined}
                  />
                  {o}
                </label>
              )
            })}
          </div>
          {showOther && (
            <OtherInput value={otherValue} error={otherError} radiusStyle={radiusStyle} onChange={onOtherChange} />
          )}
        </FieldWrapper>
      )
    }

    if (fieldType === "file") {
      return (
        <FieldWrapper label={label} required={required} helper={helper} error={error} htmlFor={block.id}>
          <FileDropZone
            id={block.id}
            fileName={str}
            accept={FILE_ACCEPT_MIME[block.data.accept]}
            error={!!error}
            radiusStyle={radiusStyle}
            onChange={(f) => onChange(f?.name ?? "")}
          />
        </FieldWrapper>
      )
    }

    if (fieldType === "phone") {
      return (
        <FieldWrapper label={label} required={required} helper={helper} error={error} htmlFor={block.id}>
          <PhoneInput
            id={block.id}
            defaultCountry="CL"
            value={str}
            onChange={(v) => onChange(v ?? "")}
            aria-invalid={!!error}
          />
        </FieldWrapper>
      )
    }

    const htmlType = dynFieldHtmlType(fieldType)
    const isNumeric = htmlType === "number"
    return (
      <FieldWrapper label={label} required={required} helper={helper} error={error} htmlFor={block.id}>
        <Input
          id={block.id}
          type={isNumeric ? "text" : htmlType}
          inputMode={isNumeric ? "numeric" : undefined}
          placeholder={placeholder}
          value={str}
          onChange={(e) => onChange(isNumeric ? digitsOnly(e.target.value) : e.target.value)}
          className={cn(error && "border-destructive")}
          style={radiusStyle}
        />
      </FieldWrapper>
    )
  }

  return null
}

// ─── Layout block ─────────────────────────────────────────────────────────────

const NOTICE_STYLES: Record<string, { cls: string; icon: React.ReactNode }> = {
  info: {
    cls: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
    icon: <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-blue-500" />,
  },
  warning: {
    cls: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
    icon: <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />,
  },
  success: {
    cls: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900",
    icon: <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-green-500" />,
  },
  neutral: {
    cls: "bg-muted border-border",
    icon: <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />,
  },
}

function LayoutBlock({ block, radius }: { block: FormBlock; radius: number }) {
  const radiusStyle: React.CSSProperties = { borderRadius: radius }

  switch (block.type) {
    case "heading": {
      const sizeCls: Record<1 | 2 | 3, string> = { 1: "text-xl", 2: "text-lg", 3: "text-base" }
      return <p className={cn("font-semibold", sizeCls[block.data.level])}>{block.data.text}</p>
    }
    case "paragraph":
      return <p className="text-sm leading-relaxed text-muted-foreground">{block.data.text}</p>
    case "image":
      return block.data.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.data.src} alt={block.data.alt} className="w-full" style={radiusStyle} />
      ) : null
    case "divider":
      return <hr className="border-border" />
    case "spacer":
      return <div style={{ height: block.data.height }} />
    case "sectionTitle":
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1" style={{ backgroundColor: block.data.color }} />
          <span
            className="shrink-0 text-xs font-semibold tracking-wider uppercase"
            style={{ color: block.data.color }}
          >
            {block.data.text}
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: block.data.color }} />
        </div>
      )
    case "notice": {
      const cfg = NOTICE_STYLES[block.data.variant] ?? NOTICE_STYLES.neutral
      return (
        <div className={cn("flex gap-2.5 border px-3.5 py-2.5", cfg.cls)} style={radiusStyle}>
          {cfg.icon}
          <div className="flex flex-col gap-0.5">
            {block.data.title && <p className="text-sm font-semibold">{block.data.title}</p>}
            {block.data.text && <p className="text-sm text-muted-foreground">{block.data.text}</p>}
          </div>
        </div>
      )
    }
    default:
      return null
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface BlocksRendererProps {
  slug: string
  name: string
  config: BlocksBaseConfig
}

type Status = "idle" | "loading" | "success" | "error"

export function BlocksRenderer({ slug, name, config }: BlocksRendererProps) {
  const { blocks, design: d } = config
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const accent = mounted && resolvedTheme === "dark" ? "#ffffff" : d.primary

  const [values, setValues] = React.useState<Values>(() => initialValues(blocks))
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<Status>("idle")
  const [countdown, setCountdown] = React.useState(10)

  const resetForm = React.useCallback(() => {
    setValues(initialValues(blocks))
    setErrors({})
    setStatus("idle")
    setCountdown(10)
  }, [blocks])

  React.useEffect(() => {
    if (status !== "success") return
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000)
    const reset = setTimeout(resetForm, 10_000)
    return () => { clearInterval(tick); clearTimeout(reset) }
  }, [status, resetForm])

  function setValue(key: string, val: string | string[]) {
    setValues((p) => ({ ...p, [key]: val }))
    setErrors((p) => { const n = { ...p }; delete n[key]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(blocks, values)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStatus("loading")
    try {
      const res = await fetch(`/api/proxy/widget/form/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(blocks, values)),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <PublicFormShell
      design={d}
      title={d.coverTitle || name}
      subtitle={d.coverSubtitle}
      status={status}
      countdown={countdown}
      onReset={resetForm}
      onSubmit={handleSubmit}
    >
      {blocks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Este formulario no tiene campos configurados.
        </p>
      ) : (
        blocks.map((block) => {
          if (block.type === "base_field" || block.type === "field") {
            const k = valueKey(block)
            return (
              <BlockInput
                key={block.id}
                block={block}
                value={values[k] ?? ""}
                onChange={(v) => setValue(k, v)}
                error={errors[k]}
                radius={d.radius}
                accent={accent}
                otherValue={(values[otherValueKey(k)] as string) ?? ""}
                otherError={errors[otherValueKey(k)]}
                onOtherChange={(v) => setValue(otherValueKey(k), v)}
              />
            )
          }
          return <LayoutBlock key={block.id} block={block} radius={d.radius} />
        })
      )}
    </PublicFormShell>
  )
}
