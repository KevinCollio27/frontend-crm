import { FileTextIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { QuotationsTable } from "@/components/dashboard/quotations/QuotationsTable"

export default function QuotationsPage() {
  return (
    <>
      <PageHeader icon={FileTextIcon} title="Cotizaciones" description="Gestiona tus cotizaciones" />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <QuotationsTable />
      </main>
    </>
  )
}
