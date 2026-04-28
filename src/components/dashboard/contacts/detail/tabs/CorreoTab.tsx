"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  BoldIcon,
  ChevronDownIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MailIcon,
  MailOpenIcon,
  PaperclipIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  UnderlineIcon,
  XIcon,
} from "lucide-react"
import type { ContactDetail, ContactEmailStatus } from "../../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContactEmailStatus, { label: string; className: string }> = {
  enviado:  { label: "Enviado",  className: "bg-blue-50 text-blue-700"       },
  recibido: { label: "Recibido", className: "bg-emerald-50 text-emerald-700" },
}

const SENDER_OPTIONS = [
  "vendedor@camiontrucks.cl",
  "kevin@camiontrucks.cl",
]

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

// ─── Composer ─────────────────────────────────────────────────────────────────

function EmailComposer() {
  const [sender, setSender]             = React.useState(SENDER_OPTIONS[0])
  const [recipients, setRecipients]     = React.useState<string[]>(["cliente@empresa.cl"])
  const [recipientInput, setRecipientInput] = React.useState("")

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

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">

      {/* De */}
      <div className="flex items-center gap-2.5 border-b px-3.5 py-2.5">
        <span className="w-11 shrink-0 text-xs font-medium text-muted-foreground">De:</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-1 text-sm text-foreground outline-none hover:opacity-70" />
            }
          >
            {sender}
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            {SENDER_OPTIONS.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setSender(s)}>
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Para */}
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 border-b px-3.5 py-2">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">Para:</span>
        {recipients.map((r) => (
          <span
            key={r}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
          >
            {r}
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
        />
      </div>

      {/* Template toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b px-3.5 py-2">
        {(["Plantilla", "Insertar campo", "Reunión"] as const).map((label) => (
          <DropdownMenu key={label}>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-xs" />
              }
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
          className="ml-auto h-7 gap-1.5 bg-violet-600 px-3 text-xs text-white hover:bg-violet-700"
        >
          <SparklesIcon className="size-3.5" />
          Redactar con IA
        </Button>
      </div>

      {/* Body */}
      <textarea
        className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        rows={5}
        placeholder="Escribe tu mensaje aquí..."
      />

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 border-t px-3 py-1.5">
        {FORMAT_BUTTONS.map(({ icon, label }) => (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            {icon}
          </Button>
        ))}
        <div className="mx-1.5 h-4 w-px bg-border" />
        {LIST_BUTTONS.map(({ icon, label }) => (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            {icon}
          </Button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3.5 py-2.5">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <PaperclipIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-500"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
        <Button
          size="sm"
          variant= "default"
          className="h-8 gap-1.5 px-4 text-xs"
        >
          <SendIcon className="size-3.5" />
          Enviar
        </Button>
      </div>

    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contact: ContactDetail
}

export function CorreoTab({ contact }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">

      <EmailComposer />

      {contact.emails.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Correos recientes
          </p>
          {contact.emails.map((email) => {
            const conf = STATUS_CONFIG[email.status]
            return (
              <div key={email.id} className="rounded-xl border bg-card p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {email.status === "enviado"
                      ? <MailIcon className="size-4 shrink-0 text-blue-500" />
                      : <MailOpenIcon className="size-4 shrink-0 text-emerald-500" />
                    }
                    <p className="truncate text-sm font-medium">{email.subject}</p>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 rounded-full border-0 px-2.5 py-0.5 text-xs",
                      conf.className,
                    )}
                  >
                    {conf.label}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {email.status === "enviado" ? `Para: ${email.to}` : `De: ${email.from}`}
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {email.preview}
                </p>
                <p className="mt-2.5 text-xs text-muted-foreground">{email.sentAt}</p>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
