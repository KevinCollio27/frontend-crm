import { ProductsTable } from "@/components/settings/products/ProductsTable"

export default function ProductsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Productos</h1>
        <p className="text-sm text-muted-foreground">Gestiona los productos disponibles para cotizaciones</p>
      </div>
      <ProductsTable />
    </main>
  )
}
