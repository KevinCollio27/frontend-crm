"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import type { OrganizationDetail } from "../data"
import { ActividadesTab } from "./tabs/ActividadesTab"
import { ContactosTab } from "./tabs/ContactosTab"
import { DesafiosTab } from "./tabs/DesafiosTab"
import { HistorialTab } from "./tabs/HistorialTab"
import { NotasTab } from "./tabs/NotasTab"
import { OportunidadesTab } from "./tabs/OportunidadesTab"

const TABS = [
  { value: "historial",     label: "Historial"     },
  { value: "contactos",     label: "Contactos"     },
  { value: "oportunidades", label: "Oportunidades" },
  { value: "actividades",   label: "Actividades"   },
  { value: "desafios",      label: "Desafíos"      },
  { value: "notas",         label: "Notas"         },
]

interface Props {
  organization: OrganizationDetail
}

export function Col2Tabs({ organization }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden">

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
          <TabsPrimitive.Panel value="historial"     className="outline-none"><HistorialTab     organization={organization} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="contactos"     className="outline-none"><ContactosTab     organization={organization} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="oportunidades" className="outline-none"><OportunidadesTab organization={organization} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="actividades"   className="outline-none"><ActividadesTab   organization={organization} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="desafios"      className="outline-none"><DesafiosTab      organization={organization} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="notas"         className="outline-none"><NotasTab         organization={organization} /></TabsPrimitive.Panel>
        </div>
      </TabsPrimitive.Root>

    </div>
  )
}
