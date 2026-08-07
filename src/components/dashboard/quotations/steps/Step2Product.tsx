import { PencilIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { ChipList } from "@/components/ui/chip-list"
import { Section } from "@/components/ui/section"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import type { ProductFormState, ProductLabelType } from "@/components/settings/products/shared/form-state"
import type { ProductRaw } from "@/types/product"
import type { QuotationFormState } from "../shared/form-state"

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

// Mismo mapeo que ProductsTable.tsx (productToFormValues), pero directo desde
// ProductRaw — acá no existe el wrapper `Product.raw` que usa esa tabla.
export function productRawToFormValues(product: ProductRaw): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    labels: (product.product_label ?? [])
      .slice()
      .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
      .map((l) => ({
        id: String(l.id),
        name: l.name,
        type: l.type as ProductLabelType,
        options: (l.product_label_option ?? [])
          .slice()
          .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
          .map((o) => ({ id: String(o.id), value: o.value })),
      })),
  }
}

interface Step2ProductProps {
  form:            QuotationFormState
  setForm:         React.Dispatch<React.SetStateAction<QuotationFormState>>
  products:        ProductRaw[]
  productsLoading: boolean
  onCreateProduct: () => void
  onEditProduct:   (product: ProductRaw) => void
}

export function Step2Product({ form, setForm, products, productsLoading, onCreateProduct, onEditProduct }: Step2ProductProps) {
  const selectedProduct = products.find((p) => p.id === form.productId) ?? null
  const isAdmin = useIsWorkspaceAdmin()

  if (productsLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Section title="Producto / Tarifario" description="Cargando productos...">
          <div className="h-9 animate-pulse rounded-lg bg-muted" />
        </Section>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Section title="Producto / Tarifario" description="Aún no tienes productos configurados.">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Necesitas al menos un producto para definir las columnas de la tabla de Servicios.
            </p>
            {isAdmin ? (
              <Button type="button" variant="outline" onClick={onCreateProduct}>
                <PlusIcon className="size-4" /> Crear producto
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Los productos son un recurso compartido del workspace — pídele a un administrador que cree uno en Configuración → Productos.
              </p>
            )}
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Section title="Producto / Tarifario" description="Define qué columnas dinámicas tendrá la tabla de Servicios.">
        <div className="space-y-1.5">
          <div className="flex min-w-0 items-center justify-between gap-1">
            <Label className={FIELD_LABEL}>Producto</Label>
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-5 shrink-0 px-1.5 text-muted-foreground"
                onClick={onCreateProduct}
              >
                <PlusIcon data-icon="inline-start" />
                Crear producto
              </Button>
            )}
          </div>
          <SearchableSelect
            options={products.map((p) => ({ value: String(p.id), label: p.name }))}
            value={form.productId !== null ? String(form.productId) : ""}
            onChange={(v) => setForm((f) => ({ ...f, productId: v ? Number(v) : null, rows: [] }))}
            placeholder="Selecciona un producto"
            searchPlaceholder="Buscar producto..."
          />
        </div>
      </Section>

      {selectedProduct && (
        <Section
          title={`Etiquetas de ${selectedProduct.name}`}
          description="Estas etiquetas serán las columnas dinámicas en el paso Servicios."
          actions={
            isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-6 px-1.5 text-muted-foreground"
                onClick={() => onEditProduct(selectedProduct)}
              >
                <PencilIcon data-icon="inline-start" />
                Editar
              </Button>
            )
          }
        >
          <ChipList items={selectedProduct.product_label.map((l) => l.name)} max={8} />
        </Section>
      )}
    </div>
  )
}
