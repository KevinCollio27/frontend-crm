"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Mail, Folder } from "./data"

const FOLDER_LABELS: Record<Folder, string> = {
  inbox: "Bandeja de entrada",
  drafts: "Borradores",
  sent: "Enviado",
  junk: "Correo no deseado",
  trash: "Eliminados",
  archive: "Archivo",
}

interface MailListProps {
  folder: Folder
  mails: Mail[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function MailList({ folder, mails, selectedId, onSelect }: MailListProps) {
  const [search, setSearch] = React.useState("")
  const [tab, setTab] = React.useState<"all" | "unread">("all")

  const filtered = mails.filter((m) => {
    if (tab === "unread" && m.read) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.text.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <h2 className="flex-1 text-base font-semibold">{FOLDER_LABELS[folder]}</h2>
        <div className="flex overflow-hidden rounded-lg border text-xs">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={cn(
              "px-2.5 py-1 transition-colors",
              tab === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Todo
          </button>
          <button
            type="button"
            onClick={() => setTab("unread")}
            className={cn(
              "px-2.5 py-1 transition-colors",
              tab === "unread"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            No leídos
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
        ) : (
          filtered.map((mail) => (
            <button
              key={mail.id}
              type="button"
              onClick={() => onSelect(mail.id)}
              className={cn(
                "flex w-full flex-col gap-1 border-b px-4 py-2.5 text-left transition-colors last:border-0",
                selectedId === mail.id ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              {/* Name + date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {!mail.read && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <span className={cn("truncate text-sm", !mail.read ? "font-semibold" : "font-medium")}>
                    {mail.name}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(mail.date), { locale: es })}
                </span>
              </div>

              {/* Subject */}
              <p className={cn("truncate text-sm", !mail.read ? "font-medium" : "text-muted-foreground")}>
                {mail.subject}
              </p>

              {/* Preview */}
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {mail.text}
              </p>

              {/* Labels */}
              {mail.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {mail.labels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="rounded-full px-2 py-0 text-[0.65rem]"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
