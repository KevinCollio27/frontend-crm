"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArchiveIcon,
  ArchiveXIcon,
  ClockIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Mail } from "./data"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface MailDisplayProps {
  mail: Mail | undefined
}

export function MailDisplay({ mail }: MailDisplayProps) {
  const [reply, setReply] = React.useState("")
  const [muted, setMuted] = React.useState(false)

  if (!mail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <CornerUpLeftIcon className="size-8 opacity-30" />
        <p className="text-sm">Selecciona un correo para leerlo</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center border-b px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-8" title="Archivar">
            <ArchiveIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="Mover a no deseado">
            <ArchiveXIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            title="Eliminar"
          >
            <Trash2Icon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <Button variant="ghost" size="icon" className="size-8" title="Posponer">
            <ClockIcon className="size-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-8" title="Responder">
            <CornerUpLeftIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="Reenviar">
            <CornerUpRightIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <Button variant="ghost" size="icon" className="size-8">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Sender header */}
      <div className="flex items-start gap-3 border-b p-3">
        <Avatar size="default">
          <AvatarImage src="https://github.com/shadcn.png" alt={mail.name} />
          <AvatarFallback>{getInitials(mail.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">{mail.name}</p>
              <p className="truncate text-sm text-muted-foreground">{mail.subject}</p>
              <p className="text-xs text-muted-foreground">
                Responder a:{" "}
                <span className="text-foreground">{mail.email}</span>
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {format(new Date(mail.date), "d MMM yyyy, HH:mm", { locale: es })}
            </time>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{mail.text}</p>
      </div>

      {/* Reply area */}
      <div className="border-t p-3 space-y-2">
        <Textarea
          placeholder={`Responder a ${mail.name}...`}
          className="min-h-24 resize-none"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
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
          <Button size="sm">Enviar</Button>
        </div>
      </div>
    </div>
  )
}
