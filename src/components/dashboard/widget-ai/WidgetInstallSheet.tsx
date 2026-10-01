"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, KeyRoundIcon, Loader2Icon, RefreshCwIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { confirmDialog } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { widgetAIService } from "@/services/widget-ai.service"
import type { WidgetAIRaw } from "@/types/widget-ai"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

const BACKEND_NODE = `const crypto = require("crypto")

const hash = crypto
  .createHmac("sha256", process.env.GOXT_WIDGET_SECRET)
  .update(usuario.email.toLowerCase())
  .digest("hex")`

const BACKEND_PHP = `$hash = hash_hmac("sha256", strtolower($usuario["email"]), getenv("GOXT_WIDGET_SECRET"));`

const FRONT_IDENTIFY = `GoxtWidget.identify({
  email: usuario.email,
  name: usuario.nombre,
  hash: hashCalculadoEnTuBackend,
})`

const FRONT_LOGOUT = `GoxtWidget.logout()`

interface Props {
  widgetId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WidgetInstallSheet({ widgetId, open, onOpenChange }: Props) {
  const [widget, setWidget] = React.useState<WidgetAIRaw | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [regenerating, setRegenerating] = React.useState(false)
  const [showSecret, setShowSecret] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    widgetAIService
      .getById(widgetId)
      .then((w) => { if (!cancelled) setWidget(w) })
      .catch(() => notify.error({ title: "No se pudo cargar el widget" }))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [widgetId])

  const secret = widget?.identity_secret ?? null
  const required = widget?.lead_capture_mode === "identified_only"

  async function handleGenerateSecret() {
    if (!widget) return
    if (secret) {
      const confirmed = await confirmDialog({
        title: "¿Regenerar el secreto?",
        description: "La integración que use el secreto actual dejará de identificar usuarios hasta que la actualices con el nuevo.",
        confirmText: "Sí, regenerar",
        tone: "warning",
      })
      if (!confirmed) return
    }
    setRegenerating(true)
    try {
      const next = await widgetAIService.regenerateIdentitySecret(widget.id)
      setWidget((w) => (w ? { ...w, identity_secret: next } : w))
      setShowSecret(true)
      notify.success({ title: secret ? "Secreto regenerado" : "Secreto generado", description: "Cópialo en el backend de tu sistema." })
    } catch {
      notify.error({ title: "No se pudo generar el secreto" })
    } finally {
      setRegenerating(false)
    }
  }

  const embedCode = widget
    ? `<script\n  src="${API_BASE_URL}/api/widget/embed.js"\n  data-api-key="${widget.api_key}"\n></script>`
    : ""

  const serverRenderedCode = widget
    ? `<script>\n  window.GoxtWidgetUser = { email: "...", name: "...", hash: "..." }\n</script>\n${embedCode}`
    : ""

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 520, padding: 0, gap: 0 }}
        className="w-full"
      >
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            <SheetTitle>Instalación del Widget</SheetTitle>
            <SheetDescription>{widget?.name ?? "Pega este snippet en tu sitio web"}</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        {loading || !widget ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">1. Instalar en tu sitio</h3>
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">API Key:</span>
                <code className="flex-1 truncate font-mono font-medium">{widget.api_key}</code>
                <CopyButton value={widget.api_key} label="API Key copiada" iconOnly />
              </div>
              <CodeBlock code={embedCode} copiedLabel="Código copiado al portapapeles" />
              <p className="text-xs text-muted-foreground">
                Pégalo antes de <code className="rounded bg-muted px-1 font-mono">&lt;/body&gt;</code>. Funciona en
                WordPress, Shopify, Next.js o HTML puro.
              </p>
            </section>

            <section className={cn("space-y-4 rounded-lg border p-4", required ? "border-amber-500/40 bg-amber-500/5" : "bg-muted/20")}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">2. Identificar usuarios</h3>
                  <Badge variant="outline" className={cn("rounded-full text-[10px]", required && "border-amber-500/50 text-amber-600")}>
                    {required ? "Requerido" : "Opcional"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Si tu sistema tiene login, el widget sabrá quién es el usuario sin pedirle el correo, y verá su
                  historial en cualquier dispositivo.
                </p>
                {required && (
                  <p className="flex items-start gap-1.5 pt-1 text-xs text-amber-600">
                    <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                    Este widget está en modo &ldquo;Solo usuarios identificados&rdquo;: sin esta integración el chat no se muestra a nadie.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium">Secreto de identidad</p>
                {secret ? (
                  <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
                    <KeyRoundIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <code className="flex-1 truncate font-mono font-medium">
                      {showSecret ? secret : `${secret.slice(0, 3)}${"•".repeat(20)}${secret.slice(-4)}`}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowSecret((v) => !v)}
                      aria-label={showSecret ? "Ocultar secreto" : "Mostrar secreto"}
                    >
                      {showSecret ? <EyeOffIcon /> : <EyeIcon />}
                    </Button>
                    <CopyButton value={secret} label="Secreto copiado" iconOnly />
                  </div>
                ) : (
                  <Button type="button" size="sm" onClick={handleGenerateSecret} disabled={regenerating}>
                    {regenerating ? <Loader2Icon className="size-3.5 animate-spin" /> : <KeyRoundIcon className="size-3.5" />}
                    Generar secreto
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Guárdalo solo en el backend de tu sistema (por ejemplo como{" "}
                  <code className="rounded bg-muted px-1 font-mono">GOXT_WIDGET_SECRET</code>). Nunca en el navegador.
                </p>
              </div>

              <Step title="Backend: calcula el hash del correo del usuario logueado">
                <CodeBlock code={BACKEND_NODE} label="Node.js" />
                <CodeBlock code={BACKEND_PHP} label="PHP" />
              </Step>

              <Step title="Front: identifica al usuario al iniciar sesión">
                <CodeBlock code={FRONT_IDENTIFY} />
                <p className="text-[11px] text-muted-foreground">
                  Si la página se renderiza en el servidor, puedes dejar el usuario listo antes del script:
                </p>
                <CodeBlock code={serverRenderedCode} />
              </Step>

              <Step title="Al cerrar sesión">
                <CodeBlock code={FRONT_LOGOUT} />
                <p className="text-[11px] text-muted-foreground">
                  Limpia el chat y olvida al usuario, para que en un equipo compartido nadie vea la conversación anterior.
                </p>
              </Step>

              {secret && (
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateSecret} disabled={regenerating}>
                    {regenerating ? <Loader2Icon className="size-3.5 animate-spin" /> : <RefreshCwIcon className="size-3.5" />}
                    Regenerar secreto
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">{title}</p>
      {children}
    </div>
  )
}

function CodeBlock({ code, label, copiedLabel = "Copiado al portapapeles" }: { code: string; label?: string; copiedLabel?: string }) {
  // El botón va en una barra sobre el código y no flotando encima: con líneas largas
  // (el snippet de PHP) el texto quedaba tapado bajo el botón al hacer scroll.
  return (
    <div className="overflow-hidden rounded-lg bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/10 py-1 pr-1.5 pl-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
        <CopyButton value={code} label={copiedLabel} />
      </div>
      <pre className="overflow-x-auto p-3 text-[11.5px] leading-relaxed text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CopyButton({ value, label, iconOnly }: { value: string; label: string; iconOnly?: boolean }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    notify.success({ title: label })
    setTimeout(() => setCopied(false), 2000)
  }

  if (iconOnly) {
    return (
      <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copiar">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    )
  }

  return (
    <Button type="button" size="sm" variant="secondary" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
      {copied ? <><CheckIcon className="size-3" /> Copiado</> : <><CopyIcon className="size-3" /> Copiar</>}
    </Button>
  )
}
