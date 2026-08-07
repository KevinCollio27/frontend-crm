import * as React from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Field } from "@/components/ui/field"
import { Section } from "@/components/ui/section"
import { currencyService } from "@/services/currency.service"
import { flowService } from "@/services/flow.service"
import { opportunityService } from "@/services/opportunity.service"
import type { CurrencyRaw } from "@/types/currency"
import type { QuotationFormState, QuotationType } from "../shared/form-state"

const CODE_TO_FLAG: Record<string, string> = {
  CLP: "cl",
  USD: "us",
  ARS: "ar",
  COP: "co",
  MXN: "mx",
  PEN: "pe",
  BRL: "br",
  EUR: "eu",
}

interface Step1InfoProps {
  form:                    QuotationFormState
  setForm:                 React.Dispatch<React.SetStateAction<QuotationFormState>>
  opportunityName?:        string
  flowName?:               string | null
  isEdit:                  boolean
  selectedFlowId:          number | null
  onFlowChange:            (id: number | null) => void
  selectedOpportunityId:   number | null
  onOpportunityChange:     (id: number | null, name: string | null) => void
}

export function Step1Info({
  form, setForm, opportunityName, flowName,
  isEdit, selectedFlowId, onFlowChange, selectedOpportunityId, onOpportunityChange,
}: Step1InfoProps) {
  const hasContext = !!opportunityName
  const showAssignment = !hasContext && !isEdit

  const [currencies, setCurrencies]               = React.useState<CurrencyRaw[]>([])
  const [currenciesLoading, setCurrenciesLoading] = React.useState(true)
  const [flows, setFlows]                         = React.useState<{ value: string; label: string }[]>([])
  const [flowsLoading, setFlowsLoading]           = React.useState(false)
  const [opportunities, setOpportunities]         = React.useState<{ value: string; label: string }[]>([])
  const [oppsLoading, setOppsLoading]             = React.useState(false)

  React.useEffect(() => {
    currencyService.list()
      .then((data) => {
        setCurrencies(data)
        setForm((f) => {
          if (f.currencyId !== null) return f
          const clp = data.find((c) => c.code === "CLP")
          return clp ? { ...f, currency: clp.code, currencyId: clp.id } : f
        })
      })
      .catch(() => {})
      .finally(() => setCurrenciesLoading(false))
  }, [])

  React.useEffect(() => {
    if (!showAssignment) return
    setFlowsLoading(true)
    flowService.all()
      .then((res) => setFlows(res.map((f) => ({ value: String(f.id), label: f.name }))))
      .catch(() => {})
      .finally(() => setFlowsLoading(false))
  }, [showAssignment])

  React.useEffect(() => {
    if (!selectedFlowId) { setOpportunities([]); return }
    setOppsLoading(true)
    opportunityService
      .list({ flow_id: selectedFlowId, take: 200 })
      .then((res) => setOpportunities(res.data.map((o) => ({ value: String(o.id), label: o.name }))))
      .catch(() => {})
      .finally(() => setOppsLoading(false))
  }, [selectedFlowId])

  const currencyOptions = currencies.map((c) => ({
    value: String(c.id),
    label: c.name ? `${c.code} — ${c.name}` : c.code,
    flag: CODE_TO_FLAG[c.code],
  }))

  function handleCurrencyChange(idStr: string | null) {
    if (!idStr) return
    const found = currencies.find((c) => String(c.id) === idStr)
    if (found) {
      setForm((f) => ({ ...f, currency: found.code, currencyId: found.id }))
    }
  }

  const currencySelectValue = form.currencyId ? String(form.currencyId) : ""

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {hasContext && (
        <Section title="Contexto" description="Esta cotización quedará asociada a la oportunidad.">
          <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5">
            <p className="text-sm font-medium">{opportunityName}</p>
            {flowName && <p className="text-xs text-muted-foreground">{flowName}</p>}
          </div>
        </Section>
      )}

      {showAssignment && (
        <Section title="Asignación" description="Selecciona el embudo y la oportunidad a la que pertenece esta cotización.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Embudo" required>
              {flowsLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-muted" />
              ) : (
                <SearchableSelect
                  options={flows}
                  value={selectedFlowId ? String(selectedFlowId) : ""}
                  onChange={(v) => onFlowChange(v ? Number(v) : null)}
                  placeholder="Selecciona un embudo"
                  searchPlaceholder="Buscar embudo..."
                />
              )}
            </Field>
            <Field label="Oportunidad" required>
              {oppsLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-muted" />
              ) : (
                <SearchableSelect
                  options={opportunities}
                  value={selectedOpportunityId ? String(selectedOpportunityId) : ""}
                  onChange={(v) => {
                    const opp = opportunities.find((o) => o.value === v)
                    onOpportunityChange(v ? Number(v) : null, opp?.label ?? null)
                  }}
                  placeholder={selectedFlowId ? "Selecciona una oportunidad" : "Primero selecciona un embudo"}
                  searchPlaceholder="Buscar oportunidad..."
                  disabled={!selectedFlowId}
                />
              )}
            </Field>
          </div>
        </Section>
      )}

      <Section title="Tipo de Cotización" description="Define si es una venta o una compra.">
        <div className="flex gap-2">
          {(
            [
              { value: "sale" as QuotationType, label: "Venta", icon: TrendingUpIcon },
              { value: "purchase" as QuotationType, label: "Compra", icon: TrendingDownIcon },
            ]
          ).map((opt) => {
            const Icon = opt.icon
            const active = form.type === opt.value
            return (
              <Button
                key={opt.value}
                type="button"
                variant={active ? "default" : "outline"}
                className={cn("flex-1", active && "ring-2 ring-primary/20")}
                onClick={() => setForm((f) => ({ ...f, type: opt.value }))}
              >
                <Icon className="size-4" />
                {opt.label}
              </Button>
            )
          })}
        </div>
      </Section>

      <Section title="Información General" description="Identifica tu cotización.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de la Cotización" required>
            <Input
              placeholder="Ej: Cotización - Falabella"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Estado">
            <Input value="Borrador" disabled />
          </Field>
          <Field label="Válida hasta (opcional)">
            <Input
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            />
          </Field>
          <Field label="Moneda">
            {currenciesLoading ? (
              <div className="h-9 animate-pulse rounded-lg bg-muted" />
            ) : (
              <SearchableSelect
                options={currencyOptions}
                value={currencySelectValue}
                onChange={handleCurrencyChange}
                placeholder="Selecciona moneda"
                searchPlaceholder="Buscar moneda..."
              />
            )}
          </Field>
        </div>
      </Section>

      <Section title="Descuentos" description="Habilita la columna de descuento por servicio y el descuento global.">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Aplicar descuentos</p>
            <p className="text-xs text-muted-foreground">
              Si está apagado, no se muestran columnas ni bloques de descuento en Servicios.
            </p>
          </div>
          <Switch
            checked={form.applyDiscounts}
            onCheckedChange={(v) => setForm((f) => ({ ...f, applyDiscounts: v }))}
          />
        </div>
      </Section>
    </div>
  )
}
