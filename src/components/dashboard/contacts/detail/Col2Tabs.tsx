"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { ActividadesTab }  from "./tabs/ActividadesTab"
import { CorreoTab }       from "./tabs/CorreoTab"
import { HistorialTab }    from "./tabs/HistorialTab"
import { InteresesTab }    from "./tabs/InteresesTab"
import { NotasTab }        from "./tabs/NotasTab"
import { OportunidadesTab } from "./tabs/OportunidadesTab"
import { WhatsAppTab }     from "./tabs/WhatsAppTab"

const TABS = [
  { value: "historial",     label: "Historial"     },
  { value: "oportunidades", label: "Oportunidades" },
  { value: "actividades",   label: "Actividades"   },
  { value: "intereses",     label: "Intereses"     },
  { value: "notas",         label: "Notas"         },
  { value: "correo",        label: "Correo"        },
  { value: "whatsapp",      label: "WhatsApp"      },
]
const VALID_TABS = new Set(TABS.map((t) => t.value))

interface Props {
  contactId:    number
  contactName:  string | null
  contactEmail: string | null
  contactPhone: string | null
}

export function Col2Tabs({ contactId, contactName, contactEmail, contactPhone }: Props) {
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
          <TabsPrimitive.Panel value="historial"     className="outline-none"><HistorialTab     contactId={contactId} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="oportunidades" className="outline-none"><OportunidadesTab contactId={contactId} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="actividades"   className="outline-none"><ActividadesTab   contactId={contactId} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="intereses"     className="outline-none"><InteresesTab     contactId={contactId} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="notas"         className="outline-none"><NotasTab         contactId={contactId} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="correo"        className="outline-none"><CorreoTab        contactId={contactId} contactName={contactName} contactEmail={contactEmail} /></TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="whatsapp"      className="outline-none"><WhatsAppTab      contactId={contactId} contactPhone={contactPhone} /></TabsPrimitive.Panel>
        </div>
      </TabsPrimitive.Root>
    </div>
  )
}
