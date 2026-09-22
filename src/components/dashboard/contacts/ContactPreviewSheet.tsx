"use client"

import * as React from "react"
import {
  Building2Icon,
  CopyIcon,
  MailIcon,
  MessageCircleIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { SourceBadge } from "@/components/ui/source-badge"
import { TagBadgeList } from "@/components/ui/tag-badge"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { cn } from "@/lib/utils"
import { NotasTab } from "./detail/tabs/NotasTab"
import { InteresesTab } from "./detail/tabs/InteresesTab"
import { HistorialTab } from "./detail/tabs/HistorialTab"
import { OportunidadesTab } from "./detail/tabs/OportunidadesTab"
import { SeguimientoMktTab } from "./detail/tabs/SeguimientoMktTab"
import type { Contact } from "./ContactsTable"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFlag = (code: string) =>
  code.toUpperCase().split("").map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("")

const countryNames: Record<string, string> = {
  CL: "Chile", AR: "Argentina", CO: "Colombia", PE: "Perú", MX: "México",
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type PreviewTab = "general" | "notas" | "intereses" | "historial" | "seguimiento" | "oportunidades"

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "general",       label: "General"      },
  { id: "notas",         label: "Notas"        },
  { id: "intereses",     label: "Intereses"    },
  { id: "historial",     label: "Historial"    },
  { id: "seguimiento",   label: "Seguimiento"  },
  { id: "oportunidades", label: "Oportunidades" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewDetails?: () => void
  onDelete?: (contact: Contact) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactPreviewSheet({ contact, open, onOpenChange, onViewDetails, onDelete }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 640, padding: 0, gap: 0 }} className="w-full!">
        {open && contact && (
          <ContactPreviewBody
            contact={contact}
            onClose={() => onOpenChange(false)}
            onViewDetails={onViewDetails}
            onDelete={onDelete}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function ContactPreviewBody({ contact, onClose, onViewDetails, onDelete }: {
  contact: Contact
  onClose: () => void
  onViewDetails?: () => void
  onDelete?: (contact: Contact) => void
}) {
  const [tab, setTab] = React.useState<PreviewTab>("general")
  const [copied, setCopied] = React.useState<"email" | "phone" | null>(null)

  const hasEmail = Boolean(contact.email)
  const hasPhone = Boolean(contact.phone)
  const hasOrg   = contact.org !== "No Aplica" && contact.org !== "Sin organización"
  const whatsappUrl = hasPhone ? `https://wa.me/${contact.phone.replace(/\D/g, "")}` : null

  function copy(text: string, type: "email" | "phone") {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-11 shrink-0">
              <AvatarImage src="https://github.com/shadcn.png" alt={contact.name} />
              <AvatarFallback className="text-sm font-medium">{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <SheetTitle className="truncate text-base leading-snug">{contact.name}</SheetTitle>
              <SheetDescription className="sr-only">Vista previa del contacto</SheetDescription>
              <p className="truncate text-xs text-muted-foreground">
                {contact.email || "Sin correo"}{contact.phone ? ` · ${contact.phone}` : ""}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>

        {contact.tags.length > 0 && <TagBadgeList tags={contact.tags} max={4} />}

        <div className="flex gap-1 overflow-x-auto rounded-lg border p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "general" && (
          <>
            <section className="border-b p-4 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Email</span>
                {hasEmail ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{contact.email}</span>
                    <button onClick={() => copy(contact.email, "email")} className="text-muted-foreground hover:text-foreground transition-colors" title="Copiar email">
                      <CopyIcon className={cn("size-3.5", copied === "email" && "text-emerald-500")} />
                    </button>
                    <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-blue-600 transition-colors" title="Abrir correo">
                      <MailIcon className="size-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No Aplica</span>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Teléfono</span>
                {hasPhone ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{contact.phone}</span>
                    <button onClick={() => copy(contact.phone, "phone")} className="text-muted-foreground hover:text-foreground transition-colors" title="Copiar teléfono">
                      <CopyIcon className={cn("size-3.5", copied === "phone" && "text-emerald-500")} />
                    </button>
                    <a href={whatsappUrl!} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-600 transition-colors" title="Abrir WhatsApp">
                      <MessageCircleIcon className="size-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No Aplica</span>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">País</span>
                <span className="text-sm">{getFlag(contact.country)} {countryNames[contact.country] ?? contact.country}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Fuente</span>
                <SourceBadge contactSource={contact.contactSource} origin={contact.origin} />
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Miembro desde</span>
                <span className="text-sm">
                  {new Date(contact.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </section>

            <section className="p-4 space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Building2Icon className="size-3.5" /> Organización
              </h3>
              {hasOrg ? (
                <div className="flex items-stretch gap-2.5 px-3 py-2.5 bg-muted/50 rounded-lg">
                  {contact.orgId !== null && <EntityAccentBar seed={contact.orgId} />}
                  <span className="self-center text-sm font-medium">{contact.org}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center px-3 py-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Sin organización asociada</p>
                </div>
              )}
            </section>
          </>
        )}

        {tab === "notas"         && <NotasTab contactId={contact.id} />}
        {tab === "intereses"     && <InteresesTab contactId={contact.id} />}
        {tab === "historial"     && <HistorialTab contactId={contact.id} />}
        {tab === "seguimiento"   && <SeguimientoMktTab contactId={contact.id} />}
        {tab === "oportunidades" && <OportunidadesTab contactId={contact.id} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-4 py-3 shrink-0">
        <Button variant="outline" className="text-xs h-8" onClick={onViewDetails}>
          Ver Detalles
        </Button>
        <Button
          variant="outline"
          className="text-xs h-8 bg-red-50 text-red-500 border-red-100 hover:bg-red-100 hover:text-red-600 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/50"
          onClick={() => onDelete?.(contact)}
        >
          <Trash2Icon className="size-3.5" /> Eliminar
        </Button>
      </div>
    </div>
  )
}
