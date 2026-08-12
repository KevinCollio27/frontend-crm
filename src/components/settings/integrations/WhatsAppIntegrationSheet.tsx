"use client"

import * as React from "react"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  LoaderCircleIcon,
  LockIcon,
  SmartphoneIcon,
  SparklesIcon,
  XIcon,
  ZapIcon,
} from "lucide-react"

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
import { whatsappService } from "@/services/whatsapp.service"
import { widgetAIService } from "@/services/widget-ai.service"
import type { EmbeddedSignupPhoneRaw, MetaConfigRaw } from "@/types/whatsapp"
import type { WidgetAIRaw } from "@/types/widget-ai"
import { AgentPickerSheet } from "./AgentPickerSheet"

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? ""
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID ?? ""

interface WhatsAppIntegrationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WhatsAppIntegrationSheet({ open, onOpenChange, onSuccess }: WhatsAppIntegrationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 460, padding: 0, gap: 0 }} className="w-full!">
        {open && <WhatsAppForm onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
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

type Tone = "ok" | "warn" | "error" | "unknown"

interface MetaState {
  label: string
  tone: Tone
  reasons: string[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Registro pendiente",
  DISCONNECTED: "Desconectado",
  MIGRATED: "Migrado a otra plataforma",
  BANNED: "Bloqueado por Meta",
  RESTRICTED: "Restringido por Meta",
  FLAGGED: "Marcado por Meta",
  RATE_LIMITED: "Limitado por volumen",
}

// "Operativo" solo cuando Meta confirma que el número puede recibir/enviar — si Meta no
// respondió, se declara desconocido en vez de afirmar que está activo.
function deriveMetaState(c: MetaConfigRaw): MetaState {
  if (!c.meta_live) {
    return { label: "Estado no disponible", tone: "unknown", reasons: ["No se pudo consultar el estado del número en Meta."] }
  }

  const status = (c.status || "").toUpperCase()
  const verification = (c.code_verification_status || "").toUpperCase()
  const mode = (c.account_mode || "").toUpperCase()
  const nameStatus = (c.name_status || "").toUpperCase()

  const reasons: string[] = []
  let hasBlockingIssue = false

  if (status && status !== "CONNECTED") {
    reasons.push(`Estado del número en Meta: ${STATUS_LABELS[status] || status}.`)
    if (["DISCONNECTED", "MIGRATED", "BANNED", "RESTRICTED"].includes(status)) hasBlockingIssue = true
  }
  if (verification && verification !== "VERIFIED") {
    reasons.push("El número no está verificado (falta completar el registro / PIN en Meta).")
    hasBlockingIssue = true
  }
  if (mode === "SANDBOX") reasons.push("Número de prueba (Sandbox): solo conversa con destinatarios autorizados en Meta.")
  if (nameStatus === "PENDING_REVIEW") reasons.push("El nombre para mostrar está en revisión por Meta.")
  if (nameStatus === "DECLINED") reasons.push("El nombre para mostrar fue rechazado por Meta.")

  const connectedOk = status === "CONNECTED" || (!status && verification === "VERIFIED")
  if (connectedOk && !hasBlockingIssue) return { label: "Operativo", tone: "ok", reasons }
  if (reasons.length === 0) return { label: "Conectado", tone: "unknown", reasons }
  return { label: "No operativo", tone: hasBlockingIssue ? "error" : "warn", reasons }
}

// Badge compacto para la lista de selección de número — misma lógica de estado que
// deriveMetaState pero sin el detalle de "reasons" (acá solo interesa un vistazo rápido).
function derivePhoneStatusBadge(phone: EmbeddedSignupPhoneRaw): { label: string; tone: Tone } {
  const status = (phone.status || "").toUpperCase()
  if (status === "CONNECTED") return { label: "Conectado", tone: "ok" }
  if (status === "PENDING") return { label: "Pendiente", tone: "warn" }
  if (["DISCONNECTED", "MIGRATED", "BANNED", "RESTRICTED"].includes(status)) {
    return { label: STATUS_LABELS[status] || "Desconectado", tone: "error" }
  }
  if (status) return { label: STATUS_LABELS[status] || status, tone: "warn" }
  return { label: "Estado desconocido", tone: "unknown" }
}

const TONE_CONTAINER: Record<Tone, string> = {
  ok: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
  warn: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  error: "border-destructive/30 bg-destructive/10",
  unknown: "border-border bg-muted/40",
}

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-emerald-700 dark:text-emerald-400",
  warn: "text-amber-700 dark:text-amber-400",
  error: "text-destructive",
  unknown: "text-muted-foreground",
}

const TONE_BADGE: Record<Tone, string> = {
  ok: "bg-emerald-600 text-white",
  warn: "bg-amber-500 text-white",
  error: "bg-destructive text-destructive-foreground",
  unknown: "bg-muted text-muted-foreground",
}

function WhatsAppForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = React.useState(true)
  const [config, setConfig] = React.useState<MetaConfigRaw | null>(null)

  const [launchingSignup, setLaunchingSignup] = React.useState(false)
  const [signupError, setSignupError] = React.useState<string | null>(null)
  const [phoneNumbers, setPhoneNumbers] = React.useState<EmbeddedSignupPhoneRaw[]>([])
  const [selectedPhoneId, setSelectedPhoneId] = React.useState("")
  const [savingPhone, setSavingPhone] = React.useState(false)

  const [showManualForm, setShowManualForm] = React.useState(false)
  const [phoneNumberId, setPhoneNumberId] = React.useState("")
  const [wabaId, setWabaId] = React.useState("")
  const [savingManual, setSavingManual] = React.useState(false)

  const [disconnecting, setDisconnecting] = React.useState(false)

  const [agentWidget, setAgentWidget] = React.useState<WidgetAIRaw | null>(null)
  const [loadingAgent, setLoadingAgent] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await whatsappService.getMetaConfig()
      setConfig(result)
      setPhoneNumberId(result?.phone_number_id ?? "")
      setWabaId(result?.waba_id ?? "")

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

  function handleLaunchEmbeddedSignup() {
    if (!META_APP_ID || !META_CONFIG_ID) return

    const redirectUri = `${window.location.origin}/auth/whatsapp/callback`
    const extras = JSON.stringify({ setup: {}, featureType: "", sessionInfoVersion: "3" })
    const params = new URLSearchParams({
      client_id: META_APP_ID,
      config_id: META_CONFIG_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "whatsapp_business_management,whatsapp_business_messaging,business_management",
      extras,
    })
    const popup = window.open(
      `https://www.facebook.com/dialog/oauth?${params}`,
      "whatsapp-embedded-signup",
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
      if (event.data?.type !== "WHATSAPP_AUTH_SUCCESS" && event.data?.type !== "WHATSAPP_AUTH_ERROR") return
      window.removeEventListener("message", onMessage)
      setLaunchingSignup(false)

      if (event.data.type === "WHATSAPP_AUTH_ERROR") {
        const msg = event.data.message || "Error al conectar con Meta"
        setSignupError(msg)
        integrationNotify.error(msg)
        return
      }

      setSignupError(null)
      if (event.data.requires_phone_setup) {
        setSignupError("La cuenta de Meta quedó conectada pero no tiene números de WhatsApp. Agrega uno desde WhatsApp Manager y vuelve a intentar.")
        return
      }
      if (event.data.requires_selection) {
        const phones: EmbeddedSignupPhoneRaw[] = event.data.phone_numbers || []
        setPhoneNumbers(phones)
        setSelectedPhoneId(phones.find((p) => p.accessible)?.id || "")
        return
      }
      integrationNotify.connected("WhatsApp")
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

  async function handleSelectPhone() {
    if (!selectedPhoneId) return
    const selected = phoneNumbers.find((p) => p.id === selectedPhoneId)
    setSavingPhone(true)
    try {
      await whatsappService.setMetaConfig(selectedPhoneId, selected?.waba_id)
      setPhoneNumbers([])
      integrationNotify.connected("WhatsApp")
      await load()
      onSuccess()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo guardar el número."))
    } finally {
      setSavingPhone(false)
    }
  }

  async function handleSaveManual(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phoneNumberId.trim()
    if (!trimmed) return
    setSavingManual(true)
    try {
      await whatsappService.setMetaConfig(trimmed, wabaId.trim() || undefined)
      integrationNotify.connected("WhatsApp")
      await load()
      onSuccess()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo guardar el número."))
    } finally {
      setSavingManual(false)
    }
  }

  async function handleDisconnect() {
    const confirmed = await integrationConfirm.disconnect("WhatsApp")
    if (!confirmed) return
    setDisconnecting(true)
    try {
      await whatsappService.disconnectMetaConfig()
      integrationNotify.disconnected("WhatsApp")
      setConfig(null)
      setPhoneNumberId("")
      onSuccess()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo desconectar."))
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSelectAgent(agentId: number) {
    try {
      await whatsappService.setAgent(agentId)
      notify.success({ title: "Agente asignado", description: "Este número ya tiene quién le responda." })
      await load()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo asignar el agente."))
    }
  }

  const metaState = config ? deriveMetaState(config) : null

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>Integrar WhatsApp</SheetTitle>
          <SheetDescription>Conecta el número de WhatsApp Business de este workspace vía Meta Cloud API.</SheetDescription>
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
            {config && metaState ? (
              <div className={`space-y-3 rounded-lg border p-4 ${TONE_CONTAINER[metaState.tone]}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {metaState.tone === "ok" ? (
                      <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                    ) : metaState.tone === "unknown" ? (
                      <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <LockIcon className="size-4 shrink-0 text-amber-600" />
                    )}
                    <span className={`text-sm font-medium ${TONE_TEXT[metaState.tone]}`}>
                      {metaState.tone === "ok" ? "Número operativo" : "Número vinculado"}
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_BADGE[metaState.tone]}`}>
                    {metaState.label}
                  </span>
                </div>

                {metaState.reasons.length > 0 && (
                  <div className="space-y-1 rounded-md border border-black/10 bg-white/50 p-2.5 dark:bg-white/5">
                    <p className={`text-xs font-medium ${TONE_TEXT[metaState.tone]}`}>
                      {metaState.tone === "unknown" ? "No pudimos confirmar el estado en Meta:" : "Este número aún no puede recibir mensajes:"}
                    </p>
                    <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                      {metaState.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {config.display_phone_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Número</p>
                      <p className="text-sm font-semibold">{config.display_phone_number}</p>
                    </div>
                  )}
                  {config.verified_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre verificado</p>
                      <p className="text-sm font-medium">{config.verified_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number ID</p>
                    <p className="font-mono text-xs break-all">{config.phone_number_id}</p>
                  </div>
                  {config.waba_id && (
                    <div>
                      <p className="text-xs text-muted-foreground">WABA ID</p>
                      <p className="font-mono text-xs break-all">{config.waba_id}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-6 text-center">
                <p className="text-sm text-muted-foreground">Aún no hay número conectado</p>
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
                    <p className="text-sm text-muted-foreground">Este número no tiene un agente IA que le responda.</p>
                    <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
                      Elegir agente
                    </Button>
                  </div>
                )}
              </div>
            )}

            {phoneNumbers.length > 0 && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Tu cuenta tiene múltiples números. Elige el que usará este workspace:</p>
                <div className="space-y-2">
                  {phoneNumbers.map((phone) => (
                    <button
                      key={phone.id}
                      type="button"
                      disabled={!phone.accessible}
                      onClick={() => phone.accessible && setSelectedPhoneId(phone.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        !phone.accessible
                          ? "cursor-not-allowed bg-muted/20 opacity-60"
                          : selectedPhoneId === phone.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedPhoneId === phone.id ? "border-primary" : "border-muted-foreground"
                        }`}
                      >
                        {selectedPhoneId === phone.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      {phone.accessible ? (
                        <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <LockIcon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{phone.display_phone_number}</p>
                        <p className="truncate text-xs text-muted-foreground">{phone.verified_name || "Sin nombre verificado"}</p>
                      </div>
                      {(() => {
                        const badge = derivePhoneStatusBadge(phone)
                        return (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${TONE_BADGE[badge.tone]}`}>
                            {badge.label}
                          </span>
                        )
                      })()}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={savingPhone || !selectedPhoneId}
                  onClick={handleSelectPhone}
                >
                  {savingPhone && <LoaderCircleIcon className="size-4 animate-spin" />}
                  Usar este número
                </Button>
              </div>
            )}

            {META_APP_ID && META_CONFIG_ID && phoneNumbers.length === 0 && (
              <div className="space-y-2">
                <Button type="button" className="w-full gap-2" disabled={launchingSignup} onClick={handleLaunchEmbeddedSignup}>
                  {launchingSignup ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ZapIcon className="size-4" />}
                  {config ? "Reconectar con Meta" : "Conectar con Meta"}
                </Button>
                {signupError ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
                    {signupError}
                  </p>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">Puedes conectar una cuenta existente o crear una nueva durante el proceso.</p>
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
                <Field label="Phone Number ID">
                  <Input
                    placeholder="123456789012345"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                </Field>
                <Field label="WABA ID (opcional)">
                  <Input
                    placeholder="1253854923500837"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                </Field>
                <p className="text-xs text-muted-foreground">Pega el identificador del número y, si lo tienes, el de la cuenta de WhatsApp Business (WABA) — evita que el backend tenga que autodetectarlo.</p>
                <Button type="submit" className="w-full" disabled={savingManual || !phoneNumberId.trim()}>
                  {savingManual && <LoaderCircleIcon className="size-4 animate-spin" />}
                  {config ? "Actualizar número" : "Guardar número"}
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
        title="¿Qué agente responde por WhatsApp?"
        currentAgentId={config?.agent_id ?? null}
        onConfirm={handleSelectAgent}
      />
    </>
  )
}
