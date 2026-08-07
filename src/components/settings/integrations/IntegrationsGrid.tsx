"use client"

import * as React from "react"
import { ExternalLinkIcon, Loader2Icon, Settings2Icon, UsersIcon, WorkflowIcon } from "lucide-react"
import {
  SiFacebook,
  SiGmail,
  SiInstagram,
  SiSlack,
  SiWhatsapp,
  SiZapier,
} from "react-icons/si"
import { FcGoogle } from "react-icons/fc"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { integrationConfirm } from "@/lib/confirm"
import { integrationNotify } from "@/lib/notify"
import { useIntegrations } from "@/hooks/useIntegrations"
import { integrationService } from "@/services/integration.service"
import { whatsappService } from "@/services/whatsapp.service"
import { instagramService } from "@/services/instagram.service"
import { facebookService } from "@/services/facebook.service"
import type { WorkspaceIntegrationRaw } from "@/types/integration"
import type { FacebookStatusRaw } from "@/types/facebook-conversation"
import { CargoIntegrationSheet } from "./CargoIntegrationSheet"
import { N8nIntegrationSheet } from "./N8nIntegrationSheet"
import { WhatsAppIntegrationSheet } from "./WhatsAppIntegrationSheet"
import { InstagramIntegrationSheet } from "./InstagramIntegrationSheet"

// Metadata visual por proveedor real (backend solo tiene estos 3 sembrados)
const PROVIDER_META: Record<string, { icon?: React.ElementType; image?: string; iconBg: string; iconColor?: string; url?: string; description: string }> = {
  cargo: {
    image: "/images/goxt-cargo.png",
    iconBg: "bg-amber-50",
    url: "https://cargo.goxt.io",
    description: "Sincroniza envíos, clientes y documentos con tu cuenta de GOxT Cargo.",
  },
  "google-calendar": {
    icon: FcGoogle,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    url: "https://calendar.google.com",
    description: "Sincroniza reuniones y seguimientos con tu calendario de Google.",
  },
  n8n: {
    icon: WorkflowIcon,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    url: "https://n8n.io",
    description: "Automatiza flujos de trabajo entre tus herramientas con n8n.",
  },
  gmail: {
    icon: SiGmail,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    url: "https://mail.google.com",
    description: "Conecta tu cuenta de Gmail para gestionar correos desde el CRM.",
  },
  "google-contacts": {
    icon: UsersIcon,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    url: "https://contacts.google.com",
    description: "Trae nombre, teléfono y correo de tus contactos de Google al CRM.",
  },
}

// Sin proveedor real en el backend todavía — se muestran como "Próximamente", sin acción.
interface ComingSoonIntegration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

const COMING_SOON: ComingSoonIntegration[] = [
  { id: "slack", name: "Slack", description: "Recibe notificaciones y alertas en tus canales de Slack.", icon: SiSlack, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: "zapier", name: "Zapier", description: "Conecta miles de aplicaciones con flujos automatizados sin código.", icon: SiZapier, iconBg: "bg-orange-100", iconColor: "text-orange-500" },
]

function ComingSoonCard({ integration }: { integration: ComingSoonIntegration }) {
  const Icon = integration.icon
  return (
    <Card className="py-4 opacity-60">
      <CardContent className="flex items-start gap-3 px-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl overflow-hidden", integration.iconBg)}>
          <Icon className={cn("size-5", integration.iconColor)} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">{integration.name}</p>
            <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Próximamente
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function IntegrationCard({
  providerKey,
  name,
  connection,
  onConfigure,
  connectedActionLabel = "Configurar",
}: {
  providerKey: string
  name: string
  connection: WorkspaceIntegrationRaw | undefined
  onConfigure: (providerKey: string) => void
  connectedActionLabel?: string
}) {
  const meta = PROVIDER_META[providerKey]
  if (!meta) return null
  const { icon: Icon, image, iconBg, iconColor, url, description } = meta
  const connected = !!connection

  return (
    <Card className="py-4">
      <CardContent className="flex items-start gap-3 px-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl overflow-hidden", iconBg)}>
          {image ? (
            <img src={image} alt={name} className="size-full object-cover" />
          ) : Icon ? (
            <Icon className={cn("size-5", iconColor)} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">{name}</p>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                connected
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              {connected ? "Conectado" : "No conectado"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onConfigure(providerKey)}>
              <Settings2Icon className="size-3.5" />
              {connected ? connectedActionLabel : "Conectar"}
            </Button>
            {url && (
              <a href={url} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                  <ExternalLinkIcon className="size-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// WhatsApp no pasa por integration_provider/workspace_integration (modelo genérico) — usa
// su propio modelo (whatsapp_number_config) y rutas dedicadas, así que administra su
// propio estado de conexión en vez de venir de useIntegrations().
function WhatsAppIntegrationCard({ connected, onConfigure }: { connected: boolean; onConfigure: () => void }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-start gap-3 px-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-green-100">
          <SiWhatsapp className="size-5 text-green-600" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">WhatsApp</p>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                connected
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              {connected ? "Conectado" : "No conectado"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Conecta tu número de WhatsApp Business (Meta Cloud API) para este workspace.
          </p>
          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onConfigure}>
              <Settings2Icon className="size-3.5" />
              {connected ? "Configurar" : "Conectar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Instagram tampoco pasa por integration_provider/workspace_integration — mismo motivo
// que WhatsApp: necesita guardar credenciales propias del canal (ig_business_account_id,
// page_id, page_access_token), así que administra su propio estado de conexión.
function InstagramIntegrationCard({ connected, onConfigure }: { connected: boolean; onConfigure: () => void }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-start gap-3 px-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-linear-to-br from-purple-500 to-pink-500">
          <SiInstagram className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">Instagram</p>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                connected
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              {connected ? "Conectado" : "No conectado"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Conecta tu cuenta profesional de Instagram (vía Meta) para este workspace.
          </p>
          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onConfigure}>
              <Settings2Icon className="size-3.5" />
              {connected ? "Configurar" : "Conectar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Facebook Messenger no tiene conexión propia — comparte la Página de Facebook que ya
// quedó guardada al conectar Instagram (mismo page_id/page_access_token). Por eso no abre
// un sheet de OAuth: solo prende/apaga un flag (facebook_messenger_enabled) una vez que
// Instagram ya está conectado.
function FacebookMessengerIntegrationCard({
  status,
  toggling,
  onToggle,
}: {
  status: FacebookStatusRaw | null
  toggling: boolean
  onToggle: () => void
}) {
  const igConnected = status?.instagram_connected ?? false
  const enabled = status?.enabled ?? false

  return (
    <Card className={cn("py-4", !igConnected && "opacity-60")}>
      <CardContent className="flex items-start gap-3 px-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-[#1877F2]">
          <SiFacebook className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">Facebook Messenger</p>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                enabled
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", enabled ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              {enabled ? "Conectado" : "No conectado"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {igConnected
              ? `Usa la misma Página de Facebook que ya conectaste para Instagram${status?.page_name ? ` (${status.page_name})` : ""}.`
              : "Conecta Instagram primero — Messenger comparte esa misma Página."}
          </p>
          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!igConnected || toggling} onClick={onToggle}>
              {toggling ? <Loader2Icon className="size-3.5 animate-spin" /> : <Settings2Icon className="size-3.5" />}
              {enabled ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function IntegrationsGrid() {
  const { providers, connections, loading, refresh } = useIntegrations()
  const [search, setSearch] = React.useState("")
  const [cargoOpen, setCargoOpen] = React.useState(false)
  const [n8nOpen, setN8nOpen] = React.useState(false)
  const [whatsappOpen, setWhatsappOpen] = React.useState(false)
  const [whatsappConnected, setWhatsappConnected] = React.useState(false)
  const [instagramOpen, setInstagramOpen] = React.useState(false)
  const [instagramConnected, setInstagramConnected] = React.useState(false)
  const [facebookStatus, setFacebookStatus] = React.useState<FacebookStatusRaw | null>(null)
  const [facebookToggling, setFacebookToggling] = React.useState(false)

  const refreshWhatsapp = React.useCallback(() => {
    whatsappService.getMetaConfig()
      .then((config) => setWhatsappConnected(!!config))
      .catch(() => setWhatsappConnected(false))
  }, [])

  const refreshInstagram = React.useCallback(() => {
    instagramService.getMetaConfig()
      .then((config) => setInstagramConnected(!!config))
      .catch(() => setInstagramConnected(false))
  }, [])

  const refreshFacebook = React.useCallback(() => {
    facebookService.getStatus()
      .then(setFacebookStatus)
      .catch(() => setFacebookStatus(null))
  }, [])

  React.useEffect(() => {
    refreshWhatsapp()
    refreshInstagram()
    refreshFacebook()
  }, [refreshWhatsapp, refreshInstagram, refreshFacebook])

  async function handleToggleFacebook() {
    setFacebookToggling(true)
    try {
      const next = await facebookService.setEnabled(!facebookStatus?.enabled)
      setFacebookStatus(next)
      if (next.enabled) integrationNotify.connected("Facebook Messenger")
      else integrationNotify.disconnected("Facebook Messenger")
    } catch (error) {
      integrationNotify.error((error as { extraMessage?: string; message?: string })?.extraMessage ?? (error as { message?: string })?.message ?? "No se pudo actualizar Facebook Messenger.")
    } finally {
      setFacebookToggling(false)
    }
  }

  const connectionByProvider = React.useMemo(() => {
    const map = new Map<string, WorkspaceIntegrationRaw>()
    for (const c of connections) if (!map.has(c.provider_key)) map.set(c.provider_key, c)
    return map
  }, [connections])

  // Escucha el aviso que manda la página de callback (abierta en el popup) cuando el
  // usuario termina de autorizar en Google — ver src/app/(public)/auth/google-calendar/callback
  // y src/app/(public)/auth/gmail/callback.
  React.useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === "GOOGLE_CALENDAR_AUTH_SUCCESS") {
        integrationNotify.connected("Google Calendar")
        refresh()
      } else if (event.data?.type === "GOOGLE_CALENDAR_AUTH_ERROR") {
        integrationNotify.error(event.data.message ?? "No se pudo conectar Google Calendar.")
      } else if (event.data?.type === "GMAIL_AUTH_SUCCESS") {
        integrationNotify.connected("Gmail")
        refresh()
      } else if (event.data?.type === "GMAIL_AUTH_ERROR") {
        integrationNotify.error(event.data.message ?? "No se pudo conectar Gmail.")
      } else if (event.data?.type === "GOOGLE_CONTACTS_AUTH_SUCCESS") {
        integrationNotify.connected("Google Contacts")
        refresh()
      } else if (event.data?.type === "GOOGLE_CONTACTS_AUTH_ERROR") {
        integrationNotify.error(event.data.message ?? "No se pudo conectar Google Contacts.")
      }
      // WHATSAPP_AUTH_SUCCESS/ERROR e INSTAGRAM_AUTH_SUCCESS/ERROR ya los maneja cada sheet
      // (necesitan reaccionar inline al caso "elegir número"/"elegir página"), que llaman a
      // refreshWhatsapp()/refreshInstagram() por su prop onSuccess.
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [refresh])

  async function handleConnectGoogleCalendar() {
    try {
      const authUrl = await integrationService.getGoogleCalendarAuthUrl()
      const popup = window.open(authUrl, "google-calendar-oauth", "width=520,height=650")
      if (!popup) {
        integrationNotify.error("El navegador bloqueó la ventana emergente. Habilita los popups para este sitio e intenta de nuevo.")
      }
    } catch (error) {
      integrationNotify.error((error as { message?: string })?.message ?? "No se pudo iniciar la conexión con Google Calendar.")
    }
  }

  async function handleDisconnectGoogleCalendar(connection: WorkspaceIntegrationRaw) {
    const confirmed = await integrationConfirm.disconnect("Google Calendar")
    if (!confirmed) return
    try {
      await integrationService.disconnect(connection.id)
      integrationNotify.disconnected("Google Calendar")
      refresh()
    } catch (error) {
      integrationNotify.error((error as { message?: string })?.message ?? "No se pudo desconectar Google Calendar.")
    }
  }

  async function handleConnectGmail() {
    try {
      const authUrl = await integrationService.getGmailAuthUrl()
      const popup = window.open(authUrl, "gmail-oauth", "width=520,height=650")
      if (!popup) {
        integrationNotify.error("El navegador bloqueó la ventana emergente. Habilita los popups para este sitio e intenta de nuevo.")
      }
    } catch (error) {
      integrationNotify.error((error as { message?: string })?.message ?? "No se pudo iniciar la conexión con Gmail.")
    }
  }

  async function handleDisconnectGmail(connection: WorkspaceIntegrationRaw) {
    const confirmed = await integrationConfirm.disconnect("Gmail")
    if (!confirmed) return
    try {
      await integrationService.disconnect(connection.id)
      integrationNotify.disconnected("Gmail")
      refresh()
    } catch (error) {
      integrationNotify.error((error as { message?: string })?.message ?? "No se pudo desconectar Gmail.")
    }
  }

  async function handleConnectGoogleContacts() {
    try {
      const authUrl = await integrationService.getGoogleContactsAuthUrl()
      const popup = window.open(authUrl, "google-contacts-oauth", "width=520,height=650")
      if (!popup) {
        integrationNotify.error("El navegador bloqueó la ventana emergente. Habilita los popups para este sitio e intenta de nuevo.")
      }
    } catch (error) {
      integrationNotify.error((error as { message?: string })?.message ?? "No se pudo iniciar la conexión con Google Contacts.")
    }
  }

  async function handleDisconnectGoogleContacts(connection: WorkspaceIntegrationRaw) {
    const confirmed = await integrationConfirm.disconnect("Google Contacts")
    if (!confirmed) return
    try {
      await integrationService.disconnect(connection.id)
      integrationNotify.disconnected("Google Contacts")
      refresh()
    } catch (error) {
      integrationNotify.error((error as { message?: string })?.message ?? "No se pudo desconectar Google Contacts.")
    }
  }

  function handleConfigure(providerKey: string) {
    if (providerKey === "cargo") { setCargoOpen(true); return }
    if (providerKey === "n8n") { setN8nOpen(true); return }
    if (providerKey === "whatsapp") { setWhatsappOpen(true); return }
    if (providerKey === "instagram") { setInstagramOpen(true); return }
    if (providerKey === "google-calendar") {
      const existing = connectionByProvider.get("google-calendar")
      if (existing) { handleDisconnectGoogleCalendar(existing); return }
      handleConnectGoogleCalendar()
    }
    if (providerKey === "gmail") {
      const existing = connectionByProvider.get("gmail")
      if (existing) { handleDisconnectGmail(existing); return }
      handleConnectGmail()
    }
    if (providerKey === "google-contacts") {
      const existing = connectionByProvider.get("google-contacts")
      if (existing) { handleDisconnectGoogleContacts(existing); return }
      handleConnectGoogleContacts()
    }
  }

  const availableProviders = providers.filter((p) => PROVIDER_META[p.key])

  const filteredProviders = availableProviders.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (PROVIDER_META[p.key]?.description ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const filteredComingSoon = COMING_SOON.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  )
  const connectedProviders = filteredProviders.filter((p) => connectionByProvider.has(p.key))
  const whatsappMatchesSearch =
    "whatsapp".includes(search.toLowerCase()) ||
    "conecta tu número de whatsapp business (meta cloud api) para este workspace.".includes(search.toLowerCase())
  const instagramMatchesSearch =
    "instagram".includes(search.toLowerCase()) ||
    "conecta tu cuenta profesional de instagram (vía meta) para este workspace.".includes(search.toLowerCase())
  const facebookMatchesSearch =
    "facebook".includes(search.toLowerCase()) || "messenger".includes(search.toLowerCase())
  const facebookConnected = !!facebookStatus?.enabled

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

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2Icon className="mr-2 size-4 animate-spin" /> Cargando integraciones...
        </div>
      ) : (
        <Tabs defaultValue="todas">
          <TabsList variant="line">
            <TabsTrigger value="todas">
              Todas
              <span className="ml-1.5 text-xs text-muted-foreground">
                {filteredProviders.length + filteredComingSoon.length + (whatsappMatchesSearch ? 1 : 0) + (instagramMatchesSearch ? 1 : 0) + (facebookMatchesSearch ? 1 : 0)}
              </span>
            </TabsTrigger>
            <TabsTrigger value="conectadas">
              Conectadas
              <span className="ml-1.5 text-xs text-muted-foreground">
                {connectedProviders.length + (whatsappConnected && whatsappMatchesSearch ? 1 : 0) + (instagramConnected && instagramMatchesSearch ? 1 : 0) + (facebookConnected && facebookMatchesSearch ? 1 : 0)}
              </span>
            </TabsTrigger>
            <TabsTrigger value="proximamente">Próximamente</TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {whatsappMatchesSearch && (
                <WhatsAppIntegrationCard connected={whatsappConnected} onConfigure={() => setWhatsappOpen(true)} />
              )}
              {instagramMatchesSearch && (
                <InstagramIntegrationCard connected={instagramConnected} onConfigure={() => setInstagramOpen(true)} />
              )}
              {facebookMatchesSearch && (
                <FacebookMessengerIntegrationCard status={facebookStatus} toggling={facebookToggling} onToggle={handleToggleFacebook} />
              )}
              {filteredProviders.map((p) => (
                <IntegrationCard
                  key={p.key}
                  providerKey={p.key}
                  name={p.name}
                  connection={connectionByProvider.get(p.key)}
                  onConfigure={handleConfigure}
                  connectedActionLabel={p.key === "google-calendar" || p.key === "gmail" || p.key === "google-contacts" ? "Desconectar" : undefined}
                />
              ))}
              {filteredComingSoon.map((i) => (
                <ComingSoonCard key={i.id} integration={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="conectadas" className="pt-4">
            {connectedProviders.length === 0 && !(whatsappConnected && whatsappMatchesSearch) && !(instagramConnected && instagramMatchesSearch) && !(facebookConnected && facebookMatchesSearch) ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin integraciones conectadas.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {whatsappConnected && whatsappMatchesSearch && (
                  <WhatsAppIntegrationCard connected onConfigure={() => setWhatsappOpen(true)} />
                )}
                {instagramConnected && instagramMatchesSearch && (
                  <InstagramIntegrationCard connected onConfigure={() => setInstagramOpen(true)} />
                )}
                {facebookConnected && facebookMatchesSearch && (
                  <FacebookMessengerIntegrationCard status={facebookStatus} toggling={facebookToggling} onToggle={handleToggleFacebook} />
                )}
                {connectedProviders.map((p) => (
                  <IntegrationCard
                    key={p.key}
                    providerKey={p.key}
                    name={p.name}
                    connection={connectionByProvider.get(p.key)}
                    onConfigure={handleConfigure}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="proximamente" className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredComingSoon.map((i) => (
                <ComingSoonCard key={i.id} integration={i} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <CargoIntegrationSheet
        open={cargoOpen}
        onOpenChange={setCargoOpen}
        connection={connectionByProvider.get("cargo")}
        onSuccess={refresh}
      />
      <N8nIntegrationSheet
        open={n8nOpen}
        onOpenChange={setN8nOpen}
        onConnected={refresh}
      />
      <WhatsAppIntegrationSheet
        open={whatsappOpen}
        onOpenChange={setWhatsappOpen}
        onSuccess={refreshWhatsapp}
      />
      <InstagramIntegrationSheet
        open={instagramOpen}
        onOpenChange={setInstagramOpen}
        onSuccess={refreshInstagram}
      />
    </div>
  )
}
