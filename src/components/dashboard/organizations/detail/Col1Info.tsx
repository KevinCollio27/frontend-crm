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
  GlobeIcon,
  HashIcon,
} from "lucide-react"
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6"
import type { OrganizationDetail } from "../data"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlagEmoji(code: string) {
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join("")
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
  organization: OrganizationDetail
}

export function Col1Info({ organization }: Props) {
  const initials = organization.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const hasSocials =
    !!organization.linkedin_url  ||
    !!organization.instagram_url ||
    !!organization.twitter_url   ||
    !!organization.facebook_url

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Identidad ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 p-3.5">
          <Avatar className="size-12 shrink-0">
            <AvatarImage src="/images/avatar-org.svg" alt={organization.name} />
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{organization.name}</p>
            {organization.industry && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{organization.industry}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge className={cn(
                "rounded-full border-0 px-2.5 py-0.5 text-xs",
                organization.origin === "CRM"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-emerald-50 text-emerald-700"
              )}>
                {organization.origin}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Propiedades ───────────────────────────────────────────────────── */}
      <CollapsibleSection title="Propiedades de la organización">
        <div className="divide-y">

          {organization.document_number && (
            <PropRow label="RUT">
              <span className="truncate text-sm font-medium">{organization.document_number}</span>
              <CopyButton value={organization.document_number} />
            </PropRow>
          )}

          {organization.industry && (
            <PropRow label="Industria">
              <span className="truncate text-sm font-medium">{organization.industry}</span>
            </PropRow>
          )}

          {organization.web_page && (
            <PropRow label="Sitio web">
              <a
                href={`https://${organization.web_page.replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 truncate text-sm font-medium text-blue-500 hover:underline"
              >
                <GlobeIcon className="size-3.5 shrink-0" />
                {organization.web_page}
              </a>
            </PropRow>
          )}

          <PropRow label="País">
            <span className="text-sm font-medium">
              {getFlagEmoji(organization.country_code)} {organization.country_code}
            </span>
          </PropRow>

          <PropRow label="Origen">
            <span className="text-sm font-medium">{organization.origin}</span>
          </PropRow>

          <PropRow label="Propietario">
            <Avatar className="size-5 shrink-0">
              <AvatarImage src={organization.owner.avatar} alt={organization.owner.name} />
              <AvatarFallback className="text-[9px] font-semibold">{organization.owner.initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{organization.owner.name}</span>
          </PropRow>

          <PropRow label="Creado">
            <span className="text-sm font-medium">{organization.created_at}</span>
          </PropRow>

        </div>
      </CollapsibleSection>

      {/* ── Redes sociales ───────────────────────────────────────────────── */}
      {hasSocials && (
        <CollapsibleSection title="Redes sociales">
          <div className="divide-y">
            {organization.linkedin_url && (
              <PropRow label="LinkedIn">
                <a href={organization.linkedin_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
                  <FaLinkedinIn className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {organization.instagram_url && (
              <PropRow label="Instagram">
                <a href={organization.instagram_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-pink-500 hover:underline">
                  <FaInstagram className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {organization.twitter_url && (
              <PropRow label="Twitter / X">
                <a href={organization.twitter_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">
                  <FaXTwitter className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {organization.facebook_url && (
              <PropRow label="Facebook">
                <a href={organization.facebook_url} target="_blank" rel="noreferrer"
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
