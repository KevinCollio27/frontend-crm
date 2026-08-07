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
import type { ContactDetailData } from "@/types/contact"
import { opportunityService } from "@/services/opportunity.service"
import type { OpportunityRaw } from "@/types/opportunity"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeUrl(raw: string): string | null {
  const url = raw.trim()
  if (!url) return null
  // Must look like a real domain (word.tld with at least 2-char TLD)
  if (!/\w+\.\w{2,}/.test(url)) return null
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
  data: ContactDetailData
}

export function Col3Related({ data }: Props) {
  const org = data.organization
  const [opps, setOpps] = React.useState<OpportunityRaw[] | null>(null)

  React.useEffect(() => {
    opportunityService
      .list({ personId: data.id, take: 100 })
      .then((page) => setOpps(page.data))
      .catch(() => setOpps([]))
  }, [data.id])

  const loading      = opps === null
  const totalValue   = opps?.reduce((sum, o) => sum + (o.opportunity_net_sales[0]?.value ?? 0), 0) ?? 0
  const openCount    = opps?.filter((o) => !o.is_won && !o.is_lost).length ?? 0
  const wonCount     = opps?.filter((o) => o.is_won).length ?? 0
  const actCount     = opps?.reduce((sum, o) => sum + o._count.opportunity_activity, 0) ?? 0
  const oppCount     = opps?.length ?? 0

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Resumen ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resumen
          </span>
          {loading ? (
            <>
              <div className="mt-1.5 h-8 w-36 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-28 animate-pulse rounded bg-muted" />
            </>
          ) : (
            <>
              <p className="mt-1.5 text-2xl font-bold tabular-nums">{formatValue(totalValue)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Valor total · {oppCount} oportunidad{oppCount !== 1 ? "es" : ""}
              </p>
            </>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x border-t">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUpIcon className="size-3.5" />
              <span className="text-base font-bold">{loading ? "—" : openCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Abiertas</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-emerald-600">
              <HashIcon className="size-3.5" />
              <span className="text-base font-bold">{loading ? "—" : wonCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ganadas</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <div className="flex items-center gap-1 text-indigo-600">
              <ActivityIcon className="size-3.5" />
              <span className="text-base font-bold">{loading ? "—" : actCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Actividades</span>
          </div>
        </div>
      </div>

      {/* ── Organización ─────────────────────────────────────────────────── */}
      {org && (
        <CollapsibleSection title="Organización">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar size="default">
                  <AvatarImage src="https://github.com/shadcn.png"/>
                  <AvatarFallback className="text-base">
                  </AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{org.name}</p>
                {org.industry && (
                  <p className="truncate text-xs text-muted-foreground">{org.industry}</p>
                )}
              </div>
            </div>

            <div className="mt-2 divide-y border-t">
              {org.taxId && (
                <div className="flex items-center gap-3 py-2.5">
                  <HashIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{org.taxId}</p>
                    <p className="text-xs text-muted-foreground">RUT Empresa</p>
                  </div>
                  <CopyButton value={org.taxId} />
                </div>
              )}
              {org.website && (() => {
                const href = normalizeUrl(org.website)
                return (
                  <div className="flex items-center gap-3 py-2.5">
                    <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-medium text-blue-500 hover:underline"
                        >
                          {org.website}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-medium text-muted-foreground">{org.website}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Sitio web</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </CollapsibleSection>
      )}

    </div>
  )
}
