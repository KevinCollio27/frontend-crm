"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import type { ContactDetail } from "../data"
import { ActividadesTab } from "./tabs/ActividadesTab"
import { CorreoTab } from "./tabs/CorreoTab"
import { HistorialTab } from "./tabs/HistorialTab"
import { InteresesTab } from "./tabs/InteresesTab"
import { NotasTab } from "./tabs/NotasTab"
import { OportunidadesTab } from "./tabs/OportunidadesTab"

const TABS = [
  { value: "historial",     label: "Historial"     },
  { value: "oportunidades", label: "Oportunidades" },
  { value: "actividades",   label: "Actividades"   },
  { value: "intereses",     label: "Intereses"     },
  { value: "notas",         label: "Notas"         },
  { value: "correo",        label: "Correo"        },
]

interface Props {
  contact: ContactDetail
}

export function Col2Tabs({ contact }: Props) {
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
          <TabsPrimitive.Panel value="historial"     className="outline-none"><HistorialTab     contact={contact} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="oportunidades" className="outline-none"><OportunidadesTab contact={contact} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="actividades"   className="outline-none"><ActividadesTab   contact={contact} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="intereses"     className="outline-none"><InteresesTab     contact={contact} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="notas"         className="outline-none"><NotasTab         contact={contact} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="correo"        className="outline-none"><CorreoTab        contact={contact} /></TabsPrimitive.Panel>
        </div>
      </TabsPrimitive.Root>

    </div>
  )
}
