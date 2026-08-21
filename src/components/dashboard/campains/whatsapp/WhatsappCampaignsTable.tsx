"use client"

import * as React from "react"
import { EyeIcon, Loader2Icon, PlusIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { whatsappCampaignService } from "@/services/whatsappCampaign.service"
import type { WhatsappCampaignRaw } from "@/types/whatsappCampaign"
import { CreateWhatsappCampaignSheet } from "./CreateWhatsappCampaignSheet"
import { WhatsappCampaignDetailSheet } from "./WhatsappCampaignDetailSheet"
import { CAMPAIGN_STATUS_CONFIG } from "../shared/status"

export function WhatsappCampaignsTable() {
  const [data, setData] = React.useState<WhatsappCampaignRaw[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailId, setDetailId] = React.useState<number | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Debounce: espera 400ms sin tipear antes de pegarle al backend — mismo
  // patrón que ContactsTable/CampaignsTable.
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    whatsappCampaignService.list(debouncedSearch || undefined)
      .then((res) => { if (!cancelled) setData(res) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey, debouncedSearch])

  return (
    <div className="w-full">
      {/* Row — búsqueda a la izquierda, contador + Crear Campaña a la derecha.
          Mismo patrón de una sola fila que la vista de Email. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="relative w-full shrink-0 md:w-44">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar campaña..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <span className="text-xs text-muted-foreground">{loading ? "…" : `${data.length} campañas`}</span>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" /> Crear Campaña
          </Button>
        </div>
      </div>

      <div className="mx-4 mt-3 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Plantilla</TableHead>
              <TableHead>Destinatarios</TableHead>
              <TableHead>Métricas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2Icon className="mx-auto size-4 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length ? (
              data.map((c) => {
                const statusCfg = CAMPAIGN_STATUS_CONFIG[c.status]
                return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="max-w-52 truncate" title={c.name}>{c.name}</span>
                      <span className="shrink-0 font-normal text-xs text-muted-foreground">#{c.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-32 truncate font-mono text-xs" title={c.template_name}>{c.template_name}</span>
                  </TableCell>
                  <TableCell>{c.total_count}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {c.sent_count} enviados · {c.delivered_count} entregados · {c.read_count} leídos
                      {c.failed_count > 0 && ` · ${c.failed_count} fallidos`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", statusCfg?.badge ?? "bg-muted text-muted-foreground")}>
                      <span className={cn("size-1.5 rounded-full", statusCfg?.dot ?? "bg-muted-foreground")} />
                      {statusCfg?.label ?? c.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString("es-CL")}</span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDetailId(c.id)} aria-label="Ver detalle">
                      <EyeIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  {debouncedSearch ? "Sin resultados para tu búsqueda." : "Sin campañas de WhatsApp todavía."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateWhatsappCampaignSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <WhatsappCampaignDetailSheet
        open={detailId !== null}
        onOpenChange={(open) => { if (!open) setDetailId(null) }}
        campaignId={detailId}
      />
    </div>
  )
}
