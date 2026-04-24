import { ApiPanel } from "@/components/settings/api/ApiPanel"

export default function ApiPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">API & Widget</h1>
        <p className="text-sm text-muted-foreground">
          Conecta sistemas externos y captura leads con tu widget público
        </p>
      </div>
      <ApiPanel />
    </main>
  )
}
