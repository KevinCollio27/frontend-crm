"use client"

import * as React from "react"
import { ExternalLinkIcon, Settings2Icon, UsersIcon, WorkflowIcon } from "lucide-react"
import {
  SiGmail,
  SiGooglecalendar,
  SiSlack,
  SiWhatsapp,
  SiZapier,
} from "react-icons/si"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type IntegrationStatus = "available" | "coming_soon"

interface Integration {
  id: string
  name: string
  description: string
  icon?: React.ElementType
  image?: string
  iconBg: string
  iconColor?: string
  url?: string
  status: IntegrationStatus
  connected: boolean
}

const integrationList: Integration[] = [
  {
    id: "goxt-cargo",
    name: "GOxT Cargo",
    description: "Sincroniza envíos, clientes y documentos con tu cuenta de GOxT Cargo.",
    image: "/images/goxt-cargo.png",
    iconBg: "bg-amber-50",
    url: "https://cargo.goxt.io",
    status: "available",
    connected: true,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sincroniza reuniones y seguimientos con tu calendario de Google.",
    icon: SiGooglecalendar,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    url: "https://calendar.google.com",
    status: "available",
    connected: false,
  },
  {
    id: "n8n",
    name: "n8n",
    description: "Automatiza flujos de trabajo entre tus herramientas con n8n.",
    icon: WorkflowIcon,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    url: "https://n8n.io",
    status: "available",
    connected: false,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Envía mensajes, recibe respuestas y gestiona conversaciones desde el CRM.",
    icon: SiWhatsapp,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    url: "https://whatsapp.com",
    status: "available",
    connected: false,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Gestiona y envía correos directamente desde tu bandeja de Gmail.",
    icon: SiGmail,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    status: "coming_soon",
    connected: false,
  },
  {
    id: "google-contacts",
    name: "Google Contacts",
    description: "Importa y sincroniza contactos desde Google Contacts al CRM.",
    icon: UsersIcon,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    status: "coming_soon",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Recibe notificaciones y alertas en tus canales de Slack.",
    icon: SiSlack,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    status: "coming_soon",
    connected: false,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Conecta miles de aplicaciones con flujos automatizados sin código.",
    icon: SiZapier,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    status: "coming_soon",
    connected: false,
  },
]

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  )
}

function IntegrationCard({
  integration,
  connected,
  onToggle,
}: {
  integration: Integration
  connected: boolean
  onToggle: (id: string, value: boolean) => void
}) {
  const { id, icon: Icon, image, iconBg, iconColor, name, description, url, status } = integration
  const isComingSoon = status === "coming_soon"

  return (
    <Card className={cn(isComingSoon && "opacity-60")}>
      <CardHeader>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl overflow-hidden",
            iconBg
          )}
        >
          {image ? (
            <img src={image} alt={name} className="size-9 object-contain" />
          ) : Icon ? (
            <Icon className={cn("size-5", iconColor)} />
          ) : null}
        </div>
        <CardAction>
          {!isComingSoon && url && (
            <a href={url} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                <ExternalLinkIcon className="size-3.5" />
              </Button>
            </a>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-semibold text-base leading-snug">{name}</p>
        <p className="text-sm text-muted-foreground leading-snug">{description}</p>
      </CardContent>
      <CardFooter className="justify-between">
        {isComingSoon ? (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Próximamente
          </span>
        ) : (
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings2Icon className="size-3.5" />
              {connected ? "Configurar" : "Conectar"}
            </Button>
            <Toggle checked={connected} onChange={(v) => onToggle(id, v)} />
          </>
        )}
      </CardFooter>
    </Card>
  )
}

function IntegrationGrid({
  integrations,
  connectedMap,
  onToggle,
}: {
  integrations: Integration[]
  connectedMap: Record<string, boolean>
  onToggle: (id: string, value: boolean) => void
}) {
  if (!integrations.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Sin resultados.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          connected={connectedMap[integration.id]}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}

export function IntegrationsGrid() {
  const [search, setSearch] = React.useState("")
  const [connectedMap, setConnectedMap] = React.useState<Record<string, boolean>>(
    Object.fromEntries(integrationList.map((i) => [i.id, i.connected]))
  )

  function handleToggle(id: string, value: boolean) {
    setConnectedMap((prev) => ({ ...prev, [id]: value }))
  }

  const filtered = integrationList.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  )

  const available = filtered.filter((i) => i.status === "available")
  const comingSoon = filtered.filter((i) => i.status === "coming_soon")
  const connected = filtered.filter((i) => i.status === "available" && connectedMap[i.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Buscar integración..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="todas">
        <TabsList variant="line">
          <TabsTrigger value="todas">
            Todas
            <span className="ml-1.5 text-xs text-muted-foreground">
              {filtered.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="conectadas">
            Conectadas
            <span className="ml-1.5 text-xs text-muted-foreground">
              {connected.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="proximamente">Próximamente</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="pt-4">
          <IntegrationGrid
            integrations={filtered}
            connectedMap={connectedMap}
            onToggle={handleToggle}
          />
        </TabsContent>

        <TabsContent value="conectadas" className="pt-4">
          <IntegrationGrid
            integrations={connected}
            connectedMap={connectedMap}
            onToggle={handleToggle}
          />
        </TabsContent>

        <TabsContent value="proximamente" className="pt-4">
          <IntegrationGrid
            integrations={comingSoon}
            connectedMap={connectedMap}
            onToggle={handleToggle}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
