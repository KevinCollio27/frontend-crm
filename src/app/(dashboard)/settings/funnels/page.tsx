import { FunnelsTable } from "@/components/settings/funnels/FunnelsTable"

export default function FunnelsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Embudos</h1>
        <p className="text-sm text-muted-foreground">Crea y edita los embudos de ventas</p>
      </div>
      <FunnelsTable />
    </main>
  )
}
