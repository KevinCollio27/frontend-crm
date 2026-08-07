"use client"

import * as React from "react"
import { ChevronRightIcon, LoaderCircleIcon, PackageIcon, TagIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { productNotify } from "@/lib/notify"
import { productService } from "@/services/product.service"
import {
  createEmptyProductForm,
  isNewId,
  labelNeedsOptions,
  slugifyLabelKey,
  type ProductFormState,
  type ProductLabel,
  type ProductLabelOption,
} from "./shared/form-state"
import { Step1Info } from "./steps/Step1Info"
import { Step2Labels } from "./steps/Step2Labels"

const STEPS: StepperStep[] = [
  { id: 1, label: "Producto", icon: PackageIcon },
  { id: 2, label: "Etiquetas", icon: TagIcon },
]

interface CreateProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ProductFormState
  onSuccess?: (productId?: number) => void
  // Cuando este sheet se abre desde otro flujo todavía montado detrás (ej. crear
  // cotización) — muestra un breadcrumb y usa "Anterior" en vez de "Cancelar"
  // en el botón que cierra el sheet por completo (no confundir con el "Anterior"
  // propio del wizard, que retrocede entre sus 2 pasos internos).
  breadcrumb?: string
}

export function CreateProductSheet({ open, onOpenChange, product, onSuccess, breadcrumb }: CreateProductSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open && (
          <ProductWizard
            product={product}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            breadcrumb={breadcrumb}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message ?? fallback
}

// Timing por llamada individual (no solo el total) — para ver cuál paso pesa más.
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now()
  console.log(`[product] ${label} start`)
  try {
    const result = await fn()
    console.log(`[product] ${label} OK → ${Date.now() - t0}ms`)
    return result
  } catch (error) {
    console.log(`[product] ${label} FAILED → ${Date.now() - t0}ms`)
    throw error
  }
}

// Las etiquetas de un producto son independientes entre sí (solo dependen del product_id, ya
// conocido) — cada etiqueta se resuelve en paralelo respecto a las demás. Dentro de una misma
// etiqueta, sus opciones también son independientes entre sí (solo dependen del label_id, que
// recién se conoce tras crear la etiqueta), así que también van en paralelo, pero después.
async function createLabelWithOptions(productId: number, label: ProductLabel, orderNumber: number) {
  const createdLabel = await timed(`create label "${label.name}"`, () =>
    productService.createLabel({
      name: label.name.trim(),
      key: slugifyLabelKey(label.name),
      type: label.type,
      productId,
      orderNumber,
    })
  )
  if (labelNeedsOptions(label.type)) {
    const namedOptions = label.options.filter((o) => o.value.trim())
    await Promise.all(
      namedOptions.map((option, optionIndex) =>
        timed(`create option "${option.value}" (${label.name})`, () =>
          productService.createLabelOption({
            value: option.value.trim(),
            orderNumber: optionIndex + 1,
            productLabelId: createdLabel.id,
          })
        )
      )
    )
  }
}

// Reconcilia las opciones de una etiqueta select/multiselect ya existente: elimina las que
// se sacaron, crea las nuevas (id `temp-`), actualiza el resto — todo en paralelo, ya que
// cada opción es una fila independiente (ninguna depende del resultado de otra).
async function saveExistingLabelOptions(labelId: number, current: ProductLabelOption[], original: ProductLabelOption[]) {
  const currentIds = new Set(current.filter((o) => !isNewId(o.id)).map((o) => o.id))
  const deleteTasks = original
    .filter((opt) => !isNewId(opt.id) && !currentIds.has(opt.id))
    .map((opt) => timed(`delete option "${opt.value}"`, () => productService.deleteLabelOption(Number(opt.id))))

  const namedOptions = current.filter((o) => o.value.trim())
  const saveTasks = namedOptions.map((option, i) =>
    isNewId(option.id)
      ? timed(`create option "${option.value}"`, () =>
          productService.createLabelOption({ value: option.value.trim(), orderNumber: i + 1, productLabelId: labelId })
        )
      : timed(`update option "${option.value}"`, () =>
          productService.updateLabelOption(Number(option.id), { value: option.value.trim(), orderNumber: i + 1, productLabelId: labelId })
        )
  )

  await Promise.all([...deleteTasks, ...saveTasks])
}

// Guarda una etiqueta ya existente: actualiza sus datos y reconcilia sus opciones (o las
// limpia si el tipo dejó de necesitarlas). Se arma como tarea propia para poder correr en
// paralelo junto con las demás etiquetas del producto.
async function saveExistingLabel(productId: number, label: ProductLabel, orderNumber: number, original: ProductLabel | undefined) {
  await timed(`update label "${label.name}"`, () =>
    productService.updateLabel(Number(label.id), {
      name: label.name.trim(),
      key: slugifyLabelKey(label.name),
      type: label.type,
      productId,
      orderNumber,
    })
  )

  if (labelNeedsOptions(label.type)) {
    await saveExistingLabelOptions(Number(label.id), label.options, original?.options ?? [])
  } else {
    // El tipo cambió a algo que ya no usa opciones — limpiar las que quedaron
    await Promise.all(
      (original?.options ?? [])
        .filter((opt) => !isNewId(opt.id))
        .map((opt) => timed(`delete option "${opt.value}"`, () => productService.deleteLabelOption(Number(opt.id))))
    )
  }
}

function ProductWizard({
  product,
  onClose,
  onSuccess,
  breadcrumb,
}: {
  product?: ProductFormState
  onClose: () => void
  onSuccess?: (productId?: number) => void
  breadcrumb?: string
}) {
  const isEditing = !!product
  const [step, setStep] = React.useState(1)
  const [form, setForm] = React.useState(product ?? createEmptyProductForm())
  const [submitting, setSubmitting] = React.useState(false)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  const canNext = step === 1 ? form.name.trim().length > 0 : true

  function handleNext() {
    if (!canNext) return
    setStep((s) => Math.min(STEPS.length, s + 1))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      productNotify.error("Falta el nombre del producto.")
      setStep(1)
      return
    }

    setSubmitting(true)
    const t0 = Date.now()
    console.log(`[product] ${isEditing ? "update" : "create"} flow start`)
    try {
      if (isEditing && product?.id) {
        const productId = product.id
        const namedLabels = form.labels.filter((l) => l.name.trim())

        // Etiquetas que existían y ya no están → eliminar (independientes entre sí)
        const currentLabelIds = new Set(namedLabels.filter((l) => !isNewId(l.id)).map((l) => l.id))
        const deleteLabelTasks = product.labels
          .filter((original) => !isNewId(original.id) && !currentLabelIds.has(original.id))
          .map((original) => timed(`delete label "${original.name}"`, () => productService.deleteLabel(Number(original.id))))

        // Etiquetas actuales: nuevas → crear, existentes → actualizar + reconciliar — cada una independiente de las demás
        const labelTasks = namedLabels.map((label, i) =>
          isNewId(label.id)
            ? createLabelWithOptions(productId, label, i + 1)
            : saveExistingLabel(productId, label, i + 1, product.labels.find((l) => l.id === label.id))
        )

        await Promise.all([
          timed("update product", () => productService.update(productId, { name: form.name.trim() })),
          ...deleteLabelTasks,
          ...labelTasks,
        ])

        console.log(`[product] update flow OK → ${Date.now() - t0}ms total`)
        productNotify.updated(form.name.trim())
        onSuccess?.(productId)
      } else {
        const created = await timed("create product", () => productService.create({ name: form.name.trim() }))

        const namedLabels = form.labels.filter((l) => l.name.trim())
        await Promise.all(namedLabels.map((label, i) => createLabelWithOptions(created.id, label, i + 1)))

        console.log(`[product] create flow OK → ${Date.now() - t0}ms total`)
        productNotify.created(created.name)
        onSuccess?.(created.id)
      }

      onClose()
    } catch (error) {
      productNotify.error(
        errorMessage(
          error,
          isEditing ? "No se pudieron guardar todos los cambios." : "El producto se creó pero no se pudieron guardar todas las etiquetas."
        )
      )
      onSuccess?.() // refresca la tabla igual — algo puede haber quedado guardado
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            {breadcrumb && (
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span>{breadcrumb}</span>
                <ChevronRightIcon className="size-3" />
                <span>Crear Producto</span>
              </div>
            )}
            <SheetTitle>{isEditing ? "Editar Producto" : "Crear Producto"}</SheetTitle>
            <SheetDescription>
              {isEditing ? "Actualiza la información y etiquetas del producto." : "Crea un nuevo producto."}
            </SheetDescription>
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
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-5">
        {step === 1 && <Step1Info form={form} setForm={setForm} />}
        {step === 2 && <Step2Labels form={form} setForm={setForm} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t p-4">
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
          {step < STEPS.length ? (
            <Button type="button" onClick={handleNext} disabled={!canNext}>
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Guardar" : "Crear Producto"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
