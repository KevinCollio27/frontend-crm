"use client"

import * as React from "react"
import DOMPurify from "dompurify"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArchiveIcon,
  ArchiveXIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ClockIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  ExternalLinkIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PenLineIcon,
  ReplyAllIcon,
  SmileIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/notify"
import { integrationService } from "@/services/integration.service"

// Mismo set default que usa la propia Gmail para reacciones rápidas.
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]
import type { Mail, MailThread } from "./data"

// Reemplaza src="cid:xxx" por la imagen real — dataUri ya viene resuelto para partes chicas
// (Gmail mandó los bytes de una), el resto se completa con lo que se haya bajado on-demand.
function resolveInlineImages(html: string, images: Mail["inlineImages"], fetched: Record<string, string>): string {
  if (images.length === 0) return html
  let result = html
  for (const image of images) {
    const uri = image.dataUri ?? fetched[image.contentId]
    if (!uri) continue
    result = result.replaceAll(`cid:${image.contentId}`, uri)
  }
  return result
}

// Cuerpo del correo en un <iframe> aislado (mismo enfoque que usa Gmail) — así el HTML
// del correo puede traer su propio <style> sin filtrarse hacia el resto del CRM, y queda
// una capa extra de aislamiento además del sanitizado (DOMPurify) que ya se le aplicó.
// Sin allow-scripts en el sandbox: nada de JS corre ahí adentro pase lo que pase.
function EmailBody({ html }: { html: string }) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = React.useState(120)

  function handleLoad() {
    const doc = iframeRef.current?.contentDocument
    if (doc?.body) setHeight(doc.body.scrollHeight + 24)
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      title="Contenido del correo"
      className="w-full rounded-lg border bg-white"
      style={{ height }}
    />
  )
}

function BackBar({ onBack }: { onBack?: () => void }) {
  if (!onBack) return null
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeftIcon className="size-3.5" />
      Volver a la bandeja
    </button>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function attachmentVisual(mimeType: string): { Icon: typeof FileIcon; color: string } {
  if (mimeType === "application/pdf") return { Icon: FileTextIcon, color: "text-red-500" }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") {
    return { Icon: FileSpreadsheetIcon, color: "text-green-600" }
  }
  if (mimeType.startsWith("image/")) return { Icon: ImageIcon, color: "text-blue-500" }
  return { Icon: FileIcon, color: "text-muted-foreground" }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType })
}

// Un adjunto real (PDF, Excel, foto como archivo) — la metadata ya vino gratis con el
// thread, los bytes se piden recién al hacer click. Se abre en pestaña nueva (el navegador
// ya sabe renderizar PDFs/imágenes solo) en vez de forzar la descarga.
function AttachmentChip({
  attachment,
  mail,
  connectionId,
}: {
  attachment: Mail["attachments"][number]
  mail: Mail
  connectionId: number | null
}) {
  const [opening, setOpening] = React.useState(false)
  const { Icon, color } = attachmentVisual(attachment.mimeType)

  function handleOpen() {
    if (!connectionId || opening) return
    setOpening(true)
    integrationService
      .getGmailAttachment(connectionId, mail.id, attachment.attachmentId)
      .then((res) => {
        const blob = base64ToBlob(res.data, attachment.mimeType)
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank")
        // No se revoca de una — la pestaña nueva necesita tiempo para cargar el blob.
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      })
      .catch((error) => console.error(`No se pudo abrir "${attachment.filename}":`, error))
      .finally(() => setOpening(false))
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={opening}
      className="flex max-w-64 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 disabled:opacity-60"
    >
      <Icon className={cn("size-4 shrink-0", color)} />
      <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
      {opening ? (
        <Loader2Icon className="size-3.5 shrink-0 animate-spin" />
      ) : (
        <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}

// "mí" para el destinatario que coincide con la cuenta de Gmail conectada — el resto, su
// nombre (o el correo si no vino nombre en el header To).
function formatRecipientName(recipient: Mail["to"][number], accountEmail: string | null): string {
  if (accountEmail && recipient.email.toLowerCase() === accountEmail.toLowerCase()) return "mí"
  return recipient.name || recipient.email
}

// Destinatarios de "Responder a todos": el remitente original + todo el resto de To/Cc del
// mensaje, salvo la propia cuenta conectada (no tiene sentido mandarse copia a uno mismo)
// y salvo el remitente (ya va como "to", no hace falta repetirlo en cc).
function buildReplyAllCc(mail: Mail, accountEmail: string | null): string | undefined {
  const exclude = new Set(
    [mail.email.toLowerCase(), accountEmail?.toLowerCase()].filter((e): e is string => !!e)
  )
  const seen = new Set<string>()
  const emails: string[] = []
  for (const recipient of [...mail.to, ...mail.cc]) {
    const email = recipient.email.toLowerCase()
    if (exclude.has(email) || seen.has(email)) continue
    seen.add(email)
    emails.push(recipient.email)
  }
  return emails.length > 0 ? emails.join(", ") : undefined
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Un mensaje dentro del thread — colapsado muestra remitente+snippet (como Gmail),
// expandido muestra el cuerpo completo. El más reciente arranca expandido.
function ThreadMessage({
  mail,
  defaultOpen,
  connectionId,
  accountEmail,
  threadId,
}: {
  mail: Mail
  defaultOpen: boolean
  connectionId: number | null
  accountEmail: string | null
  threadId: string
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [recipientsExpanded, setRecipientsExpanded] = React.useState(false)
  const [fetchedImages, setFetchedImages] = React.useState<Record<string, string>>({})
  const [starred, setStarred] = React.useState(mail.isStarred)
  const [reactionOpen, setReactionOpen] = React.useState(false)
  const [sendingReaction, setSendingReaction] = React.useState(false)

  // Optimista: cambia de una en pantalla, revierte si el llamado falla.
  function handleToggleStar() {
    if (!connectionId) return
    const next = !starred
    setStarred(next)
    integrationService.toggleGmailStar(connectionId, mail.id, next).catch(() => {
      setStarred(!next)
      console.error(`No se pudo ${next ? "destacar" : "quitar el destacado de"} el correo`)
    })
  }

  // sendingReactionRef (no state) bloquea un segundo click YA, en el mismo tick — si solo
  // dependiéramos de sendingReaction (estado), dos clicks muy seguidos podían ejecutarse
  // ambos antes de que React llegue a aplicar el primer setSendingReaction(true), mandando
  // la reacción dos veces (justo lo que pasó al probar).
  const sendingReactionRef = React.useRef(false)

  function handleReact(emoji: string) {
    if (!connectionId || sendingReactionRef.current || !mail.messageIdHeader) return
    sendingReactionRef.current = true
    setSendingReaction(true)
    setReactionOpen(false)
    integrationService
      .sendGmailReaction(connectionId, {
        to: mail.email,
        subject: /^re:/i.test(mail.subject) ? mail.subject : `Re: ${mail.subject}`,
        threadId,
        inReplyTo: mail.messageIdHeader,
        emoji,
      })
      .then(() => notify.success({ title: "Reacción enviada", description: `Reaccionaste con ${emoji}.` }))
      .catch((error) => {
        notify.error({
          title: "No se pudo enviar la reacción",
          description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
        })
      })
      .finally(() => {
        sendingReactionRef.current = false
        setSendingReaction(false)
      })
  }
  // Set mutable (no state) para marcar qué contentId ya está en vuelo — evita pedir el
  // mismo adjunto dos veces cuando el efecto se dispara más de una vez antes de que la
  // primera respuesta llegue (p.ej. doble-invocación de efectos en desarrollo).
  const fetchingRef = React.useRef<Set<string>>(new Set())

  // Las imágenes inline solo se bajan cuando el mensaje está abierto — si no, cada carga
  // de la bandeja dispararía una llamada extra por cada firma/logo de cada correo.
  // Sin bandera "cancelled": el `fetchingRef` ya evita pedir el mismo adjunto dos veces
  // ante la doble-invocación de efectos en desarrollo — agregar además un "cancelled" por
  // invocación hacía que la PRIMERA corrida (la que sí trae la imagen) tirara su propio
  // resultado a la basura apenas la segunda corrida arrancaba, sin que nadie más lo aplicara.
  React.useEffect(() => {
    if (!open || !connectionId) return
    const pending = mail.inlineImages.filter(
      (img) =>
        !img.dataUri &&
        img.attachmentId &&
        !fetchedImages[img.contentId] &&
        !fetchingRef.current.has(img.contentId)
    )
    if (pending.length === 0) return

    pending.forEach((img) => fetchingRef.current.add(img.contentId))
    Promise.all(
      pending.map((img) =>
        integrationService
          .getGmailAttachment(connectionId, mail.id, img.attachmentId!)
          .then((res) => ({ contentId: img.contentId, uri: `data:${img.mimeType};base64,${res.data}` }))
          .catch((error) => {
            console.error(`No se pudo cargar la imagen inline "${img.contentId}":`, error)
            return null
          })
          .finally(() => { fetchingRef.current.delete(img.contentId) })
      )
    ).then((results) => {
      const resolved = results.filter((r): r is { contentId: string; uri: string } => r !== null)
      if (resolved.length === 0) return
      setFetchedImages((prev) => {
        const next = { ...prev }
        for (const r of resolved) next[r.contentId] = r.uri
        return next
      })
    })
  }, [open, connectionId, mail.id, mail.inlineImages, fetchedImages])

  const recipientNames = mail.to.map((r) => formatRecipientName(r, accountEmail))
  const visibleRecipientCount = 2
  const shownRecipients = recipientsExpanded ? recipientNames : recipientNames.slice(0, visibleRecipientCount)
  const hiddenRecipientCount = recipientNames.length - shownRecipients.length

  return (
    <div className="rounded-lg border">
      <div className="flex w-full items-start gap-3 p-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <Avatar size="default">
            <AvatarImage src="https://github.com/shadcn.png" alt={mail.name} />
            <AvatarFallback>{getInitials(mail.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-semibold">
              {mail.name}
              {open && <span className="font-normal text-muted-foreground">&lt;{mail.email}&gt;</span>}
              {mail.isGoxtSystem && (
                <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0 text-[0.65rem] font-normal">
                  GOXT
                </Badge>
              )}
            </p>
            {!open && (
              <p className="truncate text-xs text-muted-foreground">{mail.text}</p>
            )}
            {open && recipientNames.length > 0 && (
              <p className="truncate text-xs text-muted-foreground">
                para {shownRecipients.join(", ")}
                {hiddenRecipientCount > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setRecipientsExpanded(true) }}
                    className="ml-1 cursor-pointer text-foreground hover:underline"
                  >
                    y {hiddenRecipientCount} más ▾
                  </span>
                )}
              </p>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {open && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                title={starred ? "Quitar destacado" : "Destacar"}
                onClick={handleToggleStar}
              >
                <StarIcon className={cn("size-3.5", starred && "fill-yellow-400 text-yellow-500")} />
              </Button>
              <Popover open={reactionOpen} onOpenChange={setReactionOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      title="Reaccionar"
                      disabled={sendingReaction || !mail.messageIdHeader}
                    />
                  }
                >
                  {sendingReaction ? <Loader2Icon className="size-3.5 animate-spin" /> : <SmileIcon className="size-3.5" />}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1.5">
                  <div className="flex gap-1">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReact(emoji)}
                        className="rounded-md p-1.5 text-lg hover:bg-muted"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {/* Responder a este mensaje y Más ocultos hasta que estén implementados */}
              {/* <Button variant="ghost" size="icon" className="size-7" title="Responder a este mensaje (próximamente)">
                <CornerUpLeftIcon className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" title="Más (próximamente)">
                <MoreVerticalIcon className="size-3.5" />
              </Button> */}
            </>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 pl-1">
            <time className="whitespace-nowrap text-xs text-muted-foreground">
              {format(new Date(mail.date), "d MMM yyyy, HH:mm", { locale: es })}
            </time>
            <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t p-3">
          {mail.bodyHtml ? (
            <EmailBody html={resolveInlineImages(mail.bodyHtml, mail.inlineImages, fetchedImages)} />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{mail.text}</p>
          )}

          {mail.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mail.attachments.map((attachment) => (
                <AttachmentChip
                  key={attachment.attachmentId}
                  attachment={attachment}
                  mail={mail}
                  connectionId={connectionId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface MailDisplayProps {
  thread: MailThread | undefined
  loading: boolean
  connectionId: number | null
  accountEmail: string | null
  onReplySent?: () => void
  onBack?: () => void
}

export function MailDisplay({ thread, loading, connectionId, accountEmail, onReplySent, onBack }: MailDisplayProps) {
  const [reply, setReply] = React.useState("")
  const [muted, setMuted] = React.useState(false)
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyMode, setReplyMode] = React.useState<"reply" | "replyAll">("reply")
  const [signatureHtml, setSignatureHtml] = React.useState<string | undefined>(undefined)
  const [signatureExpanded, setSignatureExpanded] = React.useState(false)
  const [sending, setSending] = React.useState(false)

  // El composer se colapsa de nuevo al cambiar de correo — que quede abierto no tendría
  // sentido para un thread distinto al que se estaba respondiendo.
  React.useEffect(() => {
    setReplyOpen(false)
    setReply("")
    setReplyMode("reply")
    setSignatureExpanded(false)
  }, [thread?.id])

  function toggleReply(mode: "reply" | "replyAll") {
    if (replyOpen && replyMode === mode) {
      setReplyOpen(false)
      return
    }
    setReplyMode(mode)
    setReplyOpen(true)
    setSignatureExpanded(false)
  }

  // La firma se trae recién al abrir el composer de respuesta, igual que en Redactar —
  // no tiene sentido pedirla si el usuario nunca llega a contestar.
  React.useEffect(() => {
    if (!replyOpen || !connectionId) return
    integrationService.getGmailSignature(connectionId)
      .then((signature) => setSignatureHtml(signature))
      .catch(() => {})
  }, [replyOpen, connectionId])

  function handleSendReply() {
    if (!thread || !connectionId || sending || !reply.trim()) return
    const lastMail = thread.messages[thread.messages.length - 1]
    const subject = /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`
    const cc = replyMode === "replyAll" ? buildReplyAllCc(lastMail, accountEmail) : undefined
    setSending(true)
    integrationService
      .sendGmailMessage(connectionId, {
        to: lastMail.email,
        cc,
        subject,
        body: reply,
        signatureHtml,
        threadId: thread.id,
        inReplyTo: lastMail.messageIdHeader,
      })
      .then(() => {
        notify.success({
          title: "Respuesta enviada",
          description: cc ? `Se envió a ${lastMail.name} y otros.` : `Se envió a ${lastMail.name}.`,
        })
        setReply("")
        setReplyOpen(false)
        onReplySent?.()
      })
      .catch((error) => {
        notify.error({
          title: "No se pudo enviar la respuesta",
          description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
        })
      })
      .finally(() => setSending(false))
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <BackBar onBack={onBack} />
        <div className="border-b p-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="flex h-full flex-col">
        <BackBar onBack={onBack} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <CornerUpLeftIcon className="size-8 opacity-30" />
          <p className="text-sm">Selecciona un correo para leerlo</p>
        </div>
      </div>
    )
  }

  const lastMail = thread.messages[thread.messages.length - 1]

  return (
    <div className="flex h-full flex-col">
      <BackBar onBack={onBack} />

      {/* Toolbar */}
      <div className="flex items-center border-b px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-8" title="Archivar (próximamente)">
            <ArchiveIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="Mover a no deseado (próximamente)">
            <ArchiveXIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            title="Eliminar (próximamente)"
          >
            <Trash2Icon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <Button variant="ghost" size="icon" className="size-8" title="Posponer (próximamente)">
            <ClockIcon className="size-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", replyOpen && replyMode === "reply" && "bg-muted")}
            title="Responder"
            onClick={() => toggleReply("reply")}
          >
            <CornerUpLeftIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", replyOpen && replyMode === "replyAll" && "bg-muted")}
            title="Responder a todos"
            onClick={() => toggleReply("replyAll")}
          >
            <ReplyAllIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="Reenviar (próximamente)">
            <CornerUpRightIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <Button variant="ghost" size="icon" className="size-8" title="Próximamente">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Subject header */}
      <div className="border-b p-3">
        <p className="truncate font-semibold">{thread.subject}</p>
        {thread.messages.length > 1 && (
          <p className="text-xs text-muted-foreground">{thread.messages.length} mensajes</p>
        )}
      </div>

      {/* Body — un mensaje por bloque, más reciente expandido primero */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {thread.messages.map((mail, i) => (
          <ThreadMessage
            key={mail.id}
            mail={mail}
            defaultOpen={i === thread.messages.length - 1}
            connectionId={connectionId}
            accountEmail={accountEmail}
            threadId={thread.id}
          />
        ))}
      </div>

      {/* Reply area — colapsado hasta que se pide con el botón Responder del toolbar,
          para no restarle espacio al body del correo cuando no se está respondiendo. */}
      {replyOpen && (
      <div className="border-t p-3 space-y-2">
        <Textarea
          placeholder={
            replyMode === "replyAll" ? `Responder a todos en "${thread.subject}"...` : `Responder a ${lastMail.name}...`
          }
          className="min-h-24 resize-none"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          autoFocus
        />

        {signatureHtml && (
          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setSignatureExpanded((v) => !v)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <PenLineIcon className="size-3.5 shrink-0" />
              <span className="flex-1">Firma automática</span>
              <ChevronDownIcon
                className={cn("size-4 shrink-0 transition-transform", signatureExpanded && "rotate-180")}
              />
            </button>
            {signatureExpanded && (
              <div
                className="border-t bg-muted/30 p-2 text-sm [&_img]:max-w-full"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(signatureHtml) }}
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              role="switch"
              aria-checked={muted}
              onClick={() => setMuted((m) => !m)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
                muted ? "bg-primary" : "bg-input"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 rounded-full bg-background shadow-sm transition-transform",
                  muted ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
            Silenciar este hilo
          </label>
          <Button size="sm" onClick={handleSendReply} disabled={sending || !reply.trim()}>
            {sending ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            Enviar
          </Button>
        </div>
      </div>
      )}
    </div>
  )
}
