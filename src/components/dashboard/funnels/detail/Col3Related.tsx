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
  BadgeCheck,
  BuildingIcon,
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
  GlobeIcon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  TrophyIcon,
  XCircleIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { opportunityService } from "@/services/opportunity.service"
import { notify } from "@/lib/notify"
import type { OpportunityDetailData } from "@/types/opportunity"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number, symbol: string) {
  const formatted = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
  if (symbol === "CLP") return formatted
  // UF se cotiza con decimales (ej. "2,5 UF") — el resto de las monedas acá se maneja
  // como monto entero.
  const maximumFractionDigits = symbol === "UF" ? 2 : 0
  return `${symbol} ${new Intl.NumberFormat("es-CL", { maximumFractionDigits }).format(value)}`
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
  data:           OpportunityDetailData
  onStatusChange: (updates: { is_won: boolean; is_lost: boolean }) => void
}

export function Col3Related({ data, onStatusChange }: Props) {
  const formattedCost = formatCurrency(data.netCost, data.currency)
  const [loading, setLoading] = React.useState(false)

  const isWon  = data.is_won
  const isLost = data.is_lost

  const personEmail = data.person_email
  const personPhone = data.person_phone
  const orgTaxId    = data.organization?.document_number ?? null
  const orgIndustry = data.organization?.industry ?? null

  async function call(action: () => Promise<void>, optimistic: { is_won: boolean; is_lost: boolean }, successMsg: string) {
    if (loading) return
    setLoading(true)
    const prev = { is_won: data.is_won, is_lost: data.is_lost }
    onStatusChange(optimistic)
    try {
      await action()
      notify.success({ title: successMsg, description: "El estado de la oportunidad fue actualizado." })
    } catch {
      onStatusChange(prev)
      notify.error({ title: "No se pudo actualizar el estado", description: "Intenta de nuevo." })
    } finally {
      setLoading(false)
    }
  }

  const handleWon    = () => call(() => opportunityService.won(data.id),    { is_won: true,  is_lost: false }, "Oportunidad ganada")
  const handleLost   = () => call(() => opportunityService.lost(data.id),   { is_won: false, is_lost: true  }, "Oportunidad marcada como perdida")
  const handleReOpen = () => call(() => opportunityService.reOpen(data.id), { is_won: false, is_lost: false }, "Oportunidad reabierta")

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Valor del negocio ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Valor del negocio
          </span>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{formattedCost}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{data.currency}</p>
        </div>
        <div className="flex gap-2 border-t px-3.5 pb-3.5 pt-3">
          {isWon || isLost ? (
            <>
              <div className={cn(
                "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium",
                isWon
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600",
              )}>
                {isWon ? <TrophyIcon className="size-3.5" /> : <XCircleIcon className="size-3.5" />}
                {isWon ? "Ganada" : "Perdida"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handleReOpen}
                className="h-8 flex-1 gap-1.5 text-xs"
              >
                Reabrir
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handleWon}
                className="h-8 flex-1 gap-1.5 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <TrophyIcon className="size-3.5" />
                Ganada
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handleLost}
                className="h-8 flex-1 gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-600"
              >
                <XCircleIcon className="size-3.5" />
                Perdida
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Contacto ──────────────────────────────────────────────────────── */}
      {data.person ? (
        <CollapsibleSection title="Contacto">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt={data.person.name} />
                  <AvatarFallback>
                    {data.person.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{data.person.name}</p>
                <p className="truncate text-xs text-muted-foreground">Contacto asociado</p>
              </div>
            </div>

            <div className="mt-2 divide-y border-t">
              {personEmail ? (
                <div className="flex items-center gap-3 py-2.5">
                  <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-blue-500">{personEmail}</p>
                    <p className="text-xs text-muted-foreground">Correo</p>
                  </div>
                  <CopyButton value={personEmail} />
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2.5">
                  <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No Aplica</p>
                </div>
              )}

              {personPhone ? (
                <div className="flex items-center gap-3 py-2.5">
                  <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{personPhone}</p>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                  </div>
                  <a
                    href={`https://wa.me/${personPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-green-500 transition-colors hover:text-[#25D366]"
                  >
                    <MessageCircleIcon className="size-3.5" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2.5">
                  <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No Aplica</p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-3.5 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contacto
            </span>
          </div>
          <div className="px-3.5 py-3">
            <p className="text-xs text-muted-foreground">Sin contacto asociado.</p>
          </div>
        </div>
      )}

      {/* ── Empresa ───────────────────────────────────────────────────────── */}
      {data.organization ? (
        <CollapsibleSection title="Empresa">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt={data.organization.name} />
                  <AvatarFallback>
                    {data.organization.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -right-1 -bottom-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{data.organization.name}</p>
                {orgIndustry && (
                  <p className="truncate text-xs text-muted-foreground">{orgIndustry}</p>
                )}
              </div>
            </div>

            <div className="mt-2 divide-y border-t">
              {orgTaxId ? (
                <div className="flex items-center gap-3 py-2.5">
                  <BuildingIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{orgTaxId}</p>
                    <p className="text-xs text-muted-foreground">RUT Empresa</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2.5">
                  <BuildingIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Sin RUT registrado</p>
                </div>
              )}

              {orgIndustry && (
                <div className="flex items-center gap-3 py-2.5">
                  <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{orgIndustry}</p>
                    <p className="text-xs text-muted-foreground">Industria</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-3.5 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Empresa
            </span>
          </div>
          <div className="px-3.5 py-3">
            <p className="text-xs text-muted-foreground">Sin empresa asociada.</p>
          </div>
        </div>
      )}

    </div>
  )
}
