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
  ChevronDownIcon,
  HeadphonesIcon,
  ImageIcon,
  Link2Icon,
  PaperclipIcon,
  SearchIcon,
  SendIcon,
  SmileIcon,
  XIcon,
} from "lucide-react"
import type { DealDetail, WspMessageStatus } from "../../data"

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<WspMessageStatus, { label: string; className: string }> = {
  enviado:   { label: "Enviado",   className: "bg-emerald-50 text-emerald-700"  },
  recibido:  { label: "Recibido",  className: "bg-blue-50 text-blue-700"        },
  plantilla: { label: "Plantilla", className: "bg-violet-50 text-violet-700"    },
}

const WORKSPACE_NUMBERS = [
  "+56 9 8765 4321 (CamionTrucks)",
]

const TOOLBAR_BUTTONS = [
  { icon: <SmileIcon      className="size-4" />, label: "Emoji"     },
  { icon: <Link2Icon      className="size-4" />, label: "Enlace"    },
  { icon: <SearchIcon     className="size-4" />, label: "Buscar"    },
  { icon: <HeadphonesIcon className="size-4" />, label: "Audio"     },
]

// ─── Composer ─────────────────────────────────────────────────────────────────

function WspComposer({ contactPhone }: { contactPhone: string }) {
  const [sender, setSender]                 = React.useState(WORKSPACE_NUMBERS[0])
  const [recipients, setRecipients]         = React.useState<string[]>([contactPhone])
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
              <button className="flex items-center gap-1.5 text-sm text-foreground outline-none hover:opacity-70" />
            }
          >
            <div className="size-2 rounded-full bg-[#25D366]" />
            {sender}
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-60">
            {WORKSPACE_NUMBERS.map((n) => (
              <DropdownMenuItem key={n} onSelect={() => setSender(n)}>
                <div className="size-2 rounded-full bg-[#25D366]" />
                {n}
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
            className="flex items-center gap-1 rounded-full bg-[#e9fbe9] px-2.5 py-0.5 text-xs font-medium text-[#1a7a1a]"
          >
            <div className="size-1.5 rounded-full bg-[#25D366]" />
            {r}
            <button
              onClick={() => removeRecipient(r)}
              className="text-[#1a7a1a]/60 hover:text-[#1a7a1a]"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Agregar destinatario..."
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          onKeyDown={handleRecipientKeyDown}
        />
      </div>

      {/* Body */}
      <textarea
        className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        rows={4}
        placeholder="Escribe tu mensaje aquí..."
      />

      {/* Mini toolbar */}
      <div className="flex items-center gap-0.5 border-t px-3 py-1.5">
        {TOOLBAR_BUTTONS.map(({ icon, label }) => (
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

      {/* Actions footer */}
      <div className="flex items-center gap-2 border-t px-3.5 py-2.5">
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
          <SendIcon className="size-3" />
          Plantilla
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
          <PaperclipIcon className="size-3" />
          Adjuntar
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
          <ImageIcon className="size-3" />
          Imagen
        </Button>
        <Button
          size="sm"
          className="ml-auto h-7 gap-1.5 bg-[#25D366] px-4 text-xs text-white hover:bg-[#20b857]"
        >
          <SendIcon className="size-3" />
          Enviar
        </Button>
      </div>

    </div>
  )
}

// ─── WhatsApp icon ─────────────────────────────────────────────────────────────

function WspIcon() {
  return (
    <div className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#25D366]">
      <svg viewBox="0 0 10 10" fill="white" className="size-2.5">
        <path d="M8.5 1.5a4.5 4.5 0 1 0-1 7.2L9.5 9.5l-.8-2A4.5 4.5 0 0 0 8.5 1.5z" />
      </svg>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  deal: DealDetail
}

export function WhatsAppTab({ deal }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">

      <WspComposer contactPhone={deal.person.phone} />

      {deal.whatsappMessages.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mensajes recientes
          </p>
          {deal.whatsappMessages.map((msg) => {
            const conf = STATUS_CONFIG[msg.status]
            return (
              <div key={msg.id} className="rounded-xl border bg-card p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <WspIcon />
                    <p className="truncate text-sm font-medium">{msg.subject}</p>
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
                  {msg.status === "recibido"
                    ? `De: ${msg.from}`
                    : `Para: ${msg.to}`
                  }
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {msg.preview}
                </p>
                <p className="mt-2.5 text-xs text-muted-foreground">{msg.sentAt}</p>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
