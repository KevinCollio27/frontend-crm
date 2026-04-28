"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ActivityIcon,
  BadgeCheck,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  GlobeIcon,
  HashIcon,
  TrendingUpIcon,
} from "lucide-react"
import type { ContactDetail } from "../data"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
    >
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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contact: ContactDetail
}

export function Col3Related({ contact }: Props) {
  const totalValue = contact.opportunities.reduce((sum, o) => sum + o.value, 0)
  const openCount  = contact.opportunities.filter((o) => o.status === "open").length
  const wonCount   = contact.opportunities.filter((o) => o.status === "won").length

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Resumen ───────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resumen
          </span>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{formatCLP(totalValue)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Valor total · {contact.opportunities.length} oportunidad{contact.opportunities.length !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x border-t">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUpIcon className="size-3.5" />
              <span className="text-base font-bold">{openCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Abiertas</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-emerald-600">
              <HashIcon className="size-3.5" />
              <span className="text-base font-bold">{wonCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ganadas</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-indigo-600">
              <ActivityIcon className="size-3.5" />
              <span className="text-base font-bold">{contact.activities.length}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Actividades</span>
          </div>
        </div>
      </div>

      {/* ── Organización ──────────────────────────────────────────────────── */}
      {contact.organization && (
        <CollapsibleSection title="Organización">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="/images/avatar-org.svg" alt={contact.organization.name} />
                  <AvatarFallback>
                    {contact.organization.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{contact.organization.name}</p>
                {contact.organization.industry && (
                  <p className="truncate text-xs text-muted-foreground">{contact.organization.industry}</p>
                )}
              </div>
            </div>

            <div className="mt-2 divide-y border-t">
              {contact.organization.taxId && (
                <div className="flex items-center gap-3 py-2.5">
                  <HashIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{contact.organization.taxId}</p>
                    <p className="text-xs text-muted-foreground">RUT Empresa</p>
                  </div>
                  <CopyButton value={contact.organization.taxId} />
                </div>
              )}
              {contact.organization.website && (
                <div className="flex items-center gap-3 py-2.5">
                  <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-blue-500">{contact.organization.website}</p>
                    <p className="text-xs text-muted-foreground">Sitio web</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

    </div>
  )
}
