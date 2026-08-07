"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  BadgeCheck,
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  ChevronsUpIcon,
  CopyIcon,
  Eye,
  FileTextIcon,
  InfoIcon,
  MailIcon,
  MessageCircleIcon,
  TargetIcon,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import type { Contact } from "./ContactsTable"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFlag = (code: string) =>
  code.toUpperCase().split("").map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("")

const countryNames: Record<string, string> = {
  CL: "Chile",
  AR: "Argentina",
  CO: "Colombia",
  PE: "Perú",
  MX: "México",
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-y bg-muted/30">
      <Icon className="size-3.5 text-blue-500" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const orgDetails: Record<string, { industry: string; badge: string }> = {
  GOXT:      { industry: "Tecnología e Informática",         badge: "Alto valor" },
  CamionGO:  { industry: "Servicios de Transporte de Carga", badge: "Alto valor" },
}

const quickActions = [
  { icon: FileTextIcon,  label: "Nota",        color: "text-blue-500"    },
  { icon: TargetIcon,    label: "Desafío",      color: "text-amber-500"   },
  { icon: BriefcaseIcon, label: "Oportunidad",  color: "text-emerald-500" },
  { icon: CalendarIcon,  label: "Tarea",        color: "text-violet-500"  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewDetails?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactPreviewSheet({ contact, open, onOpenChange, onViewDetails }: Props) {
  const [copied, setCopied] = useState<"email" | "phone" | null>(null)

  if (!contact) return null

  const hasOrg    = contact.org !== "No Aplica"
  const hasEmail  = Boolean(contact.email)
  const hasPhone  = Boolean(contact.phone)

  const copy = (text: string, type: "email" | "phone") => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 1500)
  }

  const whatsappUrl = hasPhone ? `https://wa.me/${contact.phone.replace(/\D/g, "")}` : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        {/* Identity */}
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-4">
          <Avatar className="size-16 shrink-0">
            <AvatarImage src="https://github.com/shadcn.png" alt={contact.name} />
            <AvatarFallback className="text-base font-medium">
              {contact.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium">{contact.name}</span>
            <span className="truncate text-xs text-muted-foreground">{contact.email}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <SectionHeader icon={ChevronsUpIcon} label="Acciones Rápidas" />
        <div className="shrink-0 px-4 py-3 border-b">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border border-border bg-muted/50 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                <Icon className={cn("size-4", color)} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          {/* Información */}
          <SectionHeader icon={InfoIcon} label="Información General" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Email</span>
              {hasEmail ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{contact.email}</span>
                  <button onClick={() => copy(contact.email, "email")} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" title="Copiar email">
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
                  <button onClick={() => copy(contact.phone, "phone")} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" title="Copiar teléfono">
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
            <InfoRow label="País">
              {getFlag(contact.country)}{" "}
              {countryNames[contact.country] ?? contact.country}
            </InfoRow>
            <InfoRow label="Fuente">{contact.source}</InfoRow>
            <InfoRow label="Miembro desde">
              {new Date(contact.createdAt).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </InfoRow>
          </div>

          {/* Organización */}
          <SectionHeader icon={Building2Icon} label="Organización" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            {hasOrg ? (
              <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <Avatar className="size-7 shrink-0 rounded-md">
                  <AvatarImage src="https://github.com/shadcn.png" alt={contact.org} />
                  <AvatarFallback className="rounded-md text-[10px] font-medium">
                    {contact.org.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
                <div className="flex flex-col min-w-0">
                  <p className="text-xs font-medium">{contact.org}</p>
                  {orgDetails[contact.org] && (
                    <p className="text-xs text-muted-foreground">{orgDetails[contact.org].industry}</p>
                  )}
                </div>
                {orgDetails[contact.org] && (
                  <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                    {orgDetails[contact.org].badge}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center px-3 py-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Sin organización asociada</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="flex-col gap-2 border-t px-4 py-3 shrink-0">
          <Button variant="outline" className="w-full justify-start text-xs h-8" onClick={onViewDetails}>
            <Eye className="size-3.5" /> Ver Detalles
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-8 bg-red-50 text-red-500 border-red-100 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="size-3.5" /> Eliminar
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
