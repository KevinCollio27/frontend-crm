"use client"

import { useState } from "react"
import {
  CheckCircle2Icon,
  ClipboardCopyIcon,
  CodeIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  UserPlusIcon,
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

const FUNNELS = [
  { id: 1, name: "Predeterminado" },
  { id: 2, name: "Carga Internacional" },
]

const API_BASE_URL = "https://api-crm.goxt.io/api"
const FAKE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ3c18xNyIsImlhdCI6MTcxMzAwMDAwMH0.abc123xyz"

function generateWidgetUrl(funnelId: number) {
  return `https://crm.goxt.io/widget?flow=${funnelId}&token=eyJhbGciOiJIUzI1NiJ9.eyJmbG93IjoxN30.placeholder`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

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
      {copied ? <CheckCircle2Icon className="size-4 text-green-600" /> : <ClipboardCopyIcon className="size-4" />}
    </button>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${checked ? "bg-primary" : "bg-input"}`}
    >
      <span
        className={`pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  )
}

export function ApiPanel() {
  const [selectedFunnel, setSelectedFunnel] = useState(FUNNELS[0].id)
  const [apiEnabled, setApiEnabled] = useState(true)
  const [showToken, setShowToken] = useState(false)

  const widgetUrl = generateWidgetUrl(selectedFunnel)

  return (
    <div className="space-y-6">
      {/* Widget de Contacto */}
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
          <div className="space-y-1.5">
            <Label htmlFor="funnel-select">Embudo de Destino</Label>
            <select
              id="funnel-select"
              value={selectedFunnel}
              onChange={(e) => setSelectedFunnel(Number(e.target.value))}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {FUNNELS.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Los nuevos contactos caerán en la primera etapa de este embudo.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>URL del Widget</Label>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
                {widgetUrl}
              </div>
              <CopyButton text={widgetUrl} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(widgetUrl)}>
              <ClipboardCopyIcon className="size-4" />
              Copiar URL
            </Button>
            <Button type="button" className="gap-2" onClick={() => window.open(widgetUrl, "_blank")}>
              <ExternalLinkIcon className="size-4" />
              Probar Widget
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de API */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <CodeIcon className="size-5" />
              </div>
              <div>
                <CardTitle>Configuración de API</CardTitle>
                <CardDescription>Gestiona tu clave de acceso y estado de la API</CardDescription>
              </div>
            </div>
            <Toggle checked={apiEnabled} onChange={setApiEnabled} />
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="space-y-1.5">
            <Label>URL Base de API</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-sm text-muted-foreground">
                {API_BASE_URL}
              </div>
              <CopyButton text={API_BASE_URL} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Token de Acceso</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                {showToken ? FAKE_TOKEN : "•".repeat(32)}
              </div>
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {showToken ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
              <CopyButton text={FAKE_TOKEN} />
            </div>
            <p className="text-xs text-muted-foreground">
              Mantén este token seguro. Permite acceso completo a tu workspace vía API.
            </p>
          </div>

          {/* Estado y doc */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-green-600" />
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
                    <span className="text-muted-foreground">Crea un formulario público para captar leads directamente a un embudo.</span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border bg-background">
                    <CodeIcon className="size-3" />
                  </div>
                  <p>
                    <span className="font-medium">API Rest:</span>{" "}
                    <span className="text-muted-foreground">Integra sistemas externos para crear contactos, organizaciones y oportunidades programáticamente.</span>
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
