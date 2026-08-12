"use client"

import * as React from "react"
import { FileTextIcon, PackageIcon, SettingsIcon, XIcon } from "lucide-react"
import { notify } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { productService } from "@/services/product.service"
import { quotationService } from "@/services/quotation.service"
import { CreateProductSheet } from "@/components/settings/products/CreateProductSheet"
import type { ProductRaw } from "@/types/product"
import type { QuotationRaw } from "@/types/quotation"
import { useSessionStore } from "@/store/session.store"
import { Step1Info } from "./steps/Step1Info"
import { Step2Product, productRawToFormValues } from "./steps/Step2Product"
import { Step3Services } from "./steps/Step3Services"
import { createEmptyQuotationForm } from "./shared/form-state"
import { buildQuotationPayload } from "./shared/quotation-payload"
import { rawToForm } from "./shared/quotation-from-raw"

const STEPS: StepperStep[] = [
  { id: 1, label: "Información", icon: FileTextIcon },
  { id: 2, label: "Producto",    icon: PackageIcon  },
  { id: 3, label: "Servicios",   icon: SettingsIcon },
]

interface CreateQuotationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId?:   number
  opportunityName?: string
  flowName?:        string | null
  entity?:          QuotationRaw
  onSuccess?:       (result: QuotationRaw, mode: "create" | "update") => void
}

export function CreateQuotationSheet({
  open, onOpenChange,
  opportunityId, opportunityName, flowName,
  entity, onSuccess,
}: CreateQuotationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 1400, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && (
          <QuotationWizard
            onClose={() => onOpenChange(false)}
            opportunityId={opportunityId}
            opportunityName={opportunityName}
            flowName={flowName}
            entity={entity}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

interface WizardProps {
  onClose:          () => void
  opportunityId?:   number
  opportunityName?: string
  flowName?:        string | null
  entity?:          QuotationRaw
  onSuccess?:       (result: QuotationRaw, mode: "create" | "update") => void
}

function QuotationWizard({ onClose, opportunityId, opportunityName, flowName, entity, onSuccess }: WizardProps) {
  const isEdit     = !!entity
  const hasContext = opportunityId !== undefined
  const userName   = useSessionStore((s) => s.user?.name ?? "")

  const [step, setStep]             = React.useState(1)
  const [submitting, setSubmitting] = React.useState(false)
  const [form, setForm] = React.useState(() => {
    if (isEdit) return rawToForm(entity!)
    const base = createEmptyQuotationForm()
    if (hasContext && userName) base.name = `Cotización - ${userName}`
    return base
  })
  const [selectedFlowId, setSelectedFlowId]               = React.useState<number | null>(null)
  const [selectedOpportunityId, setSelectedOpportunityId] = React.useState<number | null>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  const [products, setProducts]               = React.useState<ProductRaw[]>([])
  const [productsLoading, setProductsLoading] = React.useState(true)
  const [createProductOpen, setCreateProductOpen] = React.useState(false)
  const [editProductTarget, setEditProductTarget] = React.useState<ProductRaw | null>(null)

  React.useEffect(() => {
    productService.listAll()
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setProductsLoading(false))
  }, [])

  // Al crear o editar un producto desde acá (sheet anidado), se recarga la lista
  // completa — no basta con appendear/parchear a mano porque necesitamos sus
  // etiquetas completas (recién creadas/editadas junto al producto). Solo se
  // resetean las filas de Servicios si el producto SELECCIONADO cambió de
  // verdad — si solo se editó el que ya estaba elegido (ej. agregarle una
  // etiqueta que faltaba), lo llenado en el paso 3 no debería perderse.
  function handleProductCreated(newId?: number) {
    setCreateProductOpen(false)
    setEditProductTarget(null)
    setProductsLoading(true)
    productService.listAll()
      .then((res) => {
        setProducts(res.data)
        if (newId && newId !== form.productId) {
          setForm((f) => ({ ...f, productId: newId, rows: [] }))
        }
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false))
  }

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  const step1Valid =
    form.name.trim().length > 0 &&
    form.currencyId !== null &&
    (hasContext || isEdit || selectedOpportunityId !== null)

  const canNext =
    (step === 1 && step1Valid) ||
    (step === 2 && form.productId !== null) ||
    step === 3

  function handleNext() {
    if (!canNext) return
    setStep((s) => Math.min(3, s + 1))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      notify.error({ title: "Falta el nombre de la cotización", description: "Escribe un nombre para continuar." })
      setStep(1)
      return
    }
    if (form.currencyId === null) {
      notify.error({ title: "Selecciona una moneda", description: "Elige la moneda antes de continuar." })
      setStep(1)
      return
    }
    if (form.productId === null) {
      notify.error({ title: "Falta seleccionar un producto", description: "Elige un producto antes de continuar." })
      setStep(2)
      return
    }
    if (form.rows.length === 0) {
      notify.error({ title: "Agrega al menos un servicio", description: "La cotización necesita al menos un ítem." })
      return
    }

    const product = products.find((p) => p.id === form.productId) ?? null
    const payload  = buildQuotationPayload(form, product)

    const action = isEdit ? "update" : "create"
    const t0     = performance.now()
    console.log(`[quotation] ${action} start — rows=${form.rows.length} additionals=${form.additionals.length}`)

    setSubmitting(true)
    try {
      if (isEdit) {
        const partial = await quotationService.update(entity!.id, payload)
        console.log(`[quotation] update → ${(performance.now() - t0).toFixed(0)}ms`)
        const full = await quotationService.getById(partial.id)
        console.log(`[quotation] update+getById → ${(performance.now() - t0).toFixed(0)}ms`)
        notify.info({ title: "Cotización actualizada", description: `"${form.name.trim()}" fue actualizada.` })
        onSuccess?.(full, "update")
      } else {
        const oppId = opportunityId ?? selectedOpportunityId
        if (!oppId) { notify.error({ title: "Selecciona una oportunidad", description: "Asocia la cotización a una oportunidad." }); return }
        const partial = await quotationService.create(oppId, payload)
        console.log(`[quotation] create → ${(performance.now() - t0).toFixed(0)}ms`)
        const full = await quotationService.getById(partial.id)
        console.log(`[quotation] create+getById → ${(performance.now() - t0).toFixed(0)}ms`)
        notify.success({ title: "Cotización creada", description: `"${form.name.trim()}" se creó correctamente.` })
        onSuccess?.(full, "create")
      }
      onClose()
    } catch (err) {
      console.error(`[quotation] ${action} error → ${(performance.now() - t0).toFixed(0)}ms`, err)
      notify.error({ title: "Algo salió mal", description: isEdit ? "No se pudo actualizar la cotización." : "No se pudo crear la cotización." })
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabel    = form.type === "sale" ? "Venta" : "Compra"
  const title        = isEdit ? `Editar Cotización — ${entity!.name}` : `Nueva Cotización de ${typeLabel}`
  const description  = isEdit ? "Modifica los datos y servicios de esta cotización." : "Crea una cotización con producto y configuración avanzada."
  const submitLabel  = isEdit ? "Guardar Cambios" : "Crear Cotización"
  const savingLabel  = isEdit ? "Guardando..." : "Creando..."

  return (
    <div className="flex h-full flex-col">

      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 sm:p-6">
        {step === 1 && (
          <Step1Info
            form={form}
            setForm={setForm}
            opportunityName={opportunityName}
            flowName={flowName}
            isEdit={isEdit}
            selectedFlowId={selectedFlowId}
            onFlowChange={(id) => { setSelectedFlowId(id); setSelectedOpportunityId(null) }}
            selectedOpportunityId={selectedOpportunityId}
            onOpportunityChange={(id, name) => {
                setSelectedOpportunityId(id)
                if (id && name) setForm((f) => ({ ...f, name: `Cotización de ${name}` }))
              }}
          />
        )}
        {step === 2 && (
          <Step2Product
            form={form}
            setForm={setForm}
            products={products}
            productsLoading={productsLoading}
            onCreateProduct={() => setCreateProductOpen(true)}
            onEditProduct={(product) => setEditProductTarget(product)}
          />
        )}
        {step === 3 && <Step3Services form={form} setForm={setForm} products={products} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
          >
            Anterior
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={handleNext} disabled={!canNext}>
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? savingLabel : submitLabel}
            </Button>
          )}
        </div>
      </div>

      {createProductOpen && (
        <CreateProductSheet
          open
          onOpenChange={(v) => { if (!v) setCreateProductOpen(false) }}
          breadcrumb={isEdit ? "Editar Cotización" : "Crear Cotización"}
          onSuccess={handleProductCreated}
        />
      )}

      {editProductTarget && (
        <CreateProductSheet
          open
          onOpenChange={(v) => { if (!v) setEditProductTarget(null) }}
          product={productRawToFormValues(editProductTarget)}
          breadcrumb={isEdit ? "Editar Cotización" : "Crear Cotización"}
          onSuccess={handleProductCreated}
        />
      )}
    </div>
  )
}
