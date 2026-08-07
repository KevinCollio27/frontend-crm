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
import { BadgeCheck, CheckIcon, ChevronDownIcon, CopyIcon, GlobeIcon } from "lucide-react"
import type { OrgDetailData } from "@/types/organization"

// ─── Brand icons (SVG inline, same as CreateOrganizationSheet) ────────────────

type IconProps = { className?: string; style?: React.CSSProperties }

function LinkedInIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
function InstagramIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}
function XNetworkIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}
function FacebookIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlagEmoji(code: string) {
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join("")
}

function normalizeUrl(raw: string): string | null {
  const url = raw.trim()
  if (!url || !/\w+\.\w{2,}/.test(url)) return null
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
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
        : <CopyIcon className="size-3.5" />}
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
  data: OrgDetailData
}

export function Col1Info({ data }: Props) {
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const origin = data.contact_source ?? data.origin ?? "CRM"

  const hasSocials =
    !!data.linkedin_url  ||
    !!data.instagram_url ||
    !!data.twitter_url   ||
    !!data.facebook_url

  const createdAt = data.created_at
    ? new Date(data.created_at).toLocaleDateString("es-CL", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—"

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Identidad ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 p-3.5">
          <div className="relative">
            <Avatar className="default shrink-0">
              <AvatarImage src="https://github.com/shadcn.png" alt={data.name} />
              <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug">{data.name}</p>
            {data.industry && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{data.industry}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Propiedades ───────────────────────────────────────────────────── */}
      <CollapsibleSection title="Propiedades de la organización">
        <div className="divide-y">

          {data.document_number && (
            <PropRow label="RUT">
              <span className="truncate text-sm font-medium">{data.document_number}</span>
              <CopyButton value={data.document_number} />
            </PropRow>
          )}

          {data.industry && (
            <PropRow label="Industria">
              <span className="truncate text-sm font-medium">{data.industry}</span>
            </PropRow>
          )}

          {data.web_page && (() => {
            const href = normalizeUrl(data.web_page!)
            return (
              <PropRow label="Sitio web">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 truncate text-sm font-medium text-blue-500 hover:underline"
                  >
                    <GlobeIcon className="size-3.5 shrink-0" />
                    {data.web_page}
                  </a>
                ) : (
                  <span className="truncate text-sm font-medium text-muted-foreground">{data.web_page}</span>
                )}
              </PropRow>
            )
          })()}

          <PropRow label="País">
            <span className="text-sm font-medium">
              {getFlagEmoji(data.pais_origen)} {data.pais_origen}
            </span>
          </PropRow>

          <PropRow label="Origen">
            <span className="text-sm font-medium">{data.origin}</span>
          </PropRow>

          <PropRow label="Propietario">
            {data.owner ? (
              <>
                <Avatar size="sm">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="text-base">
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{data.owner.name}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Sin asignar</span>
            )}
          </PropRow>

          <PropRow label="Creado">
            <span className="text-sm font-medium">{createdAt}</span>
          </PropRow>

        </div>
      </CollapsibleSection>

      {/* ── Redes sociales ───────────────────────────────────────────────── */}
      {hasSocials && (
        <CollapsibleSection title="Redes sociales">
          <div className="divide-y">
            {data.linkedin_url && (
              <PropRow label="LinkedIn">
                <a href={normalizeUrl(data.linkedin_url) ?? "#"} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: "#0077B5" }}>
                  <LinkedInIcon className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {data.instagram_url && (
              <PropRow label="Instagram">
                <a href={normalizeUrl(data.instagram_url) ?? "#"} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: "#E1306C" }}>
                  <InstagramIcon className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {data.twitter_url && (
              <PropRow label="Twitter / X">
                <a href={normalizeUrl(data.twitter_url) ?? "#"} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">
                  <XNetworkIcon className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
            {data.facebook_url && (
              <PropRow label="Facebook">
                <a href={normalizeUrl(data.facebook_url) ?? "#"} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: "#1877F2" }}>
                  <FacebookIcon className="size-3.5 shrink-0" /> Ver perfil
                </a>
              </PropRow>
            )}
          </div>
        </CollapsibleSection>
      )}

    </div>
  )
}
