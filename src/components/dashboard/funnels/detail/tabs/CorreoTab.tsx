"use client"

import * as React from "react"
import Link from "next/link"
import DOMPurify from "dompurify"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeftIcon,
  BoldIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ItalicIcon,
  Loader2Icon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MailIcon,
  MailWarningIcon,
  PaperclipIcon,
  PencilIcon,
  ReceiptIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  UnderlineIcon,
  XIcon,
} from "lucide-react"
import { useIntegrations } from "@/hooks/useIntegrations"
import { integrationService } from "@/services/integration.service"
import { opportunityService } from "@/services/opportunity.service"
import { quotationService } from "@/services/quotation.service"
import { generatePdfBase64 } from "@/components/dashboard/quotations/shared/download-pdf"
import type { QuotationRaw } from "@/types/quotation"
import type { OpportunityEmailRaw } from "@/types/opportunity"
import { notify } from "@/lib/notify"
import { getInitials } from "@/lib/table-utils"

// ─── Config ───────────────────────────────────────────────────────────────────

const FORMAT_BUTTONS = [
  { icon: <BoldIcon className="size-3.5" />,      label: "Negrita"   },
  { icon: <ItalicIcon className="size-3.5" />,    label: "Cursiva"   },
  { icon: <UnderlineIcon className="size-3.5" />, label: "Subrayado" },
]

const LIST_BUTTONS = [
  { icon: <ListOrderedIcon className="size-3.5" />, label: "Lista ordenada" },
  { icon: <ListIcon className="size-3.5" />,        label: "Lista"          },
  { icon: <LinkIcon className="size-3.5" />,        label: "Enlace"         },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "")
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type Attachment = { filename: string; mimeType: string; data: string; size: number }

// "Hoy 10:32", "Ayer 15:04" o la fecha completa — mismo criterio que HistorialTab.
function formatEmailDate(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return `Hoy, ${format(date, "HH:mm")}`
  if (isYesterday(date)) return `Ayer, ${format(date, "HH:mm")}`
  return format(date, "d MMM yyyy, HH:mm", { locale: es })
}

// ─── Composer ─────────────────────────────────────────────────────────────────

interface ComposerProps {
  connectionId: number
  userEmail:    string
  contactEmail: string | null
  contactName:  string | null
  opportunityId: number
  onSent:       () => void
  onCancel?:    () => void
}

function EmailComposer({ connectionId, userEmail, contactEmail, contactName, opportunityId, onSent, onCancel }: ComposerProps) {
  const [recipients, setRecipients]         = React.useState<string[]>(contactEmail ? [contactEmail] : [])
  const [recipientInput, setRecipientInput] = React.useState("")
  const [subject, setSubject]               = React.useState("")
  const [body, setBody]                     = React.useState("")
  const [signatureHtml, setSignatureHtml]   = React.useState<string | undefined>(undefined)
  const [attachments, setAttachments]       = React.useState<Attachment[]>([])
  const [attachingQuotationId, setAttachingQuotationId] = React.useState<number | null>(null)
  const [quotations, setQuotations]         = React.useState<QuotationRaw[] | null>(null)
  const [quotationsOpen, setQuotationsOpen] = React.useState(false)
  const [sending, setSending]               = React.useState(false)
  const fileInputRef                        = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    integrationService.getGmailSignature(connectionId)
      .then((signature) => setSignatureHtml(signature))
      .catch(() => {})
  }, [connectionId])

  function removeRecipient(r: string) {
    setRecipients((prev) => prev.filter((x) => x !== r))
  }

  function handleRecipientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && recipientInput.trim()) {
      e.preventDefault()
      setRecipients((prev) => [...prev, recipientInput.trim()])
      setRecipientInput("")
    }
    if (e.key === "Backspace" && !recipientInput && recipients.length > 0) {
      setRecipients((prev) => prev.slice(0, -1))
    }
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ""
    const mapped = await Promise.all(
      selected.map(async (file) => ({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        data: await fileToBase64(file),
        size: file.size,
      }))
    )
    setAttachments((prev) => [...prev, ...mapped])
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function openQuotationsPopover(open: boolean) {
    setQuotationsOpen(open)
    if (open && quotations === null) {
      quotationService.listByOpportunity(opportunityId).then(setQuotations).catch(() => setQuotations([]))
    }
  }

  async function attachQuotation(q: QuotationRaw) {
    setQuotationsOpen(false)
    setAttachingQuotationId(q.id)
    try {
      const data = await generatePdfBase64(q.id)
      setAttachments((prev) => [...prev, { filename: `${q.name}.pdf`, mimeType: "application/pdf", data, size: 0 }])
    } catch {
      notify.error({ title: "No se pudo adjuntar la cotización", description: `Falló al generar el PDF de "${q.name}".` })
    } finally {
      setAttachingQuotationId(null)
    }
  }

  function resetComposer() {
    setSubject("")
    setBody("")
    setAttachments([])
  }

  async function handleSend() {
    if (sending || recipients.length === 0 || !subject.trim() || !body.trim()) return
    setSending(true)
    try {
      await integrationService.sendGmailMessage(connectionId, {
        to: recipients.join(", "),
        subject: subject.trim(),
        body,
        signatureHtml,
        attachments: attachments.length > 0
          ? attachments.map(({ filename, mimeType, data }) => ({ filename, mimeType, data }))
          : undefined,
        opportunityId,
      })
      notify.success({ title: "Correo enviado", description: `Se envió a ${recipients.join(", ")}.` })
      resetComposer()
      onSent()
    } catch (error) {
      notify.error({
        title: "No se pudo enviar el correo",
        description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
      })
    } finally {
      setSending(false)
    }
  }

  const canSend = recipients.length > 0 && !!subject.trim() && !!body.trim() && !sending

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">

      {onCancel && (
        <div className="border-b px-3.5 py-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Volver
          </button>
        </div>
      )}

      {/* De */}
      <div className="flex items-center gap-2.5 border-b px-3.5 py-2">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">De:</span>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {userEmail}
        </span>
      </div>

      {/* Para */}
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 border-b px-3.5 py-2">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">Para:</span>
        {recipients.map((r) => (
          <span
            key={r}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
          >
            {r === contactEmail && contactName ? contactName : r}
            <button
              onClick={() => removeRecipient(r)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Agregar destinatario..."
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          onKeyDown={handleRecipientKeyDown}
        />
      </div>

      {/* Asunto */}
      <div className="flex items-center gap-2.5 border-b px-3.5 py-2.5">
        <span className="w-11 shrink-0 text-xs font-medium text-muted-foreground">Asunto:</span>
        <input
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Escribe el asunto..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* Template toolbar — decorativo, sin construir todavía */}
      <div className="flex flex-wrap items-center gap-1.5 border-b px-3.5 py-2">
        {(["Plantilla", "Insertar campo", "Reunión"] as const).map((label) => (
          <DropdownMenu key={label}>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-xs" disabled title="Próximamente" />}
            >
              {label} <ChevronDownIcon className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              <DropdownMenuItem className="text-xs text-muted-foreground">
                Sin opciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
        <Button
          size="sm"
          disabled
          title="Próximamente"
          className="ml-auto h-7 gap-1.5 bg-violet-600 px-3 text-xs text-white hover:bg-violet-700"
        >
          <SparklesIcon className="size-3.5" />
          Redactar con IA
        </Button>
      </div>

      {/* Body */}
      <textarea
        className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        rows={6}
        placeholder="Escribe tu mensaje aquí..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {signatureHtml && (
        <div className="border-t px-3.5 py-2.5">
          <p className="mb-1 text-xs text-muted-foreground">Firma (se agrega automáticamente al enviar)</p>
          <div
            className="rounded-lg border bg-muted/30 p-2 text-sm [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(signatureHtml) }}
          />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t px-3.5 py-2.5">
          {attachments.map((file, i) => (
            <span
              key={`${file.filename}-${i}`}
              className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs"
            >
              <span className="max-w-40 truncate">{file.filename}</span>
              {file.size > 0 && <span className="text-muted-foreground">{formatFileSize(file.size)}</span>}
              <button type="button" onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-foreground">
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Formatting toolbar — decorativo, sin construir todavía */}
      <div className="flex items-center gap-0.5 border-t px-3 py-1.5">
        {FORMAT_BUTTONS.map(({ icon, label }) => (
          <Button key={label} variant="ghost" size="icon" disabled title="Próximamente" className="size-7 text-muted-foreground hover:text-foreground">
            {icon}
          </Button>
        ))}
        <div className="mx-1.5 h-4 w-px bg-border" />
        {LIST_BUTTONS.map(({ icon, label }) => (
          <Button key={label} variant="ghost" size="icon" disabled title="Próximamente" className="size-7 text-muted-foreground hover:text-foreground">
            {icon}
          </Button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3.5 py-2.5">
        <div className="flex items-center gap-0.5">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" title="Adjuntar archivo" onClick={() => fileInputRef.current?.click()}>
            <PaperclipIcon className="size-4" />
          </Button>

          <Popover open={quotationsOpen} onOpenChange={openQuotationsPopover}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  title="Adjuntar cotización"
                  disabled={attachingQuotationId !== null}
                />
              }
            >
              {attachingQuotationId !== null ? <Loader2Icon className="size-4 animate-spin" /> : <ReceiptIcon className="size-4" />}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1.5">
              {quotations === null ? (
                <div className="flex justify-center py-3">
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : quotations.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">Sin cotizaciones en esta oportunidad.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto">
                  {quotations.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => attachQuotation(q)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{q.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-500" title="Limpiar mensaje" onClick={resetComposer}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
        <Button size="sm" className="h-8 gap-1.5 px-4 text-xs" disabled={!canSend} onClick={handleSend}>
          {sending ? <Loader2Icon className="size-3.5 animate-spin" /> : <SendIcon className="size-3.5" />}
          Enviar
        </Button>
      </div>

    </div>
  )
}

// ─── Lista de correos enviados ────────────────────────────────────────────────

function EmailList({ emails, onOpen }: { emails: OpportunityEmailRaw[]; onOpen: (email: OpportunityEmailRaw) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {emails.map((email) => (
        <button
          key={email.id}
          type="button"
          onClick={() => onOpen(email)}
          className="flex w-full flex-col gap-0.5 border-b px-3.5 py-3 text-left last:border-b-0 hover:bg-muted/50"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{email.subject}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatEmailDate(email.created_at)}</span>
          </div>
          <span className="truncate text-xs text-muted-foreground">Para: {email.to}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Vista previa de un correo puntual ────────────────────────────────────────

function EmailDetail({
  email,
  userEmail,
  connectionId,
  onBack,
}: {
  email: OpportunityEmailRaw
  userEmail: string
  connectionId: number
  onBack: () => void
}) {
  const attachmentNames = email.attachment_names ?? []
  const senderName = email.user?.name || userEmail
  // null = todavía no se sabe (o no hay thread), 0 = nadie contestó, N = hay más
  // mensajes en el hilo real de Gmail además del que mandamos nosotros — se pide en vivo
  // solo al abrir ESTE correo puntual (no para toda la lista, para no pegarle a la API
  // de Gmail una vez por fila).
  const [replyCount, setReplyCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    setReplyCount(null)
    if (!email.gmail_thread_id) return
    integrationService.getGmailThread(connectionId, email.gmail_thread_id)
      .then((thread) => setReplyCount(Math.max(0, thread.messages.length - 1)))
      .catch(() => setReplyCount(null))
  }, [connectionId, email.gmail_thread_id])

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-3.5 py-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Volver
        </button>
        {email.gmail_thread_id && (
          <Link
            href={`/crm/mail?folder=sent&thread=${email.gmail_thread_id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {replyCount !== null && replyCount > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                {replyCount} {replyCount === 1 ? "respuesta" : "respuestas"}
              </span>
            )}
            Ver en Mail <ExternalLinkIcon className="size-3" />
          </Link>
        )}
      </div>

      <div className="flex items-start gap-3 border-b px-3.5 py-3">
        <Avatar size="default">
          <AvatarImage src="https://github.com/shadcn.png" alt={senderName} />
          <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold">
              {senderName} <span className="font-normal text-muted-foreground">&lt;{userEmail}&gt;</span>
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">{formatEmailDate(email.created_at)}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">para {email.to}</p>
        </div>
      </div>

      <div className="space-y-3 p-3.5">
        <p className="text-sm font-semibold">{email.subject}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{email.body}</p>

        {email.signature_html && (
          <div
            className="rounded-lg border bg-muted/30 p-2 text-sm [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.signature_html) }}
          />
        )}

        {attachmentNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachmentNames.map((name, i) => (
              <span key={`${name}-${i}`} className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs">
                <PaperclipIcon className="size-3 text-muted-foreground" />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty state (sin Gmail conectado) ────────────────────────────────────────

function NoGmailConnected() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <MailWarningIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Conecta Gmail para enviar correos</p>
        <p className="text-xs text-muted-foreground">
          Esta oportunidad todavía no puede enviar correos porque el workspace no tiene una cuenta de Gmail conectada.
        </p>
      </div>
      <Button size="sm" variant="outline" className="mt-1" nativeButton={false} render={<Link href="/settings/integrations" />}>
        <MailIcon className="size-3.5" />
        Ir a Integraciones
      </Button>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  opportunityId: number
  contactName:   string | null
  contactEmail:  string | null
}

type View = "list" | "detail" | "compose"

export function CorreoTab({ opportunityId, contactName, contactEmail }: Props) {
  const { connections, loading: loadingIntegrations } = useIntegrations()
  const gmail = connections.find((c) => c.provider_key === "gmail" && c.is_active)

  const [emails, setEmails]           = React.useState<OpportunityEmailRaw[] | null>(null)
  const [loadError, setLoadError]     = React.useState(false)
  const [view, setView]               = React.useState<View>("compose")
  const [selectedEmail, setSelectedEmail] = React.useState<OpportunityEmailRaw | null>(null)
  // Solo se usa para decidir la vista inicial (lista si ya había correos, composer si
  // era la primera vez) — refetches posteriores (después de enviar) no deben pisar la
  // vista que el usuario ya está viendo, eso lo decide explícitamente cada acción.
  const initialViewDecided = React.useRef(false)

  // Importante: si el fetch falla (ej. un corte momentáneo de conexión a la base), NO
  // hay que confundirlo con "todavía no se mandó ningún correo" — antes caía en el mismo
  // catch-y-array-vacío que "sin correos", y el tab mostraba el composer como si nunca
  // se hubiera enviado nada aunque el envío real sí funcionó. Ahora se distingue con
  // loadError y se pide reintentar en vez de asumir que es la primera vez.
  const refreshEmails = React.useCallback(() => {
    setLoadError(false)
    return opportunityService.listEmails(opportunityId)
      .then((res) => {
        setEmails(res)
        if (!initialViewDecided.current) {
          initialViewDecided.current = true
          setView(res.length > 0 ? "list" : "compose")
        }
      })
      .catch(() => setLoadError(true))
  }, [opportunityId])

  React.useEffect(() => {
    refreshEmails()
  }, [refreshEmails])

  function handleSent() {
    refreshEmails().then(() => setView("list"))
  }

  function openEmail(email: OpportunityEmailRaw) {
    setSelectedEmail(email)
    setView("detail")
  }

  const loading = loadingIntegrations || (emails === null && !loadError)

  return (
    <div className="flex flex-col gap-4 p-4">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !gmail ? (
        <NoGmailConnected />
      ) : emails === null && loadError ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">No se pudo cargar el historial de correos de esta oportunidad.</p>
          <Button size="sm" variant="outline" onClick={refreshEmails}>Reintentar</Button>
        </div>
      ) : (
        <>
          {(view === "list" || view === "detail") && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {emails!.length} correo{emails!.length === 1 ? "" : "s"} enviado{emails!.length === 1 ? "" : "s"}
              </p>
              <Button size="sm" variant="secondary" className="h-7 gap-1.5 rounded-full text-xs" onClick={() => setView("compose")}>
                <PencilIcon className="size-3.5" />
                Redactar
              </Button>
            </div>
          )}

          {view === "list" && <EmailList emails={emails!} onOpen={openEmail} />}

          {view === "detail" && selectedEmail && (
            <EmailDetail
              email={selectedEmail}
              userEmail={gmail.account_email ?? ""}
              connectionId={gmail.id}
              onBack={() => setView("list")}
            />
          )}

          {view === "compose" && (
            <EmailComposer
              connectionId={gmail.id}
              userEmail={gmail.account_email ?? ""}
              contactEmail={contactEmail}
              contactName={contactName}
              opportunityId={opportunityId}
              onSent={handleSent}
              onCancel={emails!.length > 0 ? () => setView("list") : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}
