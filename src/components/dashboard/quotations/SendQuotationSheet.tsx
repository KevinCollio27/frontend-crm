"use client"

import * as React from "react"
import {
  FileIcon,
  LoaderCircleIcon,
  MailIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { getInitials } from "@/lib/table-utils"
import { contactService } from "@/services/contact.service"
import { quotationService } from "@/services/quotation.service"
import { generatePdfBase64 } from "@/components/dashboard/quotations/shared/download-pdf"
import { notify } from "@/lib/notify"

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailChip {
  id?:   number
  name:  string
  email: string
}

interface ContactResult {
  id:    number
  name:  string
  email: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── ContactAvatar ────────────────────────────────────────────────────────────

function ContactAvatar({ name, size = "size-7" }: { name: string; size?: string }) {
  return (
    <Avatar className={cn(size, "shrink-0")}>
      <AvatarImage src="https://github.com/shadcn.png" alt={name} />
      <AvatarFallback className="text-[10px] font-semibold">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

// ─── EmailChipInput ───────────────────────────────────────────────────────────

function EmailChipInput({
  chips,
  onChange,
  onSearch,
  placeholder = "Buscar contacto o escribir correo...",
}: {
  chips:        EmailChip[]
  onChange:     (chips: EmailChip[]) => void
  onSearch:     (query: string, exclude: string[]) => Promise<ContactResult[]>
  placeholder?: string
}) {
  const [input, setInput]         = React.useState("")
  const [focused, setFocused]     = React.useState(false)
  const [searching, setSearching] = React.useState(false)
  const [results, setResults]     = React.useState<ContactResult[]>([])
  const containerRef              = React.useRef<HTMLDivElement>(null)
  const dropRef                   = React.useRef<HTMLDivElement>(null)
  const inputRef                  = React.useRef<HTMLInputElement>(null)
  const [dropStyle, setDropStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    if (!focused) { setResults([]); return }
    setSearching(true)
    const exclude = chips.map((c) => c.email)
    const t = setTimeout(async () => {
      try {
        const found = await onSearch(input, exclude)
        setResults(found)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => { clearTimeout(t); setSearching(false) }
  }, [input, focused, chips])

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (!containerRef.current?.contains(target) && !dropRef.current?.contains(target)) {
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function updateDrop() {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      setDropStyle({ top: r.bottom + 4, left: r.left, width: r.width })
    }
  }

  function addContact(c: ContactResult) {
    onChange([...chips, { id: c.id, name: c.name, email: c.email }])
    setInput("")
    inputRef.current?.focus()
  }

  function addFreeEmail() {
    const email = input.trim()
    if (!isValidEmail(email) || chips.some((c) => c.email === email)) { setInput(""); return }
    onChange([...chips, { name: email, email }])
    setInput("")
  }

  function removeChip(idx: number) {
    onChange(chips.filter((_, i) => i !== idx))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === "Tab" || e.key === ",") && input) {
      e.preventDefault()
      addFreeEmail()
    }
    if (e.key === "Backspace" && !input && chips.length > 0) {
      removeChip(chips.length - 1)
    }
  }

  const showDrop = focused && (searching || results.length > 0 || (!!input && isValidEmail(input)))

  return (
    <>
      <div
        ref={containerRef}
        onClick={() => { inputRef.current?.focus(); updateDrop() }}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-transparent px-3 py-2 text-sm cursor-text transition-colors",
          focused && "border-ring ring-3 ring-ring/50",
        )}
      >
        {chips.map((chip, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted pl-1 pr-1.5 py-0.5 text-xs font-medium max-w-52"
          >
            <ContactAvatar name={chip.name} size="size-4" />
            <span className="truncate">{chip.id ? chip.name : chip.email}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeChip(idx) }}
              className="ml-0.5 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onFocus={() => { setFocused(true); updateDrop() }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={(e) => { setInput(e.target.value); updateDrop() }}
          onKeyDown={handleKeyDown}
          placeholder={chips.length === 0 ? placeholder : ""}
          className="min-w-28 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {showDrop && (
        <div
          ref={dropRef}
          className="fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-md"
          style={dropStyle}
        >
          <div className="max-h-52 overflow-y-auto p-1">
            {searching ? (
              <div className="flex justify-center py-4">
                <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addContact(c) }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <ContactAvatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                    </div>
                  </button>
                ))}

                {isValidEmail(input) && !chips.some((c) => c.email === input.trim()) && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addFreeEmail() }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <MailIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span>Añadir <strong>{input.trim()}</strong></span>
                  </button>
                )}

                {results.length === 0 && !isValidEmail(input) && input && (
                  <p className="py-2 text-center text-sm text-muted-foreground">Sin resultados</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  quotationId:   number
  quotationName: string
  contactEmail?: string
  contactName?:  string
}

export function SendQuotationSheet({
  open,
  onOpenChange,
  quotationId,
  quotationName,
  contactEmail,
  contactName,
}: Props) {
  const [to, setTo]                 = React.useState<EmailChip[]>([])
  const [cc, setCc]                 = React.useState<EmailChip[]>([])
  const [bcc, setBcc]               = React.useState<EmailChip[]>([])
  const [showCc, setShowCc]         = React.useState(false)
  const [showBcc, setShowBcc]       = React.useState(false)
  const [includePdf, setIncludePdf] = React.useState(true)
  const [files, setFiles]           = React.useState<File[]>([])
  const [sending, setSending]       = React.useState(false)
  const fileInputRef                = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      const initial: EmailChip[] = contactEmail
        ? [{ name: contactName ?? contactEmail, email: contactEmail }]
        : []
      setTo(initial)
      setCc([])
      setBcc([])
      setShowCc(false)
      setShowBcc(false)
      setIncludePdf(true)
      setFiles([])
      setSending(false)
    }
  }, [open])

  async function searchContacts(query: string, exclude: string[]): Promise<ContactResult[]> {
    const res = await contactService.list({ filter: query || undefined, take: 20 })
    return res.data
      .map((p) => {
        const emailDetail = p.person_detail.find(
          (d) => d.label?.key?.toLowerCase().includes("email") || d.label?.key?.toLowerCase().includes("correo"),
        )
        return emailDetail ? { id: p.id, name: p.name, email: emailDetail.value } : null
      })
      .filter((c): c is ContactResult => c !== null && !exclude.includes(c.email))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...picked.filter((f) => !existing.has(f.name))]
    })
    e.target.value = ""
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const canSend = to.length > 0 && !sending

  async function handleSend() {
    if (!canSend) return
    setSending(true)

    const t0 = performance.now()
    notify.info({ title: "Enviando cotización…", description: `Preparando "${quotationName}".` })
    console.log(`[send] inicio — id=${quotationId} to=${to.length} pdf=${includePdf} archivos=${files.length}`)

    try {
      const tPrep = performance.now()

      const [pdfResult, ...fileBase64s] = await Promise.all([
        includePdf
          ? generatePdfBase64(quotationId).then((b64) => {
              console.log(`[send] PDF listo → ${(performance.now() - tPrep).toFixed(0)}ms (~${Math.round(b64.length * 0.75 / 1024)} KB)`)
              return b64
            })
          : Promise.resolve(undefined),
        ...files.map((f) =>
          fileToBase64(f).then((b64) => {
            console.log(`[send] archivo "${f.name}" (${formatBytes(f.size)}) → base64 listo`)
            return b64
          }),
        ),
      ])

      console.log(`[send] preparación total → ${(performance.now() - tPrep).toFixed(0)}ms`)

      const attachments = files.map((f, i) => ({
        filename: f.name,
        content:  fileBase64s[i],
        type:     f.type || "application/octet-stream",
      }))

      await quotationService.sendEmail(quotationId, {
        to:          to.map((c) => c.email),
        cc:  cc.length  > 0 ? cc.map((c) => c.email)  : undefined,
        bcc: bcc.length > 0 ? bcc.map((c) => c.email) : undefined,
        pdfBase64:   pdfResult ?? undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      console.log(`[send] TOTAL → ${(performance.now() - t0).toFixed(0)}ms`)

      notify.success({
        title:       "Correo enviado",
        description: `Cotización enviada a ${to.length} destinatario(s).`,
      })
      onOpenChange(false)
    } catch {
      notify.error({
        title:       "No se pudo enviar",
        description: "Verifica los destinatarios e intenta de nuevo.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 520, padding: 0, gap: 0 }}
        className="flex w-full! flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="space-y-0.5">
            <SheetTitle className="flex items-center gap-2">
              <MailIcon className="size-4 text-muted-foreground" />
              Enviar Cotización
            </SheetTitle>
            <SheetDescription>
              Envía la cotización a más personas por correo electrónico.
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">

          {/* Para */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium tracking-wider text-muted-foreground">Para</Label>
              <div className="flex items-center gap-3 text-xs">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    +CC
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    +CCO
                  </button>
                )}
              </div>
            </div>
            <EmailChipInput chips={to} onChange={setTo} onSearch={searchContacts} />
          </div>

          {/* CC */}
          {showCc && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium tracking-wider text-muted-foreground">CC</Label>
                <button
                  type="button"
                  onClick={() => { setShowCc(false); setCc([]) }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
              <EmailChipInput chips={cc} onChange={setCc} onSearch={searchContacts} />
            </div>
          )}

          {/* CCO */}
          {showBcc && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium tracking-wider text-muted-foreground">CCO</Label>
                <button
                  type="button"
                  onClick={() => { setShowBcc(false); setBcc([]) }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
              <EmailChipInput chips={bcc} onChange={setBcc} onSearch={searchContacts} />
            </div>
          )}

          <div className="border-t" />

          {/* Adjuntos */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wider text-muted-foreground">Adjuntos</p>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/30">
              <Checkbox
                checked={includePdf}
                onCheckedChange={(v) => setIncludePdf(!!v)}
              />
              <div className="flex min-w-0 items-center gap-2">
                <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">PDF de cotización</p>
                  <p className="truncate text-xs text-muted-foreground">Se genera automáticamente al enviar</p>
                </div>
              </div>
            </label>

            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            ))}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <PlusIcon className="size-4 shrink-0" />
              Adjuntar otro archivo
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            El contenido y diseño del correo es gestionado automáticamente por el sistema.
          </p>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canSend} onClick={handleSend}>
            {sending
              ? <><LoaderCircleIcon className="size-4 animate-spin" /> Enviando...</>
              : <><SendIcon className="size-4" /> Enviar correo</>
            }
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}
