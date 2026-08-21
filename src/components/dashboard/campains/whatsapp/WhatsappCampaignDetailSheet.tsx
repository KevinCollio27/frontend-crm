"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { whatsappCampaignService } from "@/services/whatsappCampaign.service"
import type { WhatsappCampaignRaw } from "@/types/whatsappCampaign"
import { RECIPIENT_STATUS_CONFIG } from "../shared/status"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: number | null
}

export function WhatsappCampaignDetailSheet({ open, onOpenChange, campaignId }: Props) {
  const [campaign, setCampaign] = React.useState<WhatsappCampaignRaw | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !campaignId) return
    setLoading(true)
    whatsappCampaignService.getById(campaignId)
      .then(setCampaign)
      .finally(() => setLoading(false))
  }, [open, campaignId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <div className="flex h-full flex-col">
          <div className="border-b px-5 py-4 sm:px-6">
            <SheetTitle>{campaign?.name ?? "Campaña"}</SheetTitle>
            <SheetDescription>
              Plantilla <span className="font-mono">{campaign?.template_name}</span> · {campaign?.total_count ?? 0} destinatarios
            </SheetDescription>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {loading ? (
              <Loader2Icon className="mx-auto size-5 animate-spin text-muted-foreground" />
            ) : campaign ? (
              <>
                <div className="mb-4 grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="rounded-lg border p-2"><p className="font-semibold">{campaign.sent_count}</p><p className="text-xs text-muted-foreground">Enviados</p></div>
                  <div className="rounded-lg border p-2"><p className="font-semibold">{campaign.delivered_count}</p><p className="text-xs text-muted-foreground">Entregados</p></div>
                  <div className="rounded-lg border p-2"><p className="font-semibold">{campaign.read_count}</p><p className="text-xs text-muted-foreground">Leídos</p></div>
                  <div className="rounded-lg border p-2"><p className="font-semibold">{campaign.failed_count}</p><p className="text-xs text-muted-foreground">Fallidos</p></div>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(campaign.recipients ?? []).map((r) => {
                        const statusCfg = RECIPIENT_STATUS_CONFIG[r.status]
                        return (
                        <TableRow key={r.id}>
                          <TableCell className="max-w-40">
                            <p className="truncate text-sm font-medium" title={r.name || undefined}>{r.name || "—"}</p>
                            <p className="truncate text-xs text-muted-foreground">{r.phone_number}</p>
                          </TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", statusCfg?.badge ?? "bg-muted text-muted-foreground")}>
                              <span className={cn("size-1.5 rounded-full", statusCfg?.dot ?? "bg-muted-foreground")} />
                              {statusCfg?.label ?? r.status}
                            </span>
                            {r.error_message && <p className="mt-0.5 text-xs text-destructive">{r.error_message}</p>}
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
