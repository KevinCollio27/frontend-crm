import * as React from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Field } from "@/components/ui/field"
import { Section } from "@/components/ui/section"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { CURRENCY_SYMBOL, formatMoney, formatNumber } from "../shared/currency"
import {
  buildCargoValue,
  fetchCargoOptions,
  isCargoLabelType,
  parseCargoValue,
  type CargoLabelType,
  type CargoOption,
} from "../shared/cargo-labels"
import type { AdditionalItem, QuotationFormState, ServiceRow } from "../shared/form-state"
import type { ProductLabelRaw, ProductRaw } from "@/types/product"

const UNIT_OPTIONS = ["unidad", "viaje", "hora", "kg", "m³"]

function emptyRow(): ServiceRow {
  return { id: crypto.randomUUID(), values: {}, unitPrice: "", unit: "unidad", quantity: "1", discount: "0" }
}

function rowTotal(row: ServiceRow, applyDiscounts: boolean): number {
  const price = parseInt(row.unitPrice || "0", 10) || 0
  const qty = parseInt(row.quantity || "0", 10) || 0
  const gross = price * qty
  if (!applyDiscounts) return gross
  const pct = Math.min(100, Math.max(0, parseInt(row.discount || "0", 10) || 0))
  return gross - gross * (pct / 100)
}

function emptyAdditional(): AdditionalItem {
  return { id: crypto.randomUUID(), label: "", unit: "unidad", quantity: "1", amount: "" }
}

function additionalTotal(a: AdditionalItem): number {
  const qty = parseInt(a.quantity || "0", 10) || 0
  const amount = parseInt(a.amount || "0", 10) || 0
  return qty * amount
}

interface DynamicCellProps {
  label: ProductLabelRaw
  value: string
  onChange: (value: string) => void
  cargoOptions?: CargoOption[]
  cargoLoading?: boolean
}

function DynamicCell({ label, value, onChange, cargoOptions, cargoLoading }: DynamicCellProps) {
  if (label.type === "select") {
    return (
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger size="sm" className="w-32" aria-label={label.name}>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {label.product_label_option.map((opt) => (
              <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }
  if (isCargoLabelType(label.type)) {
    const cargoType = label.type
    const options = cargoOptions ?? []
    const selected = parseCargoValue(value, cargoType)
    const hasStaleSelection = !!selected && !options.some((o) => String(o.id) === selected.id)
    const selectOptions: SearchableSelectOption[] = [
      ...(hasStaleSelection && selected ? [{ value: selected.id, label: selected.name }] : []),
      ...options.map((o) => ({ value: String(o.id), label: o.displayLabel })),
    ]
    return (
      <SearchableSelect
        className="w-40"
        options={selectOptions}
        value={selected?.id ?? ""}
        onChange={(id) => {
          const opt = options.find((o) => String(o.id) === id)
          if (opt) onChange(buildCargoValue(opt, cargoType))
        }}
        placeholder={cargoLoading ? "Cargando..." : "Seleccionar..."}
        disabled={!!cargoLoading && options.length === 0}
      />
    )
  }
  if (label.type === "number") {
    const raw = value.replace(/\D/g, "")
    const displayed = raw ? new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(parseInt(raw, 10)) : ""
    return (
      <Input
        type="text"
        inputMode="numeric"
        className="w-24"
        placeholder="0"
        value={displayed}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      />
    )
  }
  if (label.type === "date") {
    return <Input type="date" className="w-36" value={value} onChange={(e) => onChange(e.target.value)} />
  }
  return (
    <Input
      type="text"
      className="w-36"
      placeholder="Texto o dirección..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

interface Step3ServicesProps {
  form:     QuotationFormState
  setForm:  React.Dispatch<React.SetStateAction<QuotationFormState>>
  products: ProductRaw[]
}

export function Step3Services({ form, setForm, products }: Step3ServicesProps) {
  const selectedProduct = products.find((p) => p.id === form.productId) ?? null

  const [showAdditionals, setShowAdditionals] = React.useState(form.additionals.length > 0)
  const [showGlobalDiscount, setShowGlobalDiscount] = React.useState(form.globalDiscountValue !== "")
  const [showComment, setShowComment] = React.useState(form.comment !== "")
  const [cargoOptionsByType, setCargoOptionsByType] = React.useState<Partial<Record<CargoLabelType, CargoOption[]>>>({})
  const [cargoLoadingByType, setCargoLoadingByType] = React.useState<Partial<Record<CargoLabelType, boolean>>>({})
  const requestedCargoTypesRef = React.useRef<Set<CargoLabelType>>(new Set())

  React.useEffect(() => {
    if (!selectedProduct) return
    const types = Array.from(new Set(selectedProduct.product_label.map((l) => l.type))).filter(isCargoLabelType)
    types.forEach((type) => {
      if (requestedCargoTypesRef.current.has(type)) return
      requestedCargoTypesRef.current.add(type)
      setCargoLoadingByType((s) => ({ ...s, [type]: true }))
      fetchCargoOptions(type)
        .then((opts) => setCargoOptionsByType((s) => ({ ...s, [type]: opts })))
        .catch(() => setCargoOptionsByType((s) => ({ ...s, [type]: [] })))
        .finally(() => setCargoLoadingByType((s) => ({ ...s, [type]: false })))
    })
  }, [selectedProduct?.id])

  if (!selectedProduct) {
    return (
      <div className="mx-auto max-w-2xl">
        <Section title="Servicios" description="Selecciona un producto en el paso anterior para continuar.">
          <p className="text-sm text-muted-foreground">No hay producto seleccionado.</p>
        </Section>
      </div>
    )
  }

  function addRow() {
    setForm((f) => ({ ...f, rows: [...f.rows, emptyRow()] }))
  }
  function removeRow(id: string) {
    setForm((f) => ({ ...f, rows: f.rows.filter((r) => r.id !== id) }))
  }
  function updateRow(id: string, patch: Partial<ServiceRow>) {
    setForm((f) => ({ ...f, rows: f.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  }
  function updateRowValue(id: string, key: string, value: string) {
    setForm((f) => ({
      ...f,
      rows: f.rows.map((r) => (r.id === id ? { ...r, values: { ...r.values, [key]: value } } : r)),
    }))
  }

  function addAdditional() {
    setForm((f) => ({ ...f, additionals: [...f.additionals, emptyAdditional()] }))
  }
  function removeAdditional(id: string) {
    setForm((f) => ({ ...f, additionals: f.additionals.filter((a) => a.id !== id) }))
  }
  function updateAdditional(id: string, patch: Partial<AdditionalItem>) {
    setForm((f) => ({ ...f, additionals: f.additionals.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))
  }

  const symbol = CURRENCY_SYMBOL[form.currency] ?? "$"
  const subtotal = form.rows.reduce((sum, r) => sum + rowTotal(r, form.applyDiscounts), 0)
  const additionalsTotal = form.additionals.reduce((sum, a) => sum + additionalTotal(a), 0)
  const globalDiscountAmount =
    form.applyDiscounts && form.globalDiscountValue
      ? form.globalDiscountType === "percentage"
        ? subtotal * (Math.min(100, Math.max(0, parseInt(form.globalDiscountValue, 10) || 0)) / 100)
        : parseInt(form.globalDiscountValue, 10) || 0
      : 0
  const total = subtotal - globalDiscountAmount + additionalsTotal

  const colCount = selectedProduct.product_label.length + 3 + (form.applyDiscounts ? 1 : 0) + 2

  return (
    <div className="space-y-5">
      <Section
        title={`Configuración de Servicios (${form.rows.length})`}
        description={`Producto: ${selectedProduct.name}. Edita cada celda como una hoja de cálculo.`}
        actions={
          <>
            {form.applyDiscounts && !showGlobalDiscount && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowGlobalDiscount(true)}>
                <PlusIcon className="size-3.5" /> Descuento Global
              </Button>
            )}
            {!showAdditionals && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdditionals(true)}>
                <PlusIcon className="size-3.5" /> Adicional
              </Button>
            )}
            {!showComment && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowComment(true)}>
                <PlusIcon className="size-3.5" /> Comentario
              </Button>
            )}
          </>
        }
      >
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectedProduct.product_label.map((label) => (
                  <TableHead key={label.key} className="whitespace-nowrap">{label.name}</TableHead>
                ))}
                <TableHead className="whitespace-nowrap">P.U.</TableHead>
                <TableHead className="whitespace-nowrap">UM</TableHead>
                <TableHead className="whitespace-nowrap">Cant.</TableHead>
                {form.applyDiscounts && <TableHead className="whitespace-nowrap">Desc. %</TableHead>}
                <TableHead className="whitespace-nowrap">Total</TableHead>
                <TableHead className="whitespace-nowrap">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.rows.map((row) => (
                <TableRow key={row.id}>
                  {selectedProduct.product_label.map((label) => (
                    <TableCell key={label.key}>
                      <DynamicCell
                        label={label}
                        value={row.values[label.key] ?? ""}
                        onChange={(v) => updateRowValue(row.id, label.key, v)}
                        cargoOptions={isCargoLabelType(label.type) ? cargoOptionsByType[label.type] : undefined}
                        cargoLoading={isCargoLabelType(label.type) ? cargoLoadingByType[label.type] : undefined}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <InputGroup className="w-28">
                      <InputGroupAddon>
                        <span className="text-xs font-medium">{symbol}</span>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formatNumber(row.unitPrice, form.currency)}
                        onChange={(e) => updateRow(row.id, { unitPrice: e.target.value.replace(/\D/g, "") })}
                      />
                    </InputGroup>
                  </TableCell>
                  <TableCell>
                    <Select value={row.unit} onValueChange={(v) => updateRow(row.id, { unit: v ?? "unidad" })}>
                      <SelectTrigger size="sm" className="w-24" aria-label="Unidad de medida">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="w-16"
                      placeholder="0"
                      value={row.quantity ? new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(parseInt(row.quantity, 10)) : ""}
                      onChange={(e) => updateRow(row.id, { quantity: e.target.value.replace(/\D/g, "") })}
                    />
                  </TableCell>
                  {form.applyDiscounts && (
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        className="w-16"
                        placeholder="0"
                        value={row.discount || ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "")
                          const clamped = digits ? String(Math.min(100, Number(digits))) : ""
                          updateRow(row.id, { discount: clamped })
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="text-sm font-semibold tabular-nums text-emerald-600">
                      {formatMoney(rowTotal(row, form.applyDiscounts), form.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={() => removeRow(row.id)}
                      aria-label="Eliminar servicio"
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={colCount} className="p-1">
                  <Button type="button" variant="ghost" className="w-full justify-start text-muted-foreground" onClick={addRow}>
                    <PlusIcon className="size-4" /> Agregar servicio
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {showAdditionals && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-medium tracking-wider text-muted-foreground">ADICIONALES</p>

            {form.additionals.length > 0 && (
              <div className="flex items-center gap-2 px-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                <span className="flex-1">Etiqueta</span>
                <span className="w-24">UM</span>
                <span className="w-16">Cant.</span>
                <span className="w-32">Monto</span>
                <span className="w-24 text-right">Total</span>
                <span className="w-7" />
              </div>
            )}

            {form.additionals.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <Input
                  placeholder="Ej: Peoneta"
                  className="flex-1"
                  value={a.label}
                  onChange={(e) => updateAdditional(a.id, { label: e.target.value })}
                />
                <Select value={a.unit} onValueChange={(v) => updateAdditional(a.id, { unit: v ?? "unidad" })}>
                  <SelectTrigger size="sm" className="w-24" aria-label="Unidad de medida">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="w-16"
                  placeholder="0"
                  value={a.quantity ? new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(parseInt(a.quantity, 10)) : ""}
                  onChange={(e) => updateAdditional(a.id, { quantity: e.target.value.replace(/\D/g, "") })}
                />
                <InputGroup className="w-32">
                  <InputGroupAddon>
                    <span className="text-xs font-medium">{symbol}</span>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatNumber(a.amount, form.currency)}
                    onChange={(e) => updateAdditional(a.id, { amount: e.target.value.replace(/\D/g, "") })}
                  />
                </InputGroup>
                <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-emerald-600">
                  {formatMoney(additionalTotal(a), form.currency)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => removeAdditional(a.id)}
                  aria-label="Eliminar adicional"
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addAdditional}>
              <PlusIcon className="size-3.5" /> Agregar adicional
            </Button>
          </div>
        )}

        {form.applyDiscounts && showGlobalDiscount && (
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Descuento global</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex gap-0.5 rounded-lg border p-0.5">
                <Button
                  type="button"
                  size="xs"
                  variant={form.globalDiscountType === "percentage" ? "default" : "ghost"}
                  onClick={() => setForm((f) => ({ ...f, globalDiscountType: "percentage" }))}
                >
                  % Porcentaje
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={form.globalDiscountType === "fixed" ? "default" : "ghost"}
                  onClick={() => setForm((f) => ({ ...f, globalDiscountType: "fixed" }))}
                >
                  {symbol} Monto fijo
                </Button>
              </div>
              <InputGroup className="w-28">
                {form.globalDiscountType === "percentage" ? (
                  <>
                    <InputGroupInput
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.globalDiscountValue}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "")
                        const clamped = digits ? String(Math.min(100, Number(digits))) : ""
                        setForm((f) => ({ ...f, globalDiscountValue: clamped }))
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <span className="text-xs font-medium">%</span>
                    </InputGroupAddon>
                  </>
                ) : (
                  <>
                    <InputGroupAddon>
                      <span className="text-xs font-medium">{symbol}</span>
                    </InputGroupAddon>
                    <InputGroupInput
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatNumber(form.globalDiscountValue, form.currency)}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, globalDiscountValue: e.target.value.replace(/\D/g, "") }))
                      }
                    />
                  </>
                )}
              </InputGroup>
            </div>
          </div>
        )}

        {showComment && (
          <Field label="Comentarios (aparece en el PDF)">
            <Textarea
              rows={3}
              placeholder="Notas internas, condiciones especiales, exclusiones, etc."
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            />
          </Field>
        )}
      </Section>

      <Section title="Resumen" description="Totales calculados de la cotización.">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal Servicios</span>
            <span className="tabular-nums">{formatMoney(subtotal, form.currency)}</span>
          </div>
          {additionalsTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Adicionales</span>
              <span className="tabular-nums">{formatMoney(additionalsTotal, form.currency)}</span>
            </div>
          )}
          {globalDiscountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Descuento Global</span>
              <span className="tabular-nums text-destructive">-{formatMoney(globalDiscountAmount, form.currency)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>Total Final</span>
            <span className="tabular-nums text-emerald-600">{formatMoney(total, form.currency)}</span>
          </div>
        </div>
      </Section>
    </div>
  )
}
