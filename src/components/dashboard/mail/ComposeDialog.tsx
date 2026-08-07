"use client"

import * as React from "react"
import DOMPurify from "dompurify"
import { Loader2Icon, PaperclipIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/notify"
import { integrationService } from "@/services/integration.service"

interface ComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: number | null
  onSent?: () => void
}

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

// Alcance acordado: Para/CC/CCO/Asunto + cuerpo en texto plano + adjuntar archivos. La firma
// se muestra tal cual (con logo/formato) en un preview de solo lectura debajo del textarea —
// no se edita ahí ni se aplana a texto: al enviar, el backend arma el correo como
// multipart/alternative para que la firma real llegue intacta, mientras el texto tecleado
// sigue siendo texto plano (sin editor de texto enriquecido).
export function ComposeDialog({ open, onOpenChange, connectionId, onSent }: ComposeDialogProps) {
  const [to, setTo] = React.useState("")
  const [cc, setCc] = React.useState("")
  const [bcc, setBcc] = React.useState("")
  const [showCcBcc, setShowCcBcc] = React.useState(false)
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [signatureHtml, setSignatureHtml] = React.useState<string | undefined>(undefined)
  const [files, setFiles] = React.useState<File[]>([])
  const [sending, setSending] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) return
    setTo("")
    setCc("")
    setBcc("")
    setShowCcBcc(false)
    setSubject("")
    setBody("")
    setSignatureHtml(undefined)
    setFiles([])

    if (!connectionId) return
    integrationService.getGmailSignature(connectionId)
      .then((signature) => setSignatureHtml(signature))
      .catch(() => {}) // la firma es un plus — si falla, se compone sin ella nomás
  }, [open, connectionId])

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...selected])
    e.target.value = ""
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSend() {
    if (!connectionId || sending || !to.trim()) return
    setSending(true)
    try {
      const attachments = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          data: await fileToBase64(file),
        }))
      )
      await integrationService.sendGmailMessage(connectionId, {
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim() || "(sin asunto)",
        body,
        signatureHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      })
      notify.success({ title: "Correo enviado", description: `Se envió a ${to.trim()}.` })
      onOpenChange(false)
      onSent?.()
    } catch (error) {
      notify.error({
        title: "No se pudo enviar el correo",
        description: (error as { message?: string })?.message ?? "Intenta de nuevo.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mensaje nuevo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="compose-to">Para</Label>
              {!showCcBcc && (
                <button
                  type="button"
                  onClick={() => setShowCcBcc(true)}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  CC CCO
                </button>
              )}
            </div>
            <Input
              id="compose-to"
              type="email"
              placeholder="correo@ejemplo.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {showCcBcc && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="compose-cc">CC</Label>
                <Input id="compose-cc" type="email" value={cc} onChange={(e) => setCc(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compose-bcc">CCO</Label>
                <Input id="compose-bcc" type="email" value={bcc} onChange={(e) => setBcc(e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="compose-subject">Asunto</Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="compose-body">Mensaje</Label>
            <Textarea
              id="compose-body"
              className="min-h-48 resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {signatureHtml && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Firma (se agrega automáticamente al enviar)</p>
              <div
                className="rounded-lg border bg-muted/30 p-2 text-sm [&_img]:max-w-full"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(signatureHtml) }}
              />
            </div>
          )}

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <span
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs"
                >
                  <span className="max-w-40 truncate">{file.name}</span>
                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Adjuntar archivos">
              <PaperclipIcon className="size-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending || !to.trim()}>
              {sending ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
              Enviar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
