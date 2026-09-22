"use client"

import * as React from "react"
import { CheckIcon, MailIcon, MousePointerClickIcon, XIcon } from "lucide-react"
import { campaignService, type PersonCampaignActivity } from "@/services/campaign.service"

// ─── Config ───────────────────────────────────────────────────────────────────

const eventIcon: Record<string, React.ReactNode> = {
  delivered:   <CheckIcon className="size-3 text-emerald-500" />,
  open:        <MailIcon className="size-3 text-sky-500" />,
  click:       <MousePointerClickIcon className="size-3 text-violet-500" />,
  bounce:      <XIcon className="size-3 text-red-500" />,
  unsubscribe: <XIcon className="size-3 text-orange-500" />,
  spamreport:  <XIcon className="size-3 text-red-700" />,
}

const eventLabel: Record<string, string> = {
  delivered:   "Entregado",
  open:        "Abrió",
  click:       "Hizo click",
  bounce:      "Rebotó",
  unsubscribe: "Se dio de baja",
  spamreport:  "Spam",
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SeguimientoSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contactId: number
}

export function SeguimientoMktTab({ contactId }: Props) {
  const [campaigns, setCampaigns] = React.useState<PersonCampaignActivity[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    campaignService.getPersonActivity(contactId)
      .then((res) => { if (!cancelled) setCampaigns(res) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [contactId])

  if (loading) return <SeguimientoSkeleton />

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <MailIcon className="size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">Sin actividad de campañas</p>
        <p className="text-xs text-muted-foreground">
          Aparecerá acá cuando este contacto reciba una campaña de email.
        </p>
      </div>
    )
  }

  const count = (type: string) => campaigns.filter((c) => c.events.includes(type)).length

  const summary = [
    { label: "Recibidas",  value: count("delivered"), color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Aperturas",  value: count("open"),       color: "text-sky-600 dark:text-sky-400"         },
    { label: "Clics",      value: count("click"),      color: "text-violet-600 dark:text-violet-400"   },
    { label: "Rebotes",    value: count("bounce"),     color: "text-red-600 dark:text-red-400"          },
  ]

  return (
    <div className="flex flex-col">
      {/* Resumen */}
      <div className="grid grid-cols-4 gap-2 border-b p-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-lg border bg-muted/30 p-2.5 text-center">
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Por campaña */}
      <div className="divide-y">
        {campaigns.map((c) => (
          <div key={c.campaign_id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.sent_at
                  ? new Date(c.sent_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              {c.events.map((ev) => (
                <span
                  key={ev}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                  title={eventLabel[ev] ?? ev}
                >
                  {eventIcon[ev] ?? null}
                  {eventLabel[ev] ?? ev}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
