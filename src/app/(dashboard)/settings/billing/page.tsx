import { BillingPanel } from "@/components/settings/billing/BillingPanel"

export default function BillingPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu plan y método de pago</p>
      </div>
      <BillingPanel />
    </main>
  )
}
