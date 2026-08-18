import { WhatsappCostsPanel } from "@/components/settings/costs/WhatsappCostsPanel"

export default function CostsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Costos</h1>
        <p className="text-sm text-muted-foreground">Cuánto te cuesta operar WhatsApp en este workspace.</p>
      </div>

      <WhatsappCostsPanel />
    </main>
  )
}
