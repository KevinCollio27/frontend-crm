"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowUpRightIcon,
  BadgeCheck,
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  GlobeIcon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  TrophyIcon,
  XCircleIcon,
} from "lucide-react"
import type { DealDetail } from "../data"

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

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

function CollapsibleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
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
  deal: DealDetail
}

export function Col3Related({ deal }: Props) {
  const netCost = deal.products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Valor del negocio ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Valor del negocio
          </span>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{formatCLP(netCost)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {deal.currency} · {deal.products.length} producto{deal.products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 border-t px-3.5 pb-3.5 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 gap-1.5 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <TrophyIcon className="size-3.5" />
            Ganada
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-600"
          >
            <XCircleIcon className="size-3.5" />
            Perdida
          </Button>
        </div>
      </div>

      {/* ── Contacto ──────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Contacto">
        <div className="p-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src="/images/avatar-contact.svg" alt={deal.person.name} />
                <AvatarFallback>{deal.person.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
              </Avatar>
              <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{deal.person.name}</p>
              <p className="truncate text-xs text-muted-foreground">{deal.person.position}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" className="size-7">
                <MailIcon className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7">
                <PhoneIcon className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="mt-2 divide-y border-t">
            <div className="flex items-center gap-3 py-2.5">
              <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-blue-500">{deal.person.email}</p>
                {deal.person.email_type && (
                  <p className="text-xs text-muted-foreground">{deal.person.email_type}</p>
                )}
              </div>
              <CopyButton value={deal.person.email} />
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{deal.person.phone}</p>
                {deal.person.phone_type && (
                  <p className="text-xs text-muted-foreground">{deal.person.phone_type}</p>
                )}
              </div>
              <a
                href={`https://wa.me/${deal.person.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-green-500 transition-colors hover:text-[#25D366]"
              >
                <MessageCircleIcon className="size-3.5" />
              </a>
            </div>
            {deal.person.country_code && (
              <div className="flex items-center gap-3 py-2.5">
                <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {getFlagEmoji(deal.person.country_code)}{" "}
                    {deal.person.country_code}
                  </p>
                  <p className="text-xs text-muted-foreground">País</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Empresa ───────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Empresa">
        <div className="p-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src="/images/avatar-org.svg" alt={deal.organization.name} />
                <AvatarFallback>{deal.organization.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
              </Avatar>
              <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{deal.organization.name}</p>
              <p className="truncate text-xs text-muted-foreground">{deal.organization.industry}</p>
            </div>
          </div>
          <div className="mt-2 divide-y border-t">
            <div className="flex items-center gap-3 py-2.5">
              <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{deal.organization.taxId}</p>
                {deal.organization.taxId && (
                  <p className="text-xs text-muted-foreground">RUT Empresa</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-blue-500">{deal.organization.website}</p>
                {deal.organization.website && (
                  <p className="text-xs text-muted-foreground">Sitio web</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
