"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderCircleIcon,
  SparklesIcon,
  XIcon,
  ZapIcon,
} from "lucide-react"
import { SiInstagram } from "react-icons/si"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { integrationConfirm } from "@/lib/confirm"
import { integrationNotify, notify } from "@/lib/notify"
import { instagramService } from "@/services/instagram.service"
import { widgetAIService } from "@/services/widget-ai.service"
import type { InstagramConfigRaw, InstagramPageOptionRaw } from "@/types/instagram"
import type { WidgetAIRaw } from "@/types/widget-ai"
import { AgentPickerSheet } from "./AgentPickerSheet"

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? ""

interface InstagramIntegrationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InstagramIntegrationSheet({ open, onOpenChange, onSuccess }: InstagramIntegrationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 460, padding: 0, gap: 0 }} className="w-full">
        {open && <InstagramForm onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </SheetContent>
    </Sheet>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  // Para 400, base.controller.ts fija message="Bad Request." y pone el mensaje real
  // en extraMessage — hay que preferirlo cuando venga, o se pierde el detalle del error.
  const e = error as { message?: string; extraMessage?: string }
  return e?.extraMessage || e?.message || fallback
}

function InstagramForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = React.useState(true)
  const [config, setConfig] = React.useState<InstagramConfigRaw | null>(null)

  const [launchingSignup, setLaunchingSignup] = React.useState(false)
  const [signupError, setSignupError] = React.useState<string | null>(null)
  const [pages, setPages] = React.useState<InstagramPageOptionRaw[]>([])
  const [selectedPageId, setSelectedPageId] = React.useState("")
  const [savingPage, setSavingPage] = React.useState(false)

  const [showManualForm, setShowManualForm] = React.useState(false)
  const [pageId, setPageId] = React.useState("")
  const [igBusinessAccountId, setIgBusinessAccountId] = React.useState("")
  const [pageAccessToken, setPageAccessToken] = React.useState("")
  const [savingManual, setSavingManual] = React.useState(false)

  const [disconnecting, setDisconnecting] = React.useState(false)

  const [agentWidget, setAgentWidget] = React.useState<WidgetAIRaw | null>(null)
  const [loadingAgent, setLoadingAgent] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await instagramService.getMetaConfig()
      setConfig(result)
      setPageId(result?.page_id ?? "")
      setIgBusinessAccountId(result?.ig_business_account_id ?? "")

      if (result?.agent_id) {
        setLoadingAgent(true)
        widgetAIService.getById(result.agent_id).then(setAgentWidget).finally(() => setLoadingAgent(false))
      } else {
        setAgentWidget(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function handleLaunchOAuth() {
    if (!META_APP_ID) return

    const redirectUri = `${window.location.origin}/auth/instagram/callback`
    const scope = "instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
    const params = new URLSearchParams({
      client_id: META_APP_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      scope,
    })
    const popup = window.open(
      `https://www.facebook.com/dialog/oauth?${params}`,
      "instagram-oauth",
      "width=620,height=720,scrollbars=yes,resizable=yes"
    )
    if (!popup) {
      integrationNotify.error("El navegador bloqueó la ventana emergente. Habilita los popups para este sitio e intenta de nuevo.")
      return
    }

    setLaunchingSignup(true)
    setSignupError(null)

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== "INSTAGRAM_AUTH_SUCCESS" && event.data?.type !== "INSTAGRAM_AUTH_ERROR") return
      window.removeEventListener("message", onMessage)
      setLaunchingSignup(false)

      if (event.data.type === "INSTAGRAM_AUTH_ERROR") {
        const msg = event.data.message || "Error al conectar con Meta"
        setSignupError(msg)
        integrationNotify.error(msg)
        return
      }

      setSignupError(null)
      if (event.data.requires_selection) {
        const opts: InstagramPageOptionRaw[] = event.data.pages || []
        setPages(opts)
        setSelectedPageId(opts[0]?.page_id || "")
        return
      }
      integrationNotify.connected("Instagram")
      load()
      onSuccess()
    }
    window.addEventListener("message", onMessage)

    const poll = setInterval(() => {
      if (popup.closed) {
        clearInterval(poll)
        window.removeEventListener("message", onMessage)
        setLaunchingSignup(false)
      }
    }, 500)
  }

  async function handleSelectPage() {
    if (!selectedPageId) return
    const selected = pages.find((p) => p.page_id === selectedPageId)
    if (!selected) return
    setSavingPage(true)
    try {
      await instagramService.setMetaConfig(selected.page_id, selected.ig_business_account_id, selected.page_access_token)
      setPages([])
      integrationNotify.connected("Instagram")
      await load()
      onSuccess()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo guardar la cuenta."))
    } finally {
      setSavingPage(false)
    }
  }

  async function handleSaveManual(e: React.FormEvent) {
    e.preventDefault()
    const trimmedPageId = pageId.trim()
    const trimmedIgId = igBusinessAccountId.trim()
    const trimmedToken = pageAccessToken.trim()
    if (!trimmedPageId || !trimmedIgId || !trimmedToken) return
    setSavingManual(true)
    try {
      await instagramService.setMetaConfig(trimmedPageId, trimmedIgId, trimmedToken)
      integrationNotify.connected("Instagram")
      await load()
      onSuccess()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo guardar la cuenta."))
    } finally {
      setSavingManual(false)
    }
  }

  async function handleDisconnect() {
    const confirmed = await integrationConfirm.disconnect("Instagram")
    if (!confirmed) return
    setDisconnecting(true)
    try {
      await instagramService.disconnectMetaConfig()
      integrationNotify.disconnected("Instagram")
      setConfig(null)
      setPageId("")
      setIgBusinessAccountId("")
      onSuccess()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo desconectar."))
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSelectAgent(agentId: number) {
    try {
      await instagramService.setAgent(agentId)
      notify.success({ title: "Agente asignado", description: "Esta cuenta ya tiene quién le responda." })
      await load()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo asignar el agente."))
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>Integrar Instagram</SheetTitle>
          <SheetDescription>Conecta la cuenta profesional de Instagram de este workspace vía Meta.</SheetDescription>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
          <XIcon />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <LoaderCircleIcon className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            {config ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-linear-to-br from-purple-500 to-pink-500">
                    {config.profile_picture_url ? (
                      <img src={config.profile_picture_url} alt="" className="size-full object-cover" />
                    ) : (
                      <SiInstagram className="size-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{config.ig_username ? `@${config.ig_username}` : "Cuenta conectada"}</p>
                    <p className="truncate text-xs text-muted-foreground">{config.page_name ?? "Página de Facebook vinculada"}</p>
                  </div>
                </div>
                {!config.meta_live && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
                    No se pudo consultar el estado en vivo en Meta.
                  </p>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">IG Business Account ID</p>
                  <p className="font-mono text-xs break-all">{config.ig_business_account_id}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-6 text-center">
                <p className="text-sm text-muted-foreground">Aún no hay cuenta de Instagram conectada</p>
              </div>
            )}

            {config && (
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Agente IA</p>
                {loadingAgent ? (
                  <div className="flex items-center justify-center rounded-lg border py-6 text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  </div>
                ) : agentWidget ? (
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <span
                      className="mt-0.5 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: agentWidget.brand_color || "#0F172A" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{agentWidget.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agentWidget.is_active ? "Activo" : "Inactivo"} · {agentWidget.document_count} documento{agentWidget.document_count === 1 ? "" : "s"}
                      </p>
                      {agentWidget.welcome_message && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">&ldquo;{agentWidget.welcome_message}&rdquo;</p>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setPickerOpen(true)}>
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-dashed py-5 text-center">
                    <SparklesIcon className="mx-auto size-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Esta cuenta no tiene un agente IA que le responda.</p>
                    <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
                      Elegir agente
                    </Button>
                  </div>
                )}
              </div>
            )}

            {pages.length > 0 && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Tienes varias Páginas con Instagram vinculado. Elige cuál usará este workspace:</p>
                <div className="space-y-2">
                  {pages.map((page) => (
                    <button
                      key={page.page_id}
                      type="button"
                      onClick={() => setSelectedPageId(page.page_id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        selectedPageId === page.page_id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedPageId === page.page_id ? "border-primary" : "border-muted-foreground"
                        }`}
                      >
                        {selectedPageId === page.page_id && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{page.page_name}</p>
                        <p className="truncate text-xs text-muted-foreground">IG: {page.ig_business_account_id}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={savingPage || !selectedPageId}
                  onClick={handleSelectPage}
                >
                  {savingPage && <LoaderCircleIcon className="size-4 animate-spin" />}
                  Usar esta cuenta
                </Button>
              </div>
            )}

            {META_APP_ID && pages.length === 0 && (
              <div className="space-y-2">
                <Button type="button" className="w-full gap-2" disabled={launchingSignup} onClick={handleLaunchOAuth}>
                  {launchingSignup ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ZapIcon className="size-4" />}
                  {config ? "Reconectar con Meta" : "Conectar con Meta"}
                </Button>
                {signupError ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
                    {signupError}
                  </p>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">Elige la Página de Facebook con tu cuenta de Instagram profesional vinculada.</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowManualForm((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {showManualForm ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
              Conectar manualmente
            </button>

            {showManualForm && (
              <form onSubmit={handleSaveManual} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <Field label="Page ID">
                  <Input
                    placeholder="123456789012345"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                </Field>
                <Field label="IG Business Account ID">
                  <Input
                    placeholder="178414192345678"
                    value={igBusinessAccountId}
                    onChange={(e) => setIgBusinessAccountId(e.target.value)}
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Page Access Token">
                  <Input
                    placeholder="EAAG..."
                    value={pageAccessToken}
                    onChange={(e) => setPageAccessToken(e.target.value)}
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={savingManual || !pageId.trim() || !igBusinessAccountId.trim() || !pageAccessToken.trim()}
                >
                  {savingManual && <LoaderCircleIcon className="size-4 animate-spin" />}
                  {config ? "Actualizar cuenta" : "Guardar cuenta"}
                </Button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t p-4">
        {config ? (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
            Desconectar
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      <AgentPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="¿Qué agente responde por Instagram?"
        currentAgentId={config?.agent_id ?? null}
        onConfirm={handleSelectAgent}
      />
    </>
  )
}
