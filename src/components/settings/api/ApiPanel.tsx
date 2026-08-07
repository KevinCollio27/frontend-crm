"use client"

import * as React from "react"
import {
  CheckCircle2Icon,
  ChevronDown,
  ClipboardCopyIcon,
  CodeIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  UserPlusIcon,
  XCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { workspaceService } from "@/services/workspace.service"
import { flowService } from "@/services/flow.service"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import type { Flow } from "@/types/flow"

const API_BASE_URL = "https://api-crm.goxt.io/api"

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied
        ? <CheckCircle2Icon className="size-4 text-green-600" />
        : <ClipboardCopyIcon className="size-4" />
      }
    </button>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-primary" : "bg-input"}`}
    >
      <span
        className={`pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  )
}

// ─── ApiPanel ─────────────────────────────────────────────────────────────────

export function ApiPanel() {
  const isAdmin = useIsWorkspaceAdmin()
  const [flows, setFlows]                 = React.useState<Flow[]>([])
  const [selectedFlowId, setSelectedFlowId] = React.useState<number | null>(null)
  const [apiToken, setApiToken]           = React.useState<string | null>(null)
  const [showToken, setShowToken]         = React.useState(false)
  const [loading, setLoading]             = React.useState(true)
  const [toggling, setToggling]           = React.useState(false)

  React.useEffect(() => {
    Promise.all([workspaceService.get(), flowService.all()])
      .then(([ws, allFlows]) => {
        setFlows(allFlows)
        setApiToken(ws.api_token)
        const preselect = ws.flow_id
          ? allFlows.find((f) => f.id === ws.flow_id)
          : allFlows[0]
        if (preselect) setSelectedFlowId(preselect.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectedFlow = flows.find((f) => f.id === selectedFlowId)
  const apiEnabled   = !!apiToken
  // Origin propio en vez de una URL fija — así el link sirve igual en local,
  // staging o producción sin tocar código.
  const widgetUrl    = selectedFlowId && apiToken && typeof window !== "undefined"
    ? `${window.location.origin}/widget?flow=${selectedFlowId}&token=${apiToken}`
    : ""

  async function handleToggle(active: boolean) {
    if (!selectedFlowId) return
    setToggling(true)
    try {
      const token = await workspaceService.generateApiToken(active, selectedFlowId)
      setApiToken(token || null)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Widget de Contacto ── */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserPlusIcon className="size-5" />
            </div>
            <div>
              <CardTitle>Widget de Contacto</CardTitle>
              <CardDescription>
                Genera un formulario público para captar leads directamente desde un embudo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">

          {/* Selector de embudo */}
          <div className="space-y-1.5">
            <Label>Embudo de Destino</Label>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" className="w-full justify-between font-normal" />}
                disabled={loading || flows.length === 0}
              >
                {loading
                  ? "Cargando embudos..."
                  : selectedFlow?.name ?? "Seleccionar embudo"
                }
                <ChevronDown className="ml-2 size-4 opacity-50 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--anchor-width]">
                <DropdownMenuRadioGroup
                  value={selectedFlowId ? String(selectedFlowId) : ""}
                  onValueChange={(v) => setSelectedFlowId(Number(v))}
                >
                  {flows.map((f) => (
                    <DropdownMenuRadioItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-xs text-muted-foreground">
              Los nuevos contactos caerán en la primera etapa de este embudo.
            </p>
          </div>

          {/* URL del widget */}
          <div className="space-y-1.5">
            <Label>URL del Widget</Label>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
                {loading
                  ? "Cargando..."
                  : widgetUrl || "Activa la API para obtener la URL del widget"
                }
              </div>
              {widgetUrl && <CopyButton text={widgetUrl} />}
            </div>
          </div>

          {widgetUrl && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => navigator.clipboard.writeText(widgetUrl)}
              >
                <ClipboardCopyIcon className="size-4" />
                Copiar URL
              </Button>
              <Button
                type="button"
                className="gap-2"
                onClick={() => window.open(widgetUrl, "_blank")}
              >
                <ExternalLinkIcon className="size-4" />
                Probar Widget
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Configuración de API ── */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <CodeIcon className="size-5" />
              </div>
              <div>
                <CardTitle>Configuración de API</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Gestiona tu clave de acceso y estado de la API"
                    : "Solo administradores pueden gestionar la API"}
                </CardDescription>
              </div>
            </div>
            <Toggle checked={apiEnabled} onChange={handleToggle} disabled={!isAdmin || toggling || loading} />
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">

          {/* URL Base */}
          <div className="space-y-1.5">
            <Label>URL Base de API</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-sm text-muted-foreground">
                {API_BASE_URL}
              </div>
              <CopyButton text={API_BASE_URL} />
            </div>
          </div>

          {/* Token */}
          <div className="space-y-1.5">
            <Label>Token de Acceso</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                {loading
                  ? "•".repeat(32)
                  : apiToken
                  ? showToken ? apiToken : "•".repeat(32)
                  : "Sin token — activa la API para generarlo"
                }
              </div>
              {apiToken && (
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showToken ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              )}
              {apiToken && <CopyButton text={apiToken} />}
            </div>
            <p className="text-xs text-muted-foreground">
              Mantén este token seguro. Permite acceso completo a tu workspace vía API.
            </p>
          </div>

          {/* Estado */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              {apiEnabled
                ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-green-600" />
                : <XCircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              }
              <div>
                <p className="text-sm font-medium">
                  {apiEnabled ? "API Activa" : "API Desactivada"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {apiEnabled
                    ? "Tu workspace está listo para recibir peticiones."
                    : "Activa la API para comenzar a recibir peticiones."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">¿Qué puedes hacer?</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border bg-background">
                    <UserPlusIcon className="size-3" />
                  </div>
                  <p>
                    <span className="font-medium">Widget de Contacto:</span>{" "}
                    <span className="text-muted-foreground">
                      Crea un formulario público para captar leads directamente a un embudo.
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border bg-background">
                    <CodeIcon className="size-3" />
                  </div>
                  <p>
                    <span className="font-medium">API Rest:</span>{" "}
                    <span className="text-muted-foreground">
                      Integra sistemas externos para crear contactos, organizaciones y oportunidades programáticamente.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
