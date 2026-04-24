import { IntegrationsGrid } from "@/components/settings/integrations/IntegrationsGrid"

export default function IntegrationsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Integraciones</h1>
        <p className="text-sm text-muted-foreground">Conecta herramientas externas con tu workspace</p>
      </div>
      <IntegrationsGrid />
    </main>
  )
}
