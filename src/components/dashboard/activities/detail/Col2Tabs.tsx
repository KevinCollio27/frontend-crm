"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import type { ActivityDetail } from "../data"
import { HistorialTab } from "./tabs/HistorialTab"
import { NotasTab } from "./tabs/NotasTab"

const TABS = [
  { value: "historial",     label: "Historial"     },
  { value: "notas",         label: "Notas"         },
]

interface Props {
  activity: ActivityDetail
}

export function Col2Tabs({ activity }: Props) {
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
          <TabsPrimitive.Panel value="historial" className="outline-none"><HistorialTab activity={activity} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="notas"     className="outline-none"><NotasTab     activity={activity} /></TabsPrimitive.Panel>
        </div>
      </TabsPrimitive.Root>

    </div>
  )
}
