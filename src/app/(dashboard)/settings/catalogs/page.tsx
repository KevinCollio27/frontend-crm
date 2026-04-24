import { CatalogsGrid } from "@/components/settings/catalogs/CatalogsGrid"

export default function CatalogsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Catálogos</h1>
        <p className="text-sm text-muted-foreground">
          Configura las opciones disponibles para cada campo del sistema
        </p>
      </div>
      <CatalogsGrid />
    </main>
  )
}
