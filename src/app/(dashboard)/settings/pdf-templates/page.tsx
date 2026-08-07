import { PdfTemplatesTable } from "@/components/settings/pdf-templates/PdfTemplatesTable"

export default function PdfTemplatesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Plantillas</h1>
        <p className="text-sm text-muted-foreground">Plantillas PDF usadas al descargar o enviar cotizaciones.</p>
      </div>
      <PdfTemplatesTable />
    </main>
  )
}
