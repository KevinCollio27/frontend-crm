"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  HeadphonesIcon,
  ImageIcon,
  Link2Icon,
  PaperclipIcon,
  RocketIcon,
  SearchIcon,
  SendIcon,
  SmileIcon,
  XIcon,
} from "lucide-react"
import { useSessionStore } from "@/store/session.store"

// ─── Config ───────────────────────────────────────────────────────────────────

const TOOLBAR_BUTTONS = [
  { icon: <SmileIcon      className="size-4" />, label: "Emoji"  },
  { icon: <Link2Icon      className="size-4" />, label: "Enlace" },
  { icon: <SearchIcon     className="size-4" />, label: "Buscar" },
  { icon: <HeadphonesIcon className="size-4" />, label: "Audio"  },
]

// ─── Composer ─────────────────────────────────────────────────────────────────

interface ComposerProps {
  senderLabel:  string
  contactPhone: string | null
}

function WspComposer({ senderLabel, contactPhone }: ComposerProps) {
  const [recipients, setRecipients]         = React.useState<string[]>(contactPhone ? [contactPhone] : [])
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
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">

      {/* Próximamente overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-[2px]">
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
          <RocketIcon className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">¡Próximamente!</span>
        </div>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Estamos trabajando en esta funcionalidad. ¡Disponible a la brevedad!
        </p>
      </div>

      {/* De */}
      <div className="flex items-center gap-2.5 border-b px-3.5 py-2">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">De:</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          <div className="size-1.5 shrink-0 rounded-full bg-[#25D366]" />
          {senderLabel}
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
            <div className="size-1.5 shrink-0 rounded-full bg-[#25D366]" />
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
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Agregar número..."
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
          <Button key={label} variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
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
        <Button size="sm" className="ml-auto h-7 gap-1.5 bg-[#25D366] px-4 text-xs text-white hover:bg-[#20b857]">
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
    <div className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
      <svg viewBox="0 0 10 10" fill="white" className="size-2.5">
        <path d="M8.5 1.5a4.5 4.5 0 1 0-1 7.2L9.5 9.5l-.8-2A4.5 4.5 0 0 0 8.5 1.5z" />
      </svg>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contactId:    number
  contactPhone: string | null
}

export function WhatsAppTab({ contactId: _, contactPhone }: Props) {
  const user = useSessionStore((s) => s.user)
  const workspaceName = user?.user_workspace?.[0]?.workspace?.name ?? "Workspace"
  const senderLabel   = `+56 9 XXXX XXXX (${workspaceName})`

  return (
    <div className="flex flex-col gap-4 p-4">
      <WspComposer senderLabel={senderLabel} contactPhone={contactPhone} />
    </div>
  )
}
