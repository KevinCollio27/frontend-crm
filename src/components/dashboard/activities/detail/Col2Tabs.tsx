"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { HistorialTab } from "./tabs/HistorialTab"
import { NotasTab } from "./tabs/NotasTab"

const TABS = [
  { value: "historial", label: "Historial" },
  { value: "notas",     label: "Notas"     },
]
const VALID_TABS = new Set(TABS.map((t) => t.value))

interface Props {
  activityId: number
}

export function Col2Tabs({ activityId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // La pestaña activa vive en la URL (?tab=notas), no en un defaultValue interno del
  // Tabs — así un F5 (o compartir el link) te deja en la misma pestaña en vez de
  // resetear siempre a "Historial".
  const tabParam = searchParams.get("tab")
  const activeTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "historial"

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TabsPrimitive.Root value={activeTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
        <TabsPrimitive.List className="flex shrink-0 items-end border-b px-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          <TabsPrimitive.Panel value="historial" className="outline-none"><HistorialTab activityId={activityId} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="notas"     className="outline-none"><NotasTab     activityId={activityId} /></TabsPrimitive.Panel>
        </div>
      </TabsPrimitive.Root>
    </div>
  )
}
