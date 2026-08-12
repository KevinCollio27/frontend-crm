"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  CircleDashedIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  MailIcon,
  MoreHorizontalIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react"
import { FaLinkedin } from "react-icons/fa"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/table-utils"
import { formService } from "@/services/form.service"
import { notify } from "@/lib/notify"
import type { FormAnswerRaw } from "@/types/form"
import type { PublicCustomField } from "@/types/public-form"

// ─── Toggle (mismo look que el resto del CRM, sin depender de @base-ui acá) ───

function VisibleToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  )
}

// ─── Helpers de datos ───────────────────────────────────────────────────────

function answerDisplayName(answer: FormAnswerRaw): string {
  if (answer.person?.name) return answer.person.name
  return `Nueva Respuesta: ${answer.form?.name ?? "Formulario"}`
}

// Forma que arma uploadFile al subir un adjunto en el formulario — se guarda tal
// cual en answers[field.id], por eso antes salía "[object Object]" al hacer
// String(raw) sobre esto sin darse cuenta de que era un archivo, no texto.
interface UploadedFile {
  file_path: string
  file_name: string
  original_name: string
}

function isUploadedFile(raw: unknown): raw is UploadedFile {
  return typeof raw === "object" && raw !== null && "file_path" in raw && "file_name" in raw
}

function FileFieldValue({ file }: { file: UploadedFile }) {
  const [opening, setOpening] = React.useState(false)
  const isPdf = /\.pdf$/i.test(file.original_name || file.file_name)

  function handleOpen() {
    if (opening) return
    setOpening(true)
    formService.getFileUrl(file.file_path, file.file_name)
      .then((url) => window.open(url, "_blank"))
      .catch(() => notify.error({ title: "No se pudo abrir el archivo", description: "Intenta de nuevo." }))
      .finally(() => setOpening(false))
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={opening}
      className="flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 disabled:opacity-60"
    >
      <FileTextIcon className={cn("size-4 shrink-0", isPdf ? "text-red-500" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1 truncate">{file.original_name || file.file_name}</span>
      {opening ? <Loader2Icon className="size-3.5 shrink-0 animate-spin" /> : <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />}
    </button>
  )
}

// ─── Renderers compartidos ────────────────────────────────────────────────────
// Mismo look tanto si el dato viene de un campo custom del formulario (tipado
// EMAIL/PHONE/URL) como si viene de los campos fijos de contacto/empresa
// (person.email, person.phone, organization.web_page) — antes estaban
// separados y por eso correo/teléfono de "Datos de contacto" quedaban como
// texto plano mientras que los custom sí tenían color.

// Varios formularios guardan el link sin protocolo (ej. "www.linkedin.com/...")
// — sin esto, el navegador lo trata como ruta relativa de la página actual en
// vez de una URL externa.
function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// Como ya sabemos que un valor es un correo/teléfono (por su tipo), tiene sentido
// dejar copiarlo de una sin tener que seleccionar el texto a mano.
function CopyIconButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar"
      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
    </button>
  )
}

function renderEmailValue(email: string): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-2">
      <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
        <MailIcon className="size-3.5 shrink-0" />
        {email}
      </a>
      <CopyIconButton value={email} />
    </span>
  )
}

function renderPhoneValue(phone: string): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-2">
      <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
        <PhoneIcon className="size-3.5 shrink-0" />
        {phone}
      </a>
      <CopyIconButton value={phone} />
    </span>
  )
}

function renderLinkedInValue(url: string): React.ReactNode {
  return (
    <a href={ensureProtocol(url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
      <FaLinkedin className="size-3.5 shrink-0" />
      Ver perfil
    </a>
  )
}

function renderUrlValue(url: string): React.ReactNode {
  return <a href={ensureProtocol(url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 break-all">{url}</a>
}

// Cada tipo de campo se lee distinto — un correo/link se reconoce de un vistazo
// si está azul, un select se lee mejor como badge que como texto plano con comas,
// una fecha como "03 de agosto de 2026" dice más que "2026-08-03".
function formatFieldValue(field: PublicCustomField, raw: unknown): React.ReactNode {
  if (raw === undefined || raw === null || raw === "") return <span className="text-muted-foreground">—</span>

  if (field.type === "FILE" && isUploadedFile(raw)) {
    return <FileFieldValue file={raw} />
  }

  if (field.type === "BOOLEAN") {
    return raw
      ? <Badge className="rounded-full border-0 bg-emerald-100 px-2 py-0 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Sí</Badge>
      : <Badge variant="secondary" className="rounded-full px-2 py-0">No</Badge>
  }

  if (field.type === "URL" && typeof raw === "string") return renderUrlValue(raw)

  if (field.type === "DATE" && typeof raw === "string") {
    const date = new Date(raw)
    if (!isNaN(date.getTime())) {
      return (
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          {format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}
        </span>
      )
    }
  }

  if (field.type === "SELECT" || Array.isArray(raw)) {
    const values = Array.isArray(raw) ? raw : [raw]
    return (
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <Badge key={i} variant="secondary" className="rounded-full px-2 py-0">{String(v)}</Badge>
        ))}
      </div>
    )
  }

  if (field.type === "NUMBER") {
    const n = Number(raw)
    if (!isNaN(n)) return <span className="tabular-nums">{n.toLocaleString("es-CL")}</span>
  }

  if (field.type === "TEXTAREA") {
    return <p className="whitespace-pre-wrap">{String(raw)}</p>
  }

  return String(raw)
}

// ─── Lista plana de items a renderizar (secciones + campos numerados) ────────
// Se arma como datos primero (no JSX directo) para poder llevar una numeración
// corrida (01, 02, 03...) que atraviesa tanto los campos fijos (nombre/correo/
// empresa) como los custom del formulario — igual que se ve el formulario real
// que la persona completó, no separado en "los de siempre" vs "los custom".

type AnswerItem =
  | { kind: "section"; key: string; title: string }
  | { kind: "field"; key: string; label: string; required?: boolean; value: React.ReactNode; answered?: boolean }

function buildAnswerItems(answer: FormAnswerRaw, customFields: PublicCustomField[]): AnswerItem[] {
  const items: AnswerItem[] = []

  if (answer.person) {
    items.push({ kind: "section", key: "sec-contacto", title: "Datos de contacto" })
    items.push({ kind: "field", key: "p-name", label: "Nombre completo", value: answer.person.name })
    if (answer.person.email) items.push({ kind: "field", key: "p-email", label: "Correo electrónico", value: renderEmailValue(answer.person.email) })
    if (answer.person.phone) items.push({ kind: "field", key: "p-phone", label: "Teléfono", value: renderPhoneValue(answer.person.phone) })
    if (answer.person.linkedin_url) {
      items.push({ kind: "field", key: "p-linkedin", label: "LinkedIn", value: renderLinkedInValue(answer.person.linkedin_url) })
    }
  }

  if (answer.organization) {
    items.push({ kind: "section", key: "sec-empresa", title: "Empresa" })
    items.push({ kind: "field", key: "o-name", label: "Nombre empresa", value: answer.organization.name })
    if (answer.organization.document_number) items.push({ kind: "field", key: "o-rut", label: "RUT", value: answer.organization.document_number })
    if (answer.organization.industry) items.push({ kind: "field", key: "o-industry", label: "Industria", value: answer.organization.industry })
    if (answer.organization.web_page) {
      items.push({ kind: "field", key: "o-web", label: "Sitio web", value: renderUrlValue(answer.organization.web_page) })
    }
  }

  let sectionOpen = false
  for (const field of customFields) {
    if (field.type === "SECTION_TITLE") {
      items.push({ kind: "section", key: `sec-${field.id}`, title: field.label })
      sectionOpen = true
      continue
    }
    // INFO es texto estático (instrucciones), no una pregunta — no tiene respuesta que mostrar.
    if (field.type === "INFO") continue
    if (!sectionOpen) {
      items.push({ kind: "section", key: "sec-info-adicional", title: "Información adicional" })
      sectionOpen = true
    }
    // Antes se saltaba el campo entero si no venía en answers — pero eso oculta
    // que la pregunta existía y quedó sin contestar (normal en campos opcionales).
    // Mejor mostrarla igual, marcada como "sin responder" en vez de desaparecer.
    const raw = answer.answers[field.id]
    const answered = raw !== undefined && raw !== null && raw !== "" && !(Array.isArray(raw) && raw.length === 0)
    items.push({
      kind: "field", key: field.id, label: field.label, required: field.required,
      answered,
      value: answered ? formatFieldValue(field, raw) : null,
    })
  }

  return items
}

// ─── Card numerada por campo (01, 02, ...) con check de "respondido") ────────

function FieldCard({
  number,
  label,
  required,
  value,
  answered = true,
}: {
  number: number
  label: string
  required?: boolean
  value: React.ReactNode
  answered?: boolean
}) {
  return (
    <div className={cn("rounded-xl border p-3.5", !answered && "opacity-60")}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="tabular-nums text-muted-foreground">{String(number).padStart(2, "0")}</span>
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </p>
        {answered
          ? <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
          : <CircleDashedIcon className="size-4 shrink-0 text-muted-foreground" />
        }
      </div>
      <div className="mt-2.5 border-t pt-2.5 text-sm wrap-break-word">
        {answered ? value : <span className="text-muted-foreground italic">Sin responder</span>}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const formConfigCache = new Map<number, Promise<PublicCustomField[]>>()

function getCustomFields(formId: number): Promise<PublicCustomField[]> {
  if (!formConfigCache.has(formId)) {
    const p = formService.get(formId)
      .then((form) => {
        const config = form.base_config as { custom_fields?: PublicCustomField[] } | null
        return config?.custom_fields ?? []
      })
      .catch(() => [])
    formConfigCache.set(formId, p)
  }
  return formConfigCache.get(formId)!
}

export function FormAnswerDetail({
  answer,
  onToggled,
  onBack,
}: {
  answer: FormAnswerRaw
  onToggled: (answerId: number, isActive: boolean) => void
  // Solo se pasa en mobile — ahí Col 2 reemplaza a Col 1 en vez de convivir al
  // lado, así que hace falta una forma de volver a la lista.
  onBack?: () => void
}) {
  const router = useRouter()
  const [customFields, setCustomFields] = React.useState<PublicCustomField[] | null>(null)
  const [toggling, setToggling] = React.useState(false)

  React.useEffect(() => {
    if (!answer.form) { setCustomFields([]); return }
    setCustomFields(null)
    getCustomFields(answer.form.id).then(setCustomFields)
  }, [answer.form?.id])

  function handleToggleVisible(next: boolean) {
    if (!answer.form || toggling) return
    setToggling(true)
    onToggled(answer.id, next) // optimista
    formService.toggleAnswer(answer.form.id, answer.id, next)
      .catch(() => {
        onToggled(answer.id, !next) // revertir
        notify.error({ title: "No se pudo actualizar", description: "Intenta de nuevo." })
      })
      .finally(() => setToggling(false))
  }

  const name = answerDisplayName(answer)
  const items = customFields ? buildAnswerItems(answer, customFields) : null
  let fieldNumber = 0

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Volver a respuestas
        </button>
      )}
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b p-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar size="default" className="shrink-0">
            <AvatarImage src="https://github.com/shadcn.png" alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 font-semibold">
              <span className="truncate">{name}</span>
              {answer.person?.email && (
                <span className="font-normal text-muted-foreground">&lt;{answer.person.email}&gt;</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {answer.form?.name}
              {" · "}
              {format(new Date(answer.created_at), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Visible</span>
            <VisibleToggle checked={answer.is_active} onChange={handleToggleVisible} disabled={toggling} />
          </div>

          {(answer.opportunity_id || answer.person?.id || answer.organization?.id) && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {answer.opportunity_id && (
                  <DropdownMenuItem onClick={() => router.push(`/crm/funnels/${answer.opportunity_id}`)}>
                    <BriefcaseIcon className="size-3.5" /> Ver Oportunidad
                  </DropdownMenuItem>
                )}
                {answer.person?.id && (
                  <DropdownMenuItem onClick={() => router.push(`/crm/contacts/${answer.person!.id}`)}>
                    <UserIcon className="size-3.5" /> Ver Contacto
                  </DropdownMenuItem>
                )}
                {answer.organization?.id && (
                  <DropdownMenuItem onClick={() => router.push(`/crm/organizations/${answer.organization!.id}`)}>
                    <BuildingIcon className="size-3.5" /> Ver Empresa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {answer.vacante_relacionada && (
          <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
            <BriefcaseIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground">Postulado a</span>
              <p className="truncate font-medium">
                {answer.vacante_relacionada.titulo ?? "Vacante"}
                {answer.vacante_relacionada.empresa && <> — {answer.vacante_relacionada.empresa}</>}
              </p>
            </div>
          </div>
        )}

        {items === null ? (
          <div className="flex justify-center py-6">
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              if (item.kind === "section") {
                return (
                  <p key={item.key} className="pt-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase first:pt-0">
                    {item.title}
                  </p>
                )
              }
              fieldNumber += 1
              return (
                <FieldCard
                  key={item.key}
                  number={fieldNumber}
                  label={item.label}
                  required={item.required}
                  value={item.value}
                  answered={item.answered}
                />
              )
            })}
          </div>
        )}

        {answer.notes.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Notas</p>
            {answer.notes.map((note) => (
              <div key={note.id} className="rounded-lg border bg-muted/30 p-2.5 text-sm">
                {note.title && <p className="font-medium">{note.title}</p>}
                {note.content && <p className="text-muted-foreground">{note.content}</p>}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
