"use client"

import { FileTextIcon, MessageCircleIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PdfTemplatesTable } from "@/components/settings/pdf-templates/PdfTemplatesTable"
import { WhatsappTemplatesTable } from "@/components/settings/whatsapp-templates/WhatsappTemplatesTable"

export default function TemplatesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Plantillas</h1>
        <p className="text-sm text-muted-foreground">
          Plantillas reutilizables para cotizaciones en PDF y mensajes de WhatsApp.
        </p>
      </div>

      <Tabs defaultValue="pdf">
        <TabsList variant="line">
          <TabsTrigger value="pdf" className="gap-1.5">
            <FileTextIcon className="size-4" />
            PDF
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5">
            <MessageCircleIcon className="size-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="pt-4">
          <PdfTemplatesTable />
        </TabsContent>
        <TabsContent value="whatsapp" className="pt-4">
          <WhatsappTemplatesTable />
        </TabsContent>
      </Tabs>
    </main>
  )
}
