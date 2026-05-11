"use client"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { ChevronDownIcon } from "lucide-react"
import type { DealDetail } from "../data"
import { ActividadesTab } from "./tabs/ActividadesTab"
import { CorreoTab } from "./tabs/CorreoTab"
import { CotizacionesTab } from "./tabs/CotizacionesTab"
import { DocumentosTab } from "./tabs/DocumentosTab"
import { FacturasTab } from "./tabs/FacturasTab"
import { HistorialTab } from "./tabs/HistorialTab"
import { NotasTab } from "./tabs/NotasTab"
import { WhatsAppTab } from "./tabs/WhatsAppTab"

const TABS = [
  { value: "historial",    label: "Historial"    },
  { value: "notas",        label: "Notas"        },
  { value: "actividades",  label: "Actividades"  },
  { value: "documentos",   label: "Documentos"   },
  { value: "cotizaciones", label: "Cotizaciones" },
  { value: "facturas",     label: "Facturas"     },
  { value: "correo",       label: "Correo"       },
  { value: "whatsapp",     label: "WhatsApp"     },
]

interface Props {
  deal: DealDetail
}

export function Col2Tabs({ deal }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Description */}
      <Collapsible defaultOpen className="shrink-0 border-b px-4 py-3">
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
          <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-3 text-left">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">
              Descripción
            </span>
            <ChevronDownIcon className="size-3.5 text-amber-400 transition-transform group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="px-3.5 pb-3 text-sm leading-relaxed text-amber-900/80">{deal.description}</p>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Tabs */}
      <TabsPrimitive.Root defaultValue="historial" className="flex min-h-0 flex-1 flex-col">
        <TabsPrimitive.List className="flex shrink-0 items-end border-b px-2">
          {TABS.map(({ value, label }) => (
            <TabsPrimitive.Tab
              key={value}
              value={value}
              className="-mb-px cursor-pointer border-b-2 border-b-transparent px-3 pb-2 pt-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none data-active:border-b-foreground data-active:text-foreground"
            >
              {label}
            </TabsPrimitive.Tab>
          ))}
        </TabsPrimitive.List>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsPrimitive.Panel value="historial"   className="outline-none"><HistorialTab    deal={deal} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="notas"        className="outline-none"><NotasTab        deal={deal} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="actividades"  className="outline-none"><ActividadesTab  deal={deal} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="documentos"   className="outline-none"><DocumentosTab   deal={deal} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="cotizaciones" className="outline-none"><CotizacionesTab deal={deal} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="facturas"     className="outline-none"><FacturasTab     deal={deal} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="correo"       className="outline-none"><CorreoTab       deal={deal} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="whatsapp"    className="outline-none"><WhatsAppTab    deal={deal} /></TabsPrimitive.Panel>
        </div>
      </TabsPrimitive.Root>

    </div>
  )
}
