"use client"

import * as React from "react"
import { ChevronDownIcon, DownloadIcon, Loader2Icon, MailIcon, PencilIcon, ShipIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Section } from "@/components/ui/section"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { OVERDUE_BADGE_CLASS } from "@/lib/table-utils"
import { useCargoIntegration } from "@/hooks/useCargoIntegration"
import type { QuotationRaw } from "@/types/quotation"
import { rawToForm } from "./shared/quotation-from-raw"
import { formatMoney } from "./shared/currency"
import { displayFieldValue } from "./shared/quotation-display"
import { getUnitLabel } from "./shared/units"
import { isAcceptedStatus } from "./shared/send-to-cargo"
import { STATUS_CONFIG } from "./shared/status"

const TYPE_LABEL: Record<string, string> = { sale: "Venta", purchase: "Compra" }

interface QuotationPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: QuotationRaw | null
  onEdit?: () => void
  onDownload?: () => void
  downloading?: boolean
  onSend?: () => void
  onSendToCargo?: () => void
}

export function QuotationPreviewSheet({
  open, onOpenChange, entity, onEdit, onDownload, downloading, onSend, onSendToCargo,
}: QuotationPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 1400, padding: 0, gap: 0 }} className="w-full!">
        {open && entity && (
          <QuotationPreview
            entity={entity}
            onClose={() => onOpenChange(false)}
            onEdit={onEdit}
            onDownload={onDownload}
            downloading={downloading}
            onSend={onSend}
            onSendToCargo={onSendToCargo}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function CollapsibleSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="overflow-hidden rounded-xl border bg-background">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-3 gap-x-6 border-t p-4 sm:p-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface PreviewProps {
  entity: QuotationRaw
  onClose: () => void
  onEdit?: () => void
  onDownload?: () => void
  downloading?: boolean
  onSend?: () => void
  onSendToCargo?: () => void
}

function QuotationPreview({ entity, onClose, onEdit, onDownload, downloading, onSend, onSendToCargo }: PreviewProps) {
  const { hasCargoIntegration } = useCargoIntegration()
  const form = React.useMemo(() => rawToForm(entity), [entity])
  const labels = React.useMemo(
    () => [...(entity.product?.product_label ?? [])].sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0)),
    [entity]
  )

  const statusConf = STATUS_CONFIG[entity.status] ?? { label: entity.status, className: "bg-muted text-muted-foreground border-border" }
  const typeLabel  = TYPE_LABEL[entity.type] ?? entity.type
  const canSendToCargo = hasCargoIntegration && isAcceptedStatus(entity.status) && !!onSendToCargo
  // Mismo criterio que la tabla: solo lo que sigue esperando respuesta puede estar vencido.
  const isExpired = entity.status === "sent" && !!entity.valid_until && new Date(entity.valid_until) < new Date()

  const subtotal          = entity.subtotal ?? 0
  const discountAmount    = entity.discount_amount ?? 0
  const additionalAmount  = entity.additional_amount ?? 0

  return (
    <div className="flex h-full flex-col">

      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <SheetTitle>{entity.name}</SheetTitle>
              <Badge className={cn("rounded-full border px-2.5 py-0.5 text-xs", statusConf.className)}>
                {statusConf.label}
              </Badge>
              {isExpired && (
                <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs", OVERDUE_BADGE_CLASS)}>
                  Vencida
                </Badge>
              )}
              {entity.is_sent_to_cargo && (
                <Badge className="gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300">
                  <ShipIcon className="size-3" /> Enviado a Cargo
                </Badge>
              )}
            </div>
            <SheetDescription>Vista previa de la cotización — solo lectura.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">

        <CollapsibleSection title="Resumen" defaultOpen={false}>
          <InfoRow label="Oportunidad" value={entity.opportunity?.name ?? "—"} />
          <InfoRow label="Producto" value={entity.product?.name ?? "—"} />
          <InfoRow label="Tipo" value={typeLabel} />
          <InfoRow label="Moneda" value={entity.currency?.symbol ?? form.currency} />
          <InfoRow label="Válido hasta" value={formatDate(entity.valid_until)} />
          <InfoRow label="Vendedor" value={entity.created_user?.name ?? "—"} />
          <InfoRow label="Creada" value={formatDate(entity.created_at)} />
        </CollapsibleSection>

        <Section
          title={`Servicios (${form.rows.length})`}
          description={entity.product?.name ? `Producto: ${entity.product.name}` : undefined}
        >
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {labels.map((label) => (
                    <TableHead key={label.key} className="whitespace-nowrap">{label.name}</TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap">P.U.</TableHead>
                  <TableHead className="whitespace-nowrap">UM</TableHead>
                  <TableHead className="whitespace-nowrap">Cant.</TableHead>
                  {form.applyDiscounts && <TableHead className="whitespace-nowrap">Desc. %</TableHead>}
                  <TableHead className="whitespace-nowrap">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.rows.map((row) => {
                  const price = parseInt(row.unitPrice || "0", 10) || 0
                  const qty   = parseInt(row.quantity  || "0", 10) || 0
                  const gross = price * qty
                  const pct   = form.applyDiscounts ? Math.min(100, Math.max(0, parseInt(row.discount || "0", 10) || 0)) : 0
                  const rowTotal = gross - gross * (pct / 100)
                  return (
                    <TableRow key={row.id}>
                      {labels.map((label) => (
                        <TableCell key={label.key} className="text-sm whitespace-nowrap">
                          {displayFieldValue(row.values[label.key] ?? "", label.type)}
                        </TableCell>
                      ))}
                      <TableCell className="text-sm tabular-nums">{formatMoney(price, form.currency)}</TableCell>
                      <TableCell className="text-sm">{getUnitLabel(row.unit)}</TableCell>
                      <TableCell className="text-sm tabular-nums">{qty}</TableCell>
                      {form.applyDiscounts && <TableCell className="text-sm tabular-nums">{row.discount || 0}%</TableCell>}
                      <TableCell className="text-sm font-semibold tabular-nums text-emerald-600">
                        {formatMoney(rowTotal, form.currency)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {form.additionals.length > 0 && (
            <div className="space-y-1.5 rounded-lg border p-3">
              <p className="text-xs font-medium tracking-wider text-muted-foreground">ADICIONALES</p>
              {form.additionals.map((a) => {
                const qty    = parseInt(a.quantity || "0", 10) || 0
                const amount = parseInt(a.amount   || "0", 10) || 0
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span>
                      {a.label}{" "}
                      <span className="text-muted-foreground">
                        ({qty} {getUnitLabel(a.unit)} × {formatMoney(amount, form.currency)})
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-emerald-600">
                      {formatMoney(qty * amount, form.currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {form.applyDiscounts && form.globalDiscountValue && (
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span className="text-muted-foreground">Descuento global</span>
              <span className="font-medium">
                {form.globalDiscountType === "percentage"
                  ? `${form.globalDiscountValue}%`
                  : formatMoney(parseInt(form.globalDiscountValue, 10) || 0, form.currency)}
              </span>
            </div>
          )}

          {form.comment && (
            <div className="rounded-lg border p-3">
              <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground">COMENTARIO</p>
              <p className="text-sm whitespace-pre-wrap">{form.comment}</p>
            </div>
          )}
        </Section>

        <Section title="Totales" description="Resumen calculado de la cotización.">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal Servicios</span>
              <span className="tabular-nums">{formatMoney(subtotal, form.currency)}</span>
            </div>
            {additionalAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Adicionales</span>
                <span className="tabular-nums">{formatMoney(additionalAmount, form.currency)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Descuento Global</span>
                <span className="tabular-nums text-destructive">-{formatMoney(discountAmount, form.currency)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
              <span>Total Final</span>
              <span className="tabular-nums text-emerald-600">{formatMoney(entity.amount, form.currency)}</span>
            </div>
          </div>
        </Section>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose}>
          Cerrar
        </Button>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button type="button" variant="outline" onClick={onEdit}>
              <PencilIcon className="size-4" /> Editar
            </Button>
          )}
          {onDownload && (
            <Button type="button" variant="outline" onClick={onDownload} disabled={downloading}>
              {downloading ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
              {downloading ? "Generando..." : "Descargar PDF"}
            </Button>
          )}
          {onSend && (
            <Button type="button" variant={canSendToCargo ? "outline" : "default"} onClick={onSend}>
              <MailIcon className="size-4" /> Enviar por correo
            </Button>
          )}
          {canSendToCargo && (
            <Button type="button" onClick={onSendToCargo} disabled={entity.is_sent_to_cargo}>
              <ShipIcon className="size-4" /> {entity.is_sent_to_cargo ? "Ya enviado a Cargo" : "Enviar a Cargo"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
