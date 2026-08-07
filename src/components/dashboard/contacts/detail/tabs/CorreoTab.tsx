"use client"

import * as React from "react"
import Link from "next/link"
import DOMPurify from "dompurify"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BoldIcon,
  ChevronDownIcon,
  ItalicIcon,
  Loader2Icon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MailIcon,
  MailWarningIcon,
  PaperclipIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  UnderlineIcon,
  XIcon,
} from "lucide-react"
import { useIntegrations } from "@/hooks/useIntegrations"
import { integrationService } from "@/services/integration.service"
import { notify } from "@/lib/notify"

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

// ─── Composer ─────────────────────────────────────────────────────────────────

interface ComposerProps {
  connectionId: number
  userEmail:    string
  contactEmail: string | null
  contactName:  string | null
}

function EmailComposer({ connectionId, userEmail, contactEmail, contactName }: ComposerProps) {
  const [recipients, setRecipients]         = React.useState<string[]>(contactEmail ? [contactEmail] : [])
  const [recipientInput, setRecipientInput] = React.useState("")
  const [subject, setSubject]               = React.useState("")
  const [body, setBody]                     = React.useState("")
  const [signatureHtml, setSignatureHtml]   = React.useState<string | undefined>(undefined)
  const [attachments, setAttachments]       = React.useState<Attachment[]>([])
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

  function resetComposer() {
    setSubject("")
    setBody("")
    setAttachments([])
  }

  async function handleSend() {
    if (sending || recipients.length === 0 || !body.trim()) return
    setSending(true)
    try {
      await integrationService.sendGmailMessage(connectionId, {
        to: recipients.join(", "),
        subject: subject.trim() || "(sin asunto)",
        body,
        signatureHtml,
        attachments: attachments.length > 0
          ? attachments.map(({ filename, mimeType, data }) => ({ filename, mimeType, data }))
          : undefined,
      })
      notify.success({ title: "Correo enviado", description: `Se envió a ${recipients.join(", ")}.` })
      resetComposer()
    } catch (error) {
      notify.error({
        title: "No se pudo enviar el correo",
        description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
      })
    } finally {
      setSending(false)
    }
  }

  const canSend = recipients.length > 0 && !!body.trim() && !sending

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">

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
          Este contacto todavía no puede recibir correos porque el workspace no tiene una cuenta de Gmail conectada.
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

// El envío es real (Gmail vía integración del workspace, firma real, adjuntos). Lo que
// falta es el registro de seguimiento (historial de correos por contacto) — a diferencia
// de Oportunidad, opportunity_email exige opportunity_id y un contacto no siempre tiene
// una oportunidad asociada, así que por ahora no queda historial acá. Se suma después.
interface Props {
  contactId:    number
  contactName:  string | null
  contactEmail: string | null
}

export function CorreoTab({ contactId: _, contactName, contactEmail }: Props) {
  const { connections, loading } = useIntegrations()
  const gmail = connections.find((c) => c.provider_key === "gmail" && c.is_active)

  return (
    <div className="flex flex-col gap-4 p-4">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !gmail ? (
        <NoGmailConnected />
      ) : (
        <EmailComposer
          connectionId={gmail.id}
          userEmail={gmail.account_email ?? ""}
          contactEmail={contactEmail}
          contactName={contactName}
        />
      )}
    </div>
  )
}
