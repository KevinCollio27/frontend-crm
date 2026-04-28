"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  MailIcon,
  MessageCircleIcon,
} from "lucide-react"
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6"
import type { ContactDetail } from "../data"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlagEmoji(code: string) {
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join("")
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-")
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handleCopy} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
      {copied
        ? <CheckIcon className="size-3.5 text-emerald-500" />
        : <CopyIcon className="size-3.5" />
      }
    </button>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-3 transition-colors hover:bg-muted/30">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center justify-end gap-1.5">{children}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contact: ContactDetail
}

export function Col1Info({ contact }: Props) {
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const hasSocials =
    !!contact.linkedin_url  ||
    !!contact.instagram_url ||
    !!contact.twitter_url   ||
    !!contact.facebook_url

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Identidad ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 p-3.5">
          <Avatar className="size-12 shrink-0">
            <AvatarImage src="/images/avatar-contact.svg" alt={contact.name} />
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{contact.name}</p>
            {contact.internal_position && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{contact.internal_position}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              {contact.organization && (
                <Badge className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {contact.organization.name}
                </Badge>
              )}
              <Badge className={cn(
                "rounded-full border-0 px-2.5 py-0.5 text-xs",
                contact.origin === "CRM"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-emerald-50 text-emerald-700"
              )}>
                {contact.origin}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Propiedades del contacto ──────────────────────────────────────── */}
      <CollapsibleSection title="Propiedades del contacto">
        <div className="divide-y">

          {contact.email && (
            <PropRow label="Email">
              <span className="truncate text-sm font-medium text-blue-500">{contact.email}</span>
              <CopyButton value={contact.email} />
              <a href={`mailto:${contact.email}`} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                <MailIcon className="size-3.5" />
              </a>
            </PropRow>
          )}

          {contact.phone && (
            <PropRow label="Teléfono">
              <span className="text-sm font-medium">{contact.phone}</span>
              <CopyButton value={contact.phone} />
              <a
                href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-green-500 transition-colors hover:text-[#25D366]"
              >
                <MessageCircleIcon className="size-3.5" />
              </a>
            </PropRow>
          )}

          <PropRow label="País">
            <span className="text-sm font-medium">
              {getFlagEmoji(contact.country_code)} {contact.country_code}
            </span>
          </PropRow>

          {contact.internal_position && (
            <PropRow label="Cargo">
              <span className="truncate text-sm font-medium">{contact.internal_position}</span>
            </PropRow>
          )}

          <PropRow label="Origen">
            <span className="text-sm font-medium">{contact.origin}</span>
          </PropRow>

          {contact.contact_source && (
            <PropRow label="Fuente">
              <span className="text-sm font-medium">{contact.contact_source}</span>
            </PropRow>
          )}

          <PropRow label="Propietario">
            <Avatar className="size-5 shrink-0">
                <AvatarImage src="/images/avatar-contact.svg" alt={contact.name} />
                <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{contact.owner.name}</span>
          </PropRow>

          {contact.birth_date && (
            <PropRow label="Nacimiento">
              <span className="text-sm font-medium">{formatDate(contact.birth_date)}</span>
            </PropRow>
          )}

          <PropRow label="Creado">
            <span className="text-sm font-medium">{contact.created_at}</span>
          </PropRow>

        </div>
      </CollapsibleSection>

      {/* ── Redes sociales ───────────────────────────────────────────────── */}
      {hasSocials && (
        <CollapsibleSection title="Redes sociales">
          <div className="divide-y">
            {contact.linkedin_url && (
              <PropRow label="LinkedIn">
                <a href={contact.linkedin_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
                  <FaLinkedinIn className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {contact.instagram_url && (
              <PropRow label="Instagram">
                <a href={contact.instagram_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-pink-500 hover:underline">
                  <FaInstagram className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {contact.twitter_url && (
              <PropRow label="Twitter / X">
                <a href={contact.twitter_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">
                  <FaXTwitter className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {contact.facebook_url && (
              <PropRow label="Facebook">
                <a href={contact.facebook_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:underline">
                  <FaFacebookF className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
          </div>
        </CollapsibleSection>
      )}

    </div>
  )
}
